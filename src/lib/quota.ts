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

  // Fixed window anchored to first usage in current cycle
  const windowMs = plan.windowHours * 3600 * 1000;

  // Find the most recent log, then walk back to find window start
  const latest = await prisma.usageLog.findFirst({
    where: { userId },
    orderBy: { ts: 'desc' },
    select: { ts: true }
  });

  let windowStart: Date;
  let resetAt: Date | null = null;
  let used = 0;

  if (!latest) {
    // No usage at all
    windowStart = new Date();
  } else {
    // Find first log that starts the current window cycle
    // Walk backwards: the current window started at the first log
    // whose timestamp is within windowMs of now
    const cutoff = new Date(Date.now() - windowMs);
    const firstInWindow = await prisma.usageLog.findFirst({
      where: { userId, ts: { gt: cutoff } },
      orderBy: { ts: 'asc' },
      select: { ts: true }
    });

    if (firstInWindow) {
      // Window starts at the first usage within the last windowMs
      windowStart = firstInWindow.ts;
      resetAt = new Date(windowStart.getTime() + windowMs);

      // If reset time has passed, window is done — quota is 0
      if (resetAt.getTime() <= Date.now()) {
        windowStart = new Date();
        resetAt = null;
        used = 0;
      } else {
        const agg = await prisma.usageLog.aggregate({
          where: { userId, ts: { gte: windowStart } },
          _sum: { totalTokens: true }
        });
        used = agg._sum.totalTokens ?? 0;
      }
    } else {
      // All logs are older than windowMs — quota fully reset
      windowStart = new Date();
    }
  }

  const remaining = Math.max(0, tokenLimit - used);

  if (used + estimateTokens > tokenLimit) {
    return { allowed: false, limit: tokenLimit, used, remaining, windowHours: plan.windowHours, resetAt, reason: 'QUOTA_EXCEEDED', planName: plan.name, modelAllowed: true };
  }
  return { allowed: true, limit: tokenLimit, used, remaining, windowHours: plan.windowHours, resetAt, planName: plan.name, modelAllowed: true };
}
