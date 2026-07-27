import { requireUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import BillingClient from './billing-client';

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const resolvedParams = await searchParams;
  const user = await requireUser();
  const plans = await prisma.plan.findMany({ where: { enabled: true }, orderBy: { priceVND: 'asc' } });
  const bankSetting = await prisma.setting.findUnique({ where: { key: 'bank_info' } });
  const bank = bankSetting ? JSON.parse(bankSetting.value) : null;
  const payments = await prisma.payment.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: { plan: true }
  });
  return (
    <BillingClient
      plans={plans.map((p) => ({ id: p.id, name: p.name, priceVND: Number(p.priceVND), tokenLimit: Number(p.tokenLimit), durationDays: p.durationDays, windowHours: p.windowHours }))}
      bank={bank}
      payments={payments.map((p) => ({ id: p.id, planName: p.plan.name, amountVND: Number(p.amountVND), status: p.status as "PENDING" | "APPROVED" | "REJECTED", createdAt: p.createdAt.toISOString(), reference: p.reference }))}
      selectedPlanId={resolvedParams.plan}
      userEmail={user.email}
    />
  );
}
