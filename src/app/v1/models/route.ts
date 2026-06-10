import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/auth';
import { parseModelIds } from '@/lib/json';
import { authKeyHeaderOnly } from '@/lib/api-gateway';

export const runtime = 'nodejs';

async function resolveUser(req: NextRequest) {
  const headerKey = await authKeyHeaderOnly(req);
  if (headerKey) {
    const user = await prisma.user.findUnique({
      where: { id: headerKey.userId },
      include: { subscriptions: { where: { active: true, expiresAt: { gt: new Date() } }, include: { plan: true } } }
    });
    if (user && !user.banned) return { user, sub: user.subscriptions[0] || null };
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

  const data = models.map((m) => ({
    type: 'model',
    id: m.name,
    display_name: m.name,
    created_at: m.createdAt.toISOString(),
    object: 'model',
    created: Math.floor(m.createdAt.getTime() / 1000),
    owned_by: m.provider
  }));

  return Response.json({
    object: 'list',
    data,
    first_id: data[0]?.id ?? null,
    last_id: data[data.length - 1]?.id ?? null,
    has_more: false
  });
}
