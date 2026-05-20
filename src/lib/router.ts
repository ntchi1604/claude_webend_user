import { prisma } from './prisma';

function pickBase(provider: string) {
  if (provider === 'anthropic') {
    return (
      process.env.ANTHROPIC_UPSTREAM_BASE ||
      process.env.ROUTER_BASE_URL ||
      'https://cc.freemodel.dev'
    );
  }
  return (
    process.env.OPENAI_UPSTREAM_BASE ||
    process.env.ROUTER_BASE_URL ||
    'https://api.freemodel.dev'
  );
}

function pickKey(provider: string) {
  if (provider === 'anthropic') {
    return (
      process.env.ANTHROPIC_UPSTREAM_KEY ||
      process.env.ROUTER_API_KEY ||
      ''
    );
  }
  return (
    process.env.OPENAI_UPSTREAM_KEY ||
    process.env.ROUTER_API_KEY ||
    ''
  );
}

export async function getRouterConfig(provider: string = 'openai') {
  return { base: pickBase(provider), key: pickKey(provider) };
}

export async function resolveModelEndpoint(modelName: string) {
  const m = await prisma.model.findUnique({ where: { name: modelName } });
  if (!m) return null;
  const provider = m.provider || 'openai';
  const base = m.endpoint || pickBase(provider);
  const apiKey = pickKey(provider);
  return {
    model: m,
    baseUrl: base,
    apiKey,
    upstreamName: m.upstreamName
  };
}
