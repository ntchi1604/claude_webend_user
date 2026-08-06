import { prisma } from './prisma';
import { parseModelIds } from './json';
import { isUnlimitedTokens } from './plans';
import { getActiveSubscriptionOrFree } from './subscription';

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

export function quotaMessage(result: QuotaResult) {
  const resetText = result.resetAt ? `, reset=${result.resetAt.toISOString()}` : '';
  const detail = `limit=${result.limit}, used=${result.used}, remaining=${result.remaining}, window=${result.windowHours}h${resetText}`;

  switch (result.reason) {
    case 'NO_ACTIVE_PLAN':
      return `Không có gói đang hoạt động. ${detail}`;
    case 'MODEL_NOT_FOUND':
      return `Model không khả dụng hoặc chưa được cấu hình. ${detail}`;
    case 'MODEL_NOT_IN_PLAN':
      return `Model không nằm trong gói hiện tại. ${detail}`;
    case 'QUOTA_EXCEEDED':
      return `Bạn đã vượt hạn mức token của gói hiện tại. ${detail}`;
    default:
      return `Không thể kiểm tra hạn mức. ${detail}`;
  }
}

export async function checkQuota(userId: string, modelName: string, estimateTokens = 0): Promise<QuotaResult> {
  const sub = await getActiveSubscriptionOrFree(userId);
  if (!sub) {
    console.log(`[quota] NO_ACTIVE_PLAN user=${userId} model=${modelName}`);
    return { allowed: false, limit: 0, used: 0, remaining: 0, windowHours: 0, resetAt: null, reason: 'NO_ACTIVE_PLAN' };
  }
  const plan = sub.plan;
  const tokenLimit = Number(plan.tokenLimit);
  const unlimitedTokens = isUnlimitedTokens(plan);
  const allowedIds = parseModelIds(plan.modelIds);

  const model = await prisma.model.findUnique({ where: { name: modelName } });
  if (!model || !model.enabled) {
    return { allowed: false, limit: tokenLimit, used: 0, remaining: 0, windowHours: plan.windowHours, resetAt: null, reason: 'MODEL_NOT_FOUND', planName: plan.name, modelAllowed: false };
  }
  if (!allowedIds.includes(model.id)) {
    return { allowed: false, limit: tokenLimit, used: 0, remaining: 0, windowHours: plan.windowHours, resetAt: null, reason: 'MODEL_NOT_IN_PLAN', planName: plan.name, modelAllowed: false };
  }

  const windowMs = plan.windowHours * 3600 * 1000;
  const now = Date.now();

  // Read the stored quotaResetAt
  let resetAt = sub.quotaResetAt;
  const resetMs = resetAt ? resetAt.getTime() : 0;

  console.log(`[quota] ENTRY user=${userId} model=${modelName} estimate=${estimateTokens} quotaResetAt=${resetAt?.toISOString() ?? 'NULL'} resetMs=${resetMs} now=${now} expired=${resetMs <= now} windowMs=${windowMs}`);

  // Window expired or never set → start fresh window
  // Use resetMs instead of getTime() to guard against NaN
  if (!resetAt || !resetMs || isNaN(resetMs) || resetMs <= now) {
    const oldResetAt = resetAt;
    resetAt = new Date(now + windowMs);
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { quotaResetAt: resetAt }
    });
    console.log(`[quota] RESET user=${userId} old=${oldResetAt?.toISOString() ?? 'NULL'} new=${resetAt.toISOString()} limit=${tokenLimit}`);

    // New window — used = 0
    if (!unlimitedTokens && estimateTokens > tokenLimit) {
      return { allowed: false, limit: tokenLimit, used: 0, remaining: tokenLimit, windowHours: plan.windowHours, resetAt, reason: 'QUOTA_EXCEEDED', planName: plan.name, modelAllowed: true };
    }
    return { allowed: true, limit: tokenLimit, used: 0, remaining: unlimitedTokens ? Number.MAX_SAFE_INTEGER : tokenLimit, windowHours: plan.windowHours, resetAt, planName: plan.name, modelAllowed: true };
  }

  // Window is active — count all usage since window started (failed requests with
  // consumed completion tokens still cost the plan, preventing quota-bypass via cancellation)
  const windowStart = new Date(resetMs - windowMs);
  const agg = await prisma.usageLog.aggregate({
    where: {
      userId,
      ts: { gte: windowStart },
      totalTokens: { gt: 0 }
    },
    _sum: { totalTokens: true }
  });
  const used = agg._sum.totalTokens ?? 0;
  const remaining = unlimitedTokens ? Number.MAX_SAFE_INTEGER : Math.max(0, tokenLimit - used);

  console.log(`[quota] ACTIVE user=${userId} model=${modelName} used=${used}/${tokenLimit} remaining=${remaining} windowStart=${windowStart.toISOString()} resetAt=${resetAt.toISOString()} estimate=${estimateTokens} willBlock=${used + estimateTokens > tokenLimit}`);

  if (!unlimitedTokens && used + estimateTokens > tokenLimit) {
    return { allowed: false, limit: tokenLimit, used, remaining, windowHours: plan.windowHours, resetAt, reason: 'QUOTA_EXCEEDED', planName: plan.name, modelAllowed: true };
  }
  return { allowed: true, limit: tokenLimit, used, remaining, windowHours: plan.windowHours, resetAt, planName: plan.name, modelAllowed: true };
}
