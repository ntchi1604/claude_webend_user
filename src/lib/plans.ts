type PlanDuration = {
  durationDays: number;
  durationHours?: number | null;
};

export function planDurationMs(plan: PlanDuration) {
  if (plan.durationHours && plan.durationHours > 0) return plan.durationHours * 3600_000;
  return plan.durationDays * 86400_000;
}

export function planExpiresAt(plan: PlanDuration, from = Date.now()) {
  return new Date(from + planDurationMs(plan));
}

export function isUnlimitedTokens(plan: { unlimitedTokens?: boolean | null }) {
  return plan.unlimitedTokens === true;
}