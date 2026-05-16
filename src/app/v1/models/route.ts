import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashApiKey } from '@/lib/auth';
import { parseModelIds } from '@/lib/json';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) return new Response(JSON.stringify({ error: { message: 'Invalid API key' } }), { status: 401 });
  const key = await prisma.apiKey.findUnique({
    where: { keyHash: hashApiKey(m[1].trim()) },
    include: { user: { include: { subscriptions: { where: { active: true, expiresAt: { gt: new Date() } }, include: { plan: true } } } } }
  });
  if (!key || !key.active) return new Response(JSON.stringify({ error: { message: 'Invalid API key' } }), { status: 401 });

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
