import 'server-only';

/**
 * Per-client limits for endpoints that cost money (AI, transcription). In memory, so it resets
 * on deploy and is per instance: enough to stop one client running up a bill, not a quota system.
 */
const buckets = new Map<string, number[]>();

export function rateLimited(req: Request, name: string, max: number, windowMs: number) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'local';
  return limitHit(`${name}:${ip}`, max, windowMs);
}

/** Same limit on any key (an email address, a user id). */
export function limitHit(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= max) {
    buckets.set(key, hits);
    return true;
  }
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > 10_000) buckets.clear();
  return false;
}
