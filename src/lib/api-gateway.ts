import { NextRequest } from 'next/server';
import { prisma } from './prisma';
import { hashApiKey, verifySession } from './auth';
import { countTokens } from './tokens';

export type AuthedKey = {
  id: string;
  userId: string;
  active: boolean;
  user: { id: string; banned: boolean; [key: string]: any };
  [key: string]: any;
};

/**
 * Authenticate request via x-api-key / Bearer header.
 * No cookie fallback — used for Anthropic wire format.
 */
export async function authKeyHeaderOnly(req: NextRequest): Promise<AuthedKey | null> {
  const xkey = req.headers.get('x-api-key');
  const auth = req.headers.get('authorization') || '';
  let raw: string | null = null;
  if (xkey) raw = xkey.trim();
  else {
    const m = auth.match(/^Bearer\s+(.+)$/i);
    if (m) raw = m[1].trim();
  }
  if (!raw) return null;
  const key = await prisma.apiKey.findUnique({
    where: { keyHash: hashApiKey(raw) },
    include: { user: true }
  });
  if (!key || !key.active || key.user.banned) return null;
  return key as AuthedKey;
}

/**
 * Authenticate request via Bearer header, with cookie session fallback.
 */
export async function authKeyWithCookie(req: NextRequest): Promise<AuthedKey | null> {
  const auth = req.headers.get('authorization') || '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (m) {
    const raw = m[1].trim();
    const key = await prisma.apiKey.findUnique({
      where: { keyHash: hashApiKey(raw) },
      include: { user: true }
    });
    if (key && key.active && !key.user.banned) return key as AuthedKey;
  }
  const cookieHeader = req.headers.get('cookie') || '';
  const sessionMatch = cookieHeader.match(/cw_session=([^;]+)/);
  if (sessionMatch) {
    const payload = await verifySession(sessionMatch[1]);
    if (!payload) return null;
    const key = await prisma.apiKey.findFirst({
      where: { userId: payload.uid, active: true },
      include: { user: true },
      orderBy: { createdAt: 'asc' }
    });
    if (key) {
      if (key.user.banned) return null;
      return key as AuthedKey;
    }
    const user = await prisma.user.findUnique({ where: { id: payload.uid } });
    if (!user || user.banned) return null;
    return { id: `session_${user.id}`, userId: user.id, user, active: true } as AuthedKey;
  }
  return null;
}

export async function logUsage(
  apiKeyId: string,
  userId: string,
  modelId: string,
  modelName: string,
  pt: number,
  ct: number,
  status: number,
  errorMessage: string | null
) {
  if (apiKeyId.startsWith('session_')) return;
  await prisma.usageLog.create({
    data: { apiKeyId, userId, modelId, modelName, promptTokens: pt, completionTokens: ct, totalTokens: pt + ct, status, errorMessage: errorMessage ?? null }
  });
}

export function estimateCompletion(parsed: any): number {
  try {
    const choices = parsed?.choices ?? [];
    let total = 0;
    for (const c of choices) {
      const content = c?.message?.content;
      if (typeof content === 'string') total += countTokens(content);
    }
    return total;
  } catch { return 0; }
}
