// Forward + reverse geocoding via Google Geocoding API through Lovable connector gateway.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { rateLimit } from "../_shared/rate-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";

type Components = {
  village: string | null;
  mandal: string | null;
  district: string | null;
  state: string | null;
  pincode: string | null;
  country: string | null;
  formatted: string | null;
  lat: number | null;
  lng: number | null;
};

function pick(comps: any[], types: string[]): string | null {
  for (const t of types) {
    const m = comps.find((c) => Array.isArray(c.types) && c.types.includes(t));
    if (m) return m.long_name || m.short_name || null;
  }
  return null;
}

function parseResult(r: any): Components {
  const comps = r?.address_components || [];
  return {
    village:
      pick(comps, ["locality", "sublocality_level_1", "sublocality", "neighborhood"]),
    mandal: pick(comps, ["administrative_area_level_3", "administrative_area_level_2"]),
    district: pick(comps, ["administrative_area_level_2", "administrative_area_level_3"]),
    state: pick(comps, ["administrative_area_level_1"]),
    pincode: pick(comps, ["postal_code"]),
    country: pick(comps, ["country"]),
    formatted: r?.formatted_address ?? null,
    lat: r?.geometry?.location?.lat ?? null,
    lng: r?.geometry?.location?.lng ?? null,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const limited = await rateLimit(req, "geo-resolve", 60, 60_000, corsHeaders);
  if (limited) return limited;

  try {
    // Public endpoint: geocoding is open to all visitors (no PII).

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GOOGLE_MAPS_API_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!LOVABLE_API_KEY || !GOOGLE_MAPS_API_KEY) {
      console.error("geo-resolve: connector secrets missing");
      return json({ error: "Google Maps connector not configured" }, 500);
    }

    const body = await req.json().catch(() => ({}));
    const mode = body.mode === "forward" ? "forward" : "reverse";

    let url = "";
    if (mode === "reverse") {
      const lat = Number(body.lat), lng = Number(body.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return json({ error: "Invalid latitude/longitude" }, 400);
      }
      url = `${GATEWAY_URL}/maps/api/geocode/json?latlng=${lat},${lng}&region=in&language=en`;
    } else {
      const q = String(body.query || "").trim();
      if (!q || q.length < 2 || q.length > 200) {
        return json({ error: "Invalid query" }, 400);
      }
      // Bias to India.
      url = `${GATEWAY_URL}/maps/api/geocode/json?address=${encodeURIComponent(q)}&components=country:IN&region=in&language=en`;
    }

    const res = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": GOOGLE_MAPS_API_KEY,
      },
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("geo-resolve: geocode error", res.status, detail);
      return json({ error: "External service error" }, 502);
    }
    const data = await res.json();
    if (data.status !== "OK" || !Array.isArray(data.results) || data.results.length === 0) {
      return json({ result: null, results: [] }, 200);
    }
    const parsed = data.results.slice(0, 5).map(parseResult);
    return json({ result: parsed[0], results: parsed }, 200);
  } catch (e) {
    console.error("geo-resolve: unexpected error", e);
    return json({ error: "An unexpected error occurred." }, 500);
  }
});

function json(b: unknown, s: number) {
  return new Response(JSON.stringify(b), {
    status: s,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
