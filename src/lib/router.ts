import { prisma } from './prisma';

export async function getRouterConfig() {
  const base = process.env.ROUTER_BASE_URL || 'http://localhost:8000';
  const key = process.env.ROUTER_API_KEY || '';
  return { base, key };
}

export async function resolveModelEndpoint(modelName: string) {
  const m = await prisma.model.findUnique({ where: { name: modelName } });
  if (!m) return null;
  const { base, key } = await getRouterConfig();
  return {
    model: m,
    baseUrl: m.endpoint || base,
    apiKey: key,
    upstreamName: m.upstreamName
  };
}
