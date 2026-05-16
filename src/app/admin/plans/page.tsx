import { prisma } from '@/lib/prisma';
import PlansClient from './plans-client';
import { parseModelIds } from '@/lib/json';

export default async function AdminPlansPage() {
  const plans = await prisma.plan.findMany({ orderBy: { priceVND: 'asc' } });
  const models = await prisma.model.findMany();
  return <PlansClient
    initial={plans.map((p) => ({
      id: p.id, name: p.name, description: p.description,
      tokenLimit: p.tokenLimit, windowHours: p.windowHours, durationDays: p.durationDays,
      priceVND: p.priceVND, modelIds: parseModelIds(p.modelIds), enabled: p.enabled
    }))}
    models={models.map((m) => ({ id: m.id, name: m.name }))}
  />;
}
