// In-memory per-user rate limiter (requests per minute, fixed 60s window).
// Lives in module scope so it's shared across requests within a single Node process.
// Note: per process — if you run multiple PM2 instances, the limit applies per instance.

type Bucket = { count: number; windowStart: number };

const buckets = new Map<string, Bucket>();
const WINDOW_MS = 60_000;

// Periodic cleanup so the map doesn't grow unbounded.
let lastSweep = 0;
function sweep(now: number) {
  if (now - lastSweep < WINDOW_MS) return;
  lastSweep = now;
  for (const [k, b] of buckets) {
    if (now - b.windowStart >= WINDOW_MS) buckets.delete(k);
  }
}

export function checkRateLimit(userId: string, limitPerMin: number): { ok: boolean; reason?: string; retryAfter?: number } {
  if (!limitPerMin || limitPerMin <= 0) return { ok: true };
  const now = Date.now();
  sweep(now);

  const b = buckets.get(userId);
  if (!b || now - b.windowStart >= WINDOW_MS) {
    buckets.set(userId, { count: 1, windowStart: now });
    return { ok: true };
  }
  if (b.count >= limitPerMin) {
    const retryAfter = Math.ceil((WINDOW_MS - (now - b.windowStart)) / 1000);
    return { ok: false, reason: `quá ${limitPerMin} req/phút`, retryAfter };
  }
  b.count++;
  return { ok: true };
}

import { prisma } from './prisma';

export async function getUserRequestsPerMinute(userId: string): Promise<number> {
  const sub = await prisma.subscription.findFirst({
    where: { userId, active: true, expiresAt: { gt: new Date() } },
    orderBy: { expiresAt: 'desc' },
    select: { plan: { select: { requestsPerMinute: true } } }
  });
  return sub?.plan.requestsPerMinute ?? 0;
}
