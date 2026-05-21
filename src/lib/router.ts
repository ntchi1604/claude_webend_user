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
  candidates: EndpointCandidate[]; // primary first, then fallbacks
  // Back-compat: phía cũ vẫn dùng baseUrl/apiKey từ ứng viên đầu tiên
  baseUrl: string;
  apiKey: string;
};

function parseFallbacks(raw: string): EndpointCandidate[] {
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((x) => x && typeof x.baseUrl === 'string' && x.baseUrl.trim())
      .map((x) => ({ baseUrl: String(x.baseUrl).trim(), apiKey: String(x.apiKey ?? '').trim() }));
  } catch {
    return [];
  }
}

export async function resolveModelEndpoint(modelName: string): Promise<ResolvedModel | null> {
  const m = await prisma.model.findUnique({ where: { name: modelName } });
  if (!m) return null;
  const provider = m.provider || 'openai';
  const envBase = pickBase(provider);
  const envKey = pickKey(provider);

  const primary: EndpointCandidate = {
    baseUrl: (m.endpoint && m.endpoint.trim()) || envBase,
    apiKey: envKey
  };
  const fallbacks = parseFallbacks((m as any).fallbackEndpoints ?? '[]').map((f) => ({
    baseUrl: f.baseUrl,
    apiKey: f.apiKey || envKey
  }));

  const candidates = [primary, ...fallbacks];

  return {
    model: m,
    upstreamName: m.upstreamName,
    candidates,
    baseUrl: primary.baseUrl,
    apiKey: primary.apiKey
  };
}
