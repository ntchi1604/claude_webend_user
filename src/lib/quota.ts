import { prisma } from './prisma';
import { parseModelIds } from './json';

export type QuotaResult = {
  allowed: boolean;
  limit: number;
  used: number;
  remaining: number;
  windowHours: number;
  resetAt: Date | null;
  reason?: string;
  planName?: string;
  modelAllowed?: boolean;
};

export async function checkQuota(userId: string, modelName: string, estimateTokens = 0): Promise<QuotaResult> {
  const sub = await prisma.subscription.findFirst({
    where: { userId, active: true, expiresAt: { gt: new Date() } },
    orderBy: { expiresAt: 'desc' },
    include: { plan: true }
  });
  if (!sub) {
    return { allowed: false, limit: 0, used: 0, remaining: 0, windowHours: 0, resetAt: null, reason: 'NO_ACTIVE_PLAN' };
  }
  const plan = sub.plan;
  const tokenLimit = Number(plan.tokenLimit);
  const allowedIds = parseModelIds(plan.modelIds);

  const model = await prisma.model.findUnique({ where: { name: modelName } });
  if (!model || !model.enabled) {
    return { allowed: false, limit: tokenLimit, used: 0, remaining: 0, windowHours: plan.windowHours, resetAt: null, reason: 'MODEL_NOT_FOUND', planName: plan.name, modelAllowed: false };
  }
  if (!allowedIds.includes(model.id)) {
    return { allowed: false, limit: tokenLimit, used: 0, remaining: 0, windowHours: plan.windowHours, resetAt: null, reason: 'MODEL_NOT_IN_PLAN', planName: plan.name, modelAllowed: false };
  }

  // Fixed window: find the start of the current window based on earliest usage
  const windowMs = plan.windowHours * 3600 * 1000;
  const earliest = await prisma.usageLog.findFirst({
    where: { userId },
    orderBy: { ts: 'desc' },
    select: { ts: true }
  });

  let windowStart: Date;
  let resetAt: Date | null = null;

  if (!earliest) {
    windowStart = new Date();
  } else {
    // Find the first log to determine window anchor
    const first = await prisma.usageLog.findFirst({
      where: { userId },
      orderBy: { ts: 'asc' },
      select: { ts: true }
    });
    // Calculate which fixed window we're currently in
    const firstTs = first!.ts.getTime();
    const elapsed = Date.now() - firstTs;
    const windowIndex = Math.floor(elapsed / windowMs);
    windowStart = new Date(firstTs + windowIndex * windowMs);
    resetAt = new Date(windowStart.getTime() + windowMs);
  }

  const agg = await prisma.usageLog.aggregate({
    where: { userId, ts: { gte: windowStart } },
    _sum: { totalTokens: true }
  });
  const used = agg._sum.totalTokens ?? 0;
  const remaining = Math.max(0, tokenLimit - used);

  if (used + estimateTokens > tokenLimit) {
    return { allowed: false, limit: tokenLimit, used, remaining, windowHours: plan.windowHours, resetAt, reason: 'QUOTA_EXCEEDED', planName: plan.name, modelAllowed: true };
  }
  return { allowed: true, limit: tokenLimit, used, remaining, windowHours: plan.windowHours, resetAt, planName: plan.name, modelAllowed: true };
}
