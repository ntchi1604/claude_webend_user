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

export type EndpointCandidate = { baseUrl: string; apiKey: string };

export type ResolvedModel = {
  model: { id: string; name: string; provider: string; enabled: boolean };
  upstreamName: string;
  candidates: EndpointCandidate[];
  baseUrl: string;
  apiKey: string;
};

function parseFallbacks(raw: string): EndpointCandidate[] {
  try {
    const value = JSON.parse(raw);
    if (!Array.isArray(value)) return [];

    return value
      .filter((item) => item && typeof item.baseUrl === 'string' && item.baseUrl.trim())
      .map((item) => ({
        baseUrl: String(item.baseUrl).trim(),
        apiKey: String(item.apiKey ?? '').trim()
      }));
  } catch {
    return [];
  }
}

export async function resolveModelEndpoint(modelName: string): Promise<ResolvedModel | null> {
  const model = await prisma.model.findUnique({ where: { name: modelName } });
  if (!model) return null;

  const provider = model.provider || 'openai';
  const envBase = pickBase(provider);
  const envKey = pickKey(provider);
  const primary = {
    baseUrl: (model.endpoint && model.endpoint.trim()) || envBase,
    apiKey: envKey
  };
  const fallbacks = parseFallbacks((model as any).fallbackEndpoints ?? '[]').map((candidate) => ({
    baseUrl: candidate.baseUrl,
    apiKey: candidate.apiKey || envKey
  }));

  return {
    model,
    upstreamName: model.upstreamName,
    candidates: [primary, ...fallbacks],
    baseUrl: primary.baseUrl,
    apiKey: primary.apiKey
  };
}
