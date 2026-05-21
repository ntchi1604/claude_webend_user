import { prisma } from '@/lib/prisma';
import ModelsClient from './models-client';

export default async function AdminModelsPage() {
  const models = await prisma.model.findMany({ orderBy: { createdAt: 'desc' } });
  return <ModelsClient initial={models.map((m) => ({
    id: m.id, name: m.name, upstreamName: m.upstreamName, endpoint: m.endpoint, fallbackEndpoints: m.fallbackEndpoints,
    provider: m.provider, inputPriceVND: m.inputPriceVND, outputPriceVND: m.outputPriceVND, enabled: m.enabled
  }))} />;
}
