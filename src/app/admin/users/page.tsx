import { prisma } from '@/lib/prisma';
import UsersClient from './users-client';

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      subscriptions: { where: { active: true, expiresAt: { gt: new Date() } }, include: { plan: true } },
      _count: { select: { apiKeys: true, payments: true } }
    },
    take: 200
  });
  const plans = await prisma.plan.findMany({ where: { enabled: true } });

  // Aggregate total tokens per user
  const tokenAgg = await prisma.usageLog.groupBy({
    by: ['userId'],
    _sum: { totalTokens: true }
  });
  const tokenMap = new Map(tokenAgg.map((t) => [t.userId, t._sum.totalTokens ?? 0]));

  return (
    <UsersClient
      users={users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        banned: u.banned,
        createdAt: u.createdAt.toISOString(),
        planName: u.subscriptions[0]?.plan.name ?? null,
        expiresAt: u.subscriptions[0]?.expiresAt.toISOString() ?? null,
        keyCount: u._count.apiKeys,
        paymentCount: u._count.payments,
        totalTokens: tokenMap.get(u.id) ?? 0
      }))}
      plans={plans.map((p) => ({ id: p.id, name: p.name, durationDays: p.durationDays }))}
    />
  );
}
