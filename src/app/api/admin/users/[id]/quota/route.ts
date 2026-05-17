import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';

// GET /api/admin/users/[id]/quota — debug quota state
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  await requireAdmin();
  const userId = params.id;

  const sub = await prisma.subscription.findFirst({
    where: { userId, active: true, expiresAt: { gt: new Date() } },
    orderBy: { expiresAt: 'desc' },
    include: { plan: true }
  });

  if (!sub) {
    return NextResponse.json({ error: 'No active subscription', userId });
  }

  const now = Date.now();
  const windowMs = sub.plan.windowHours * 3600 * 1000;
  const resetAt = sub.quotaResetAt;
  const resetMs = resetAt ? resetAt.getTime() : 0;
  const expired = !resetAt || !resetMs || isNaN(resetMs) || resetMs <= now;

  let used = 0;
  let windowStart: Date | null = null;
  if (!expired && resetAt) {
    windowStart = new Date(resetMs - windowMs);
    const agg = await prisma.usageLog.aggregate({
      where: { userId, ts: { gte: windowStart }, status: 200 },
      _sum: { totalTokens: true }
    });
    used = agg._sum.totalTokens ?? 0;
  }

  const tokenLimit = Number(sub.plan.tokenLimit);

  return NextResponse.json({
    userId,
    plan: sub.plan.name,
    tokenLimit,
    windowHours: sub.plan.windowHours,
    quotaResetAt: resetAt?.toISOString() ?? null,
    resetMs,
    now,
    nowISO: new Date(now).toISOString(),
    expired,
    windowStart: windowStart?.toISOString() ?? null,
    used,
    remaining: Math.max(0, tokenLimit - used),
    expiresAt: sub.expiresAt.toISOString(),
    subscriptionId: sub.id
  });
}

// POST /api/admin/users/[id]/quota — force reset quota
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  await requireAdmin();
  const userId = params.id;

  const sub = await prisma.subscription.findFirst({
    where: { userId, active: true, expiresAt: { gt: new Date() } },
    orderBy: { expiresAt: 'desc' }
  });

  if (!sub) {
    return NextResponse.json({ error: 'No active subscription' }, { status: 404 });
  }

  // Clear quotaResetAt → next request will create fresh window with used=0
  await prisma.subscription.update({
    where: { id: sub.id },
    data: { quotaResetAt: null }
  });

  console.log(`[admin] FORCE RESET quota user=${userId} sub=${sub.id}`);
  return NextResponse.json({ ok: true, message: 'Quota reset. Next request will start fresh window.' });
}
