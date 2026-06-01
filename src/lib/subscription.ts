import { prisma } from './prisma';
import { planExpiresAt } from './plans';

export async function getActiveSubscriptionOrFree(userId: string) {
  const now = new Date();
  const active = await prisma.subscription.findFirst({
    where: { userId, active: true, expiresAt: { gt: now } },
    orderBy: { expiresAt: 'desc' },
    include: { plan: true }
  });
  if (active) return active;

  // Wrap deactivate + create in a transaction to prevent duplicate Free subs
  const free = await prisma.plan.findUnique({ where: { name: 'Free' } });
  if (!free || !free.enabled) return null;

  return prisma.$transaction(async (tx) => {
    // Double-check inside transaction
    const recheck = await tx.subscription.findFirst({
      where: { userId, active: true, expiresAt: { gt: new Date() } },
      include: { plan: true }
    });
    if (recheck) return recheck;

    await tx.subscription.updateMany({
      where: { userId, active: true },
      data: { active: false }
    });

    return tx.subscription.create({
      data: {
        userId,
        planId: free.id,
        expiresAt: planExpiresAt(free),
        quotaResetAt: null
      },
      include: { plan: true }
    });
  });
}
