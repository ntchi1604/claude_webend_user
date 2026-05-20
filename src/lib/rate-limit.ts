// Simple in-memory sliding-window rate limiter per API key.
// Defaults: 60 RPM, token-per-minute limiting disabled.
// Override via env: RATE_RPM, RATE_TPM

type Bucket = { reqTimes: number[]; tokenStamps: { ts: number; tokens: number }[] };
const buckets = new Map<string, Bucket>();

const RPM = Number(process.env.RATE_RPM || 60);
const TPM = Number(process.env.RATE_TPM || 0);
const WINDOW = 60_000;

function get(id: string): Bucket {
  let b = buckets.get(id);
  if (!b) { b = { reqTimes: [], tokenStamps: [] }; buckets.set(id, b); }
  return b;
}

function prune(b: Bucket, now: number) {
  const cutoff = now - WINDOW;
  while (b.reqTimes.length && b.reqTimes[0] < cutoff) b.reqTimes.shift();
  while (b.tokenStamps.length && b.tokenStamps[0].ts < cutoff) b.tokenStamps.shift();
}

export function checkRateLimit(keyId: string, estimatedTokens = 0): { ok: boolean; reason?: string } {
  const now = Date.now();
  const b = get(keyId);
  prune(b, now);
  if (RPM > 0 && b.reqTimes.length >= RPM) return { ok: false, reason: `RPM limit ${RPM}` };
  const tok = b.tokenStamps.reduce((a, x) => a + x.tokens, 0);
  if (TPM > 0 && tok + estimatedTokens > TPM) return { ok: false, reason: `TPM limit ${TPM}` };
  b.reqTimes.push(now);
  if (estimatedTokens > 0) b.tokenStamps.push({ ts: now, tokens: estimatedTokens });
  return { ok: true };
}

export function recordTokens(keyId: string, tokens: number) {
  const b = get(keyId);
  b.tokenStamps.push({ ts: Date.now(), tokens });
}

// Periodic cleanup
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [k, b] of buckets) {
      prune(b, now);
      if (b.reqTimes.length === 0 && b.tokenStamps.length === 0) buckets.delete(k);
    }
  }, 5 * 60_000).unref?.();
}
