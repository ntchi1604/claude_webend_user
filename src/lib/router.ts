import { prisma } from './prisma';

function pickBase(provider: string) {
  if (provider === 'anthropic') {
    return process.env.ANTHROPIC_UPSTREAM_BASE || process.env.ROUTER_BASE_URL || '';
  }

  return process.env.OPENAI_UPSTREAM_BASE || process.env.ROUTER_BASE_URL || '';
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

/**
 * Parse fallbackEndpoints: array of model names để fallback upstream.
 * Accept: ["model-slug"] hoặc [{"modelName":"model-slug"}]
 */
async function parseFallbacks(raw: string): Promise<EndpointCandidate[]> {
  try {
    const value = JSON.parse(raw);
    if (!Array.isArray(value)) return [];

    const refs: string[] = [];
    for (const item of value) {
      if (!item) continue;
      if (typeof item === 'string') { refs.push(item.trim()); continue; }
      if (typeof item.modelName === 'string' && item.modelName.trim()) refs.push(item.modelName.trim());
    }
    if (refs.length === 0) return [];

    const models = await prisma.model.findMany({ where: { name: { in: refs } } });
    return models.map((m) => ({
      baseUrl: (m.endpoint && m.endpoint.trim()) || pickBase(m.provider || 'openai'),
      apiKey: pickKey(m.provider || 'openai')
    })).filter((c) => c.baseUrl);
  } catch {
    return [];
  }
}

export class UpstreamError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: string
  ) {
    super(message);
  }
}

/**
 * Try each candidate in order — first 2xx or <500 wins.
 * 5xx and network errors advance to the next candidate.
 * Auth headers (authorization, x-api-key) are set per-candidate.
 */
export async function tryCandidates(
  candidates: EndpointCandidate[],
  path: string,
  opts: { headers?: Record<string, string>; body?: string; timeout?: number; isAnthropic?: boolean }
): Promise<{ response: Response; candidate: EndpointCandidate }> {
  let last: Error | null = null;
  for (const c of candidates) {
    const baseUrl = c.baseUrl?.replace(/\/$/, '');
    if (!baseUrl) continue;

    const headers: Record<string, string> = { ...opts.headers };
    if (c.apiKey) {
      headers.authorization = `Bearer ${c.apiKey}`;
      if (opts.isAnthropic) headers['x-api-key'] = c.apiKey;
    }

    try {
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), opts.timeout ?? 60_000);
      const response = await fetch(baseUrl + path, {
        method: 'POST',
        headers,
        body: opts.body,
        signal: controller.signal,
      });
      clearTimeout(tid);

      if (response.ok) {
        return { response, candidate: c };
      }

      // Non-2xx — try next candidate
      const text = await response.text().catch(() => '');
      last = new UpstreamError(text.slice(0, 500), response.status, text);
      console.log(`[tryCandidates] ${baseUrl} → ${response.status}, next`);
    } catch (e: any) {
      last = e;
      console.log(`[tryCandidates] ${baseUrl} error: ${e?.message}, next`);
    }
  }
  throw last || new Error('No candidates available');
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
  const fallbacks = await parseFallbacks(model.fallbackEndpoints ?? '[]');

  return {
    model,
    upstreamName: model.upstreamName,
    candidates: [primary, ...fallbacks],
    baseUrl: primary.baseUrl,
    apiKey: primary.apiKey
  };
}
