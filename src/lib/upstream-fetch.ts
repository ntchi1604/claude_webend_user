export type FetchCandidate = { baseUrl: string; apiKey: string };

export type UpstreamFetchOptions = {
  path: string;
  candidates: FetchCandidate[];
  buildHeaders: (candidate: FetchCandidate) => Record<string, string>;
  buildBody: () => unknown;
  fetchTimeoutMs?: number;
  maxRetriesPerCandidate?: number;
};

export type UpstreamFetchResult = {
  response: Response;
  candidate: FetchCandidate;
  attempts: number;
};

type BreakerState = { fails: number; openedAt: number };

const breakers = new Map<string, BreakerState>();
const BREAKER_THRESHOLD = 5;
const BREAKER_OPEN_MS = 60 * 1000;
const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);

function isCircuitOpen(baseUrl: string) {
  const state = breakers.get(baseUrl);
  if (!state || state.fails < BREAKER_THRESHOLD) return false;
  return Date.now() - state.openedAt < BREAKER_OPEN_MS;
}

function recordFail(baseUrl: string) {
  const state = breakers.get(baseUrl) ?? { fails: 0, openedAt: 0 };
  const fails = state.fails + 1;
  breakers.set(baseUrl, {
    fails,
    openedAt: fails >= BREAKER_THRESHOLD ? Date.now() : state.openedAt
  });
}

function recordSuccess(baseUrl: string) {
  breakers.delete(baseUrl);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function backoffMs(retryNumber: number) {
  const base = retryNumber === 1 ? 200 : 600;
  return Math.max(0, base + Math.floor(Math.random() * 200) - 100);
}

export async function upstreamFetchWithRetry(opts: UpstreamFetchOptions): Promise<UpstreamFetchResult> {
  const {
    path,
    candidates,
    buildHeaders,
    buildBody,
    fetchTimeoutMs = 5 * 60 * 1000,
    maxRetriesPerCandidate = 2
  } = opts;

  if (candidates.length === 0) throw new Error('No upstream candidates configured');

  let lastErr: unknown = null;
  let totalAttempts = 0;

  for (const candidate of candidates) {
    if (isCircuitOpen(candidate.baseUrl)) {
      lastErr = new Error(`Circuit open for ${candidate.baseUrl}`);
      continue;
    }

    const url = candidate.baseUrl.replace(/\/$/, '') + path;

    for (let attempt = 0; attempt <= maxRetriesPerCandidate; attempt++) {
      totalAttempts++;
      const abortController = new AbortController();
      const timer = setTimeout(() => abortController.abort('fetch_timeout'), fetchTimeoutMs);

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: buildHeaders(candidate),
          body: JSON.stringify(buildBody()),
          signal: abortController.signal
        });

        if (response.ok) {
          recordSuccess(candidate.baseUrl);
          return { response, candidate, attempts: totalAttempts };
        }

        if (!RETRYABLE_STATUS.has(response.status)) {
          recordSuccess(candidate.baseUrl);
          return { response, candidate, attempts: totalAttempts };
        }

        recordFail(candidate.baseUrl);
        lastErr = new Error(`Retryable upstream status ${response.status} from ${candidate.baseUrl}`);
        try { await response.body?.cancel(); } catch { }

        if (attempt < maxRetriesPerCandidate) {
          await sleep(backoffMs(attempt + 1));
          continue;
        }

        break;
      } catch (err) {
        recordFail(candidate.baseUrl);
        lastErr = err;

        if (attempt < maxRetriesPerCandidate) {
          await sleep(backoffMs(attempt + 1));
          continue;
        }

        break;
      } finally {
        clearTimeout(timer);
      }
    }
  }

  throw lastErr instanceof Error ? lastErr : new Error('All upstream candidates failed');
}
