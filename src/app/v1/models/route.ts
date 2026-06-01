import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashApiKey, verifySession } from '@/lib/auth';
import { parseModelIds } from '@/lib/json';

export const runtime = 'nodejs';

async function resolveUser(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (m) {
    const key = await prisma.apiKey.findUnique({
      where: { keyHash: hashApiKey(m[1].trim()) },
      include: { user: { include: { subscriptions: { where: { active: true, expiresAt: { gt: new Date() } }, include: { plan: true } } } } }
    });
    if (key && key.active) return { user: key.user, sub: key.user.subscriptions[0] || null };
  }
  const cookieHeader = req.headers.get('cookie') || '';
  const sessionMatch = cookieHeader.match(/cw_session=([^;]+)/);
  if (sessionMatch) {
    const payload = await verifySession(sessionMatch[1]);
    if (!payload) return null;
    const user = await prisma.user.findUnique({
      where: { id: payload.uid },
      include: { subscriptions: { where: { active: true, expiresAt: { gt: new Date() } }, include: { plan: true } } }
    });
    if (!user || user.banned) return null;
    return { user, sub: user.subscriptions[0] || null };
  }
  return null;
}

export async function GET(req: NextRequest) {
  const result = await resolveUser(req);
  if (!result) return NextResponse.json({ error: { message: 'API key không hợp lệ' } }, { status: 401 });

  const { sub } = result;
  const allowedIds = sub ? parseModelIds(sub.plan.modelIds) : [];
  // No subscription = no models allowed
  if (allowedIds.length === 0) {
    return Response.json({ object: 'list', data: [] });
  }
  const models = await prisma.model.findMany({
    where: { enabled: true, id: { in: allowedIds } }
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
