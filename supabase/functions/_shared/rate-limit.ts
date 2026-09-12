// Lightweight per-caller rate limiting for public (unauthenticated) endpoints.
// In-memory and per-instance: it is an abuse brake on paid third-party quota
// (Maps / AI), not a security boundary. Authorization is always enforced in SQL.

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function callerKey(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for") ?? "";
  const ip = fwd.split(",")[0].trim() || req.headers.get("cf-connecting-ip") || "unknown";
  return ip;
}

/**
 * Returns null when the call is allowed, or a 429 Response when the caller has
 * exceeded `limit` requests inside `windowMs`.
 */
export function rateLimit(
  req: Request,
  name: string,
  limit: number,
  windowMs: number,
  headers: Record<string, string> = {},
): Response | null {
  const now = Date.now();
  const key = `${name}:${callerKey(req)}`;

  // Opportunistic cleanup so the map cannot grow without bound.
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
  }

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    return new Response(
      JSON.stringify({ error: "Too many requests. Please try again in a moment." }),
      {
        status: 429,
        headers: { ...headers, "Content-Type": "application/json", "Retry-After": String(retryAfter) },
      },
    );
  }
  return null;
}
