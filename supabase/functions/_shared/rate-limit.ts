// Per-caller rate limiting for public and AI endpoints.
// Counters live in the database (`public.api_rate_limits`) so the limit holds
// across all function instances. It is an abuse brake on paid third-party
// quota (Maps / AI), not a security boundary — authorization is enforced in SQL.
// Fails open: if the counter is unavailable the request is allowed through.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

export function callerKey(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for") ?? "";
  return fwd.split(",")[0].trim() || req.headers.get("cf-connecting-ip") || "unknown";
}

/**
 * Returns null when the call is allowed, or a 429 Response when the caller has
 * exceeded `limit` requests inside `windowMs`.
 */
export async function rateLimit(
  req: Request,
  name: string,
  limit: number,
  windowMs: number,
  headers: Record<string, string> = {},
): Promise<Response | null> {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return null;

  try {
    const admin = createClient(url, key, { auth: { persistSession: false } });
    const { data, error } = await admin.rpc("api_rate_limit_hit", {
      _bucket: name,
      _caller: callerKey(req),
      _limit: limit,
      _window_seconds: Math.max(1, Math.round(windowMs / 1000)),
    });
    if (error) {
      console.error("rate-limit unavailable:", error.message);
      return null;
    }
    if (data === false) {
      const retryAfter = Math.max(1, Math.round(windowMs / 1000));
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again in a moment." }),
        {
          status: 429,
          headers: { ...headers, "Content-Type": "application/json", "Retry-After": String(retryAfter) },
        },
      );
    }
  } catch (e) {
    console.error("rate-limit error:", e instanceof Error ? e.message : e);
  }
  return null;
}
