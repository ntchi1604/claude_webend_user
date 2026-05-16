import { requireUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { formatNumber, formatVND } from '@/lib/utils';
import { parseModelIds } from '@/lib/json';
import PlanCard from './plan-card';

export default async function PlansPage() {
  const user = await requireUser();
  const plans = await prisma.plan.findMany({ where: { enabled: true }, orderBy: { priceVND: 'asc' } });
  const models = await prisma.model.findMany();
  const modelMap = new Map(models.map((m) => [m.id, m.name]));
  const sub = await prisma.subscription.findFirst({
    where: { userId: user.id, active: true, expiresAt: { gt: new Date() } },
    orderBy: { expiresAt: 'desc' }
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Gói cước</h1>
        <p className="text-zinc-500">Tất cả gói áp dụng cửa sổ rolling — reset theo giờ chạy.</p>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((p) => (
          <PlanCard
            key={p.id}
            id={p.id}
            name={p.name}
            description={p.description}
            price={formatVND(p.priceVND)}
            tokenLimit={formatNumber(p.tokenLimit)}
            windowHours={p.windowHours}
            durationDays={p.durationDays}
            models={parseModelIds(p.modelIds).map((id) => modelMap.get(id)).filter((n): n is string => !!n)}
            current={sub?.planId === p.id}
          />
        ))}
      </div>
    </div>
  );
}
