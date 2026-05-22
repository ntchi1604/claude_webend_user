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

  const free = await prisma.plan.findUnique({ where: { name: 'Free' } });
  if (!free || !free.enabled) return null;

  await prisma.subscription.updateMany({
    where: { userId, active: true },
    data: { active: false }
  });

  return prisma.subscription.create({
    data: {
      userId,
      planId: free.id,
      expiresAt: planExpiresAt(free),
      quotaResetAt: null
    },
    include: { plan: true }
  });
}