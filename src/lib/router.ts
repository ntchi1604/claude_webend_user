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

export type EndpointCandidate = { baseUrl: string; apiKey: string; upstreamName?: string };

export type ResolvedModel = {
  model: { id: string; name: string; provider: string; enabled: boolean; imageFallbackModel: string | null };
  upstreamName: string;
  candidates: EndpointCandidate[];
  baseUrl: string;
  apiKey: string;
};

/** Parse fallbackEndpoints as an ordered array of Model.upstreamName values. */
async function parseFallbacks(raw: string): Promise<EndpointCandidate[]> {
  try {
    const value = JSON.parse(raw);
    if (!Array.isArray(value)) return [];

    const refs: string[] = [];
    for (const item of value) {
      if (!item) continue;
      if (typeof item === 'string') { refs.push(item.trim()); continue; }
      if (typeof item.upstreamName === 'string' && item.upstreamName.trim()) refs.push(item.upstreamName.trim());
    }
    if (refs.length === 0) return [];

    const models = await prisma.model.findMany({
      where: { upstreamName: { in: refs } },
      orderBy: { createdAt: 'asc' }
    });
    const modelsByUpstream = new Map<string, (typeof models)[number]>();
    for (const model of models) {
      if (!modelsByUpstream.has(model.upstreamName)) modelsByUpstream.set(model.upstreamName, model);
    }

    const found = new Set(modelsByUpstream.keys());
    const missing = refs.filter((r) => !found.has(r));
    if (missing.length > 0) console.warn(`[parseFallbacks] Upstream model(s) not found in DB: ${missing.join(', ')}`);

    return refs
      .map((ref) => modelsByUpstream.get(ref))
      .filter((model): model is (typeof models)[number] => !!model)
      .map((model) => ({
        baseUrl: (model.endpoint && model.endpoint.trim()) || pickBase(model.provider || 'openai'),
        apiKey: pickKey(model.provider || 'openai'),
        upstreamName: model.upstreamName
      }))
      .filter((candidate) => candidate.baseUrl);
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

export function buildUpstreamUrl(baseUrl: string, path: string) {
  const normalizedBase = baseUrl.replace(/\/+$/, '');
  const normalizedPath = `/${path.replace(/^\/+/, '')}`;

  // Endpoint settings commonly include /v1 already, while gateway routes do too.
  // Avoid forwarding requests to /v1/v1/messages or /v1/v1/chat/completions.
  if (/\/v1$/i.test(normalizedBase) && /^\/v1(?:\/|$)/i.test(normalizedPath)) {
    return normalizedBase + normalizedPath.slice(3);
  }

  return normalizedBase + normalizedPath;
}

/**
 * Try each candidate in order.
 * Detects errors via: HTTP status (non-2xx) OR embedded error in JSON body (HTTP 200 + {"error":...}).
 * OneAPI/OneHub proxy often returns HTTP 200 with error inside body — we must check for that.
 * Auth headers (authorization, x-api-key) are set per-candidate.
 * If bodyBuilder provided, it's called per-candidate to allow per-candidate request body (e.g. different upstreamName).
 */
export async function tryCandidates(
  candidates: EndpointCandidate[],
  path: string,
  opts: { headers?: Record<string, string>; body?: string; bodyBuilder?: (candidate: EndpointCandidate) => string; timeout?: number; isAnthropic?: boolean }
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

    const body = opts.bodyBuilder ? opts.bodyBuilder(c) : opts.body;

    try {
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), opts.timeout ?? 60_000);
      const response = await fetch(buildUpstreamUrl(baseUrl, path), {
        method: 'POST',
        headers,
        body,
        signal: controller.signal,
      });
      clearTimeout(tid);

      // Non-2xx → advance
      if (!response.ok) {
        const text = await response.text().catch(() => '');
        last = new UpstreamError(text.slice(0, 500), response.status, text);
        console.log(`[tryCandidates] ${baseUrl} → ${response.status}, next`);
        continue;
      }

      // HTTP 200 — peek JSON body for embedded error (OneAPI/OneHub pattern)
      const ct = response.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        const cloned = response.clone();
        const peek = await cloned.text().catch(() => '');
        try {
          const json = JSON.parse(peek);
          if (json?.error) {
            const errMsg = typeof json.error === 'string'
              ? json.error
              : json.error?.message || JSON.stringify(json.error).slice(0, 200);
            last = new UpstreamError(errMsg.slice(0, 500), 502, peek);
            console.log(`[tryCandidates] ${baseUrl} → 200+error: "${errMsg.slice(0, 100)}", next`);
            continue;
          }
          // Some proxies return {"code": 4xx/5xx, "message": "..."} without "error" key
          if (json?.code && typeof json.code === 'number' && json.code >= 400) {
            const errMsg = json.message || JSON.stringify(json).slice(0, 200);
            last = new UpstreamError(errMsg.slice(0, 500), 502, peek);
            console.log(`[tryCandidates] ${baseUrl} → 200+code=${json.code}: "${errMsg.slice(0, 100)}", next`);
            continue;
          }
        } catch { /* not JSON — pass through */ }
      }

      return { response, candidate: c };
    } catch (e: any) {
      last = e;
      console.log(`[tryCandidates] ${baseUrl} error: ${e?.message}, next`);
    }
  }
  throw last || new Error('No candidates available');
}

type ModelRecord = NonNullable<Awaited<ReturnType<typeof prisma.model.findFirst>>>;

async function resolveModelRecord(model: ModelRecord | null): Promise<ResolvedModel | null> {
  if (!model) return null;

  const provider = model.provider || 'openai';
  const envBase = pickBase(provider);
  const envKey = pickKey(provider);
  const primary = {
    baseUrl: (model.endpoint && model.endpoint.trim()) || envBase,
    apiKey: envKey,
    upstreamName: model.upstreamName
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

export async function resolveModelEndpoint(modelName: string): Promise<ResolvedModel | null> {
  const model = await prisma.model.findUnique({ where: { name: modelName } });
  return resolveModelRecord(model);
}

export async function resolveModelEndpointByUpstreamName(upstreamName: string): Promise<ResolvedModel | null> {
  const model = await prisma.model.findFirst({
    where: { upstreamName },
    orderBy: { createdAt: 'asc' }
  });
  return resolveModelRecord(model);
}
