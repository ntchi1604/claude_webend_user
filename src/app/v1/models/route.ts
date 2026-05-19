import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashApiKey, verifySession } from '@/lib/auth';
import { parseModelIds } from '@/lib/json';

export const runtime = 'nodejs';

async function resolveKey(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (m) {
    const key = await prisma.apiKey.findUnique({
      where: { keyHash: hashApiKey(m[1].trim()) },
      include: { user: { include: { subscriptions: { where: { active: true, expiresAt: { gt: new Date() } }, include: { plan: true } } } } }
    });
    if (key && key.active) return key;
  }
  const cookieHeader = req.headers.get('cookie') || '';
  const sessionMatch = cookieHeader.match(/cw_session=([^;]+)/);
  if (sessionMatch) {
    const payload = await verifySession(sessionMatch[1]);
    if (!payload) return null;
    const key = await prisma.apiKey.findFirst({
      where: { userId: payload.uid, active: true },
      include: { user: { include: { subscriptions: { where: { active: true, expiresAt: { gt: new Date() } }, include: { plan: true } } } } },
      orderBy: { createdAt: 'asc' }
    });
    if (key) return key;
  }
  return null;
}

export async function GET(req: NextRequest) {
  const key = await resolveKey(req);
  if (!key) return new Response(JSON.stringify({ error: { message: 'Invalid API key' } }), { status: 401 });

  const sub = key.user.subscriptions[0];
  const allowedIds = sub ? parseModelIds(sub.plan.modelIds) : [];
  const models = await prisma.model.findMany({
    where: { enabled: true, ...(sub ? { id: { in: allowedIds } } : {}) }
  });

  return Response.json({
    object: 'list',
    data: models.map((m) => ({
      id: m.name,
      object: 'model',
      created: Math.floor(m.createdAt.getTime() / 1000),
      owned_by: m.provider
    }))
  });
}
