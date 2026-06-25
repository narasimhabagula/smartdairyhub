// Nearby vet search via Google Places API (New) through Lovable connector gateway.
// Supports animal-specific text queries and optional same-state filtering.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";

// Map animal categories -> a text-search query that biases Places toward
// clinics/doctors who treat that animal.
const ANIMAL_QUERIES: Record<string, string> = {
  cow: "cattle veterinary doctor",
  buffalo: "cattle buffalo veterinary doctor",
  goat: "goat sheep veterinary",
  sheep: "sheep goat veterinary",
  hen: "poultry veterinary clinic",
  chicken: "poultry veterinary clinic",
  duck: "poultry veterinary clinic",
  dog: "pet clinic dog veterinary",
  cat: "pet clinic cat veterinary",
  rabbit: "pet clinic rabbit veterinary",
  pig: "pig veterinary",
  horse: "equine horse veterinary",
  birds: "avian bird veterinary",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return jsonResp({ error: "Unauthorized" }, 401);
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: authErr } = await userClient.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (authErr || !userData?.user?.id) {
      return jsonResp({ error: "Unauthorized" }, 401);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GOOGLE_MAPS_API_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!LOVABLE_API_KEY || !GOOGLE_MAPS_API_KEY) {
      console.error("nearby-vets: connector secrets missing");
      return jsonResp({ error: "Google Maps connector not configured" }, 500);
    }

    const body = await req.json().catch(() => ({}));
    const lat = Number(body.lat);
    const lng = Number(body.lng);
    const requested = Math.min(Math.max(Number(body.radius) || 10000, 500), 100000);
    const animal = typeof body.animal === "string" ? body.animal.toLowerCase() : "all";
    const stateFilter = typeof body.state === "string" ? body.state.trim() : "";

    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return jsonResp({ error: "Invalid latitude/longitude" }, 400);
    }

    const fieldMaskNearby =
      "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.nationalPhoneNumber,places.internationalPhoneNumber,places.googleMapsUri,places.websiteUri,places.businessStatus,places.types,places.currentOpeningHours.openNow,places.regularOpeningHours.weekdayDescriptions";

    const useText = animal !== "all" && ANIMAL_QUERIES[animal];

    async function doFetch(radius: number): Promise<Response> {
      if (useText) {
        return await fetch(`${GATEWAY_URL}/places/v1/places:searchText`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${LOVABLE_API_KEY}`,
            "X-Connection-Api-Key": GOOGLE_MAPS_API_KEY,
            "Content-Type": "application/json",
            "X-Goog-FieldMask": fieldMaskNearby,
          },
          body: JSON.stringify({
            textQuery: ANIMAL_QUERIES[animal],
            includedType: "veterinary_care",
            maxResultCount: 20,
            locationBias: { circle: { center: { latitude: lat, longitude: lng }, radius } },
            rankPreference: "DISTANCE",
          }),
        });
      }
      return await fetch(`${GATEWAY_URL}/places/v1/places:searchNearby`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": GOOGLE_MAPS_API_KEY,
          "Content-Type": "application/json",
          "X-Goog-FieldMask": fieldMaskNearby,
        },
        body: JSON.stringify({
          includedTypes: ["veterinary_care"],
          maxResultCount: 20,
          locationRestriction: { circle: { center: { latitude: lat, longitude: lng }, radius } },
          rankPreference: "DISTANCE",
        }),
      });
    }

    async function search(radius: number) {
      let res: Response | null = null;
      let lastDetail = "";
      // Retry transient upstream failures (502/503/504) with short backoff.
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          res = await doFetch(radius);
        } catch (e) {
          lastDetail = String(e);
          await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
          continue;
        }
        if (res.ok) break;
        if (![502, 503, 504].includes(res.status)) break;
        lastDetail = await res.text().catch(() => "");
        await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
      }
      if (!res || !res.ok) {
        console.error("nearby-vets: Places API error", res?.status, lastDetail);
        throw new Error("places_error");
      }
      const data = await res.json();
      return (data.places || []).map((p: any) => ({
        id: p.id,
        name: p.displayName?.text || "Unknown",
        address: p.formattedAddress || null,
        lat: p.location?.latitude ?? null,
        lng: p.location?.longitude ?? null,
        rating: p.rating ?? null,
        total_ratings: p.userRatingCount ?? null,
        phone: p.internationalPhoneNumber || p.nationalPhoneNumber || null,
        maps_url: p.googleMapsUri || null,
        website: p.websiteUri || null,
        open_now: p.currentOpeningHours?.openNow ?? null,
        hours: p.regularOpeningHours?.weekdayDescriptions ?? null,
        types: p.types ?? [],
        business_status: p.businessStatus ?? null,
      }));
    }

    // Dedupe by id, then by (name + lat/lng).
    const dedupe = (arr: any[]) => {
      const seen = new Set<string>();
      return arr.filter((p) => {
        const key = p.id || `${p.name}|${p.lat}|${p.lng}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    };

    // Filter out incomplete entries and (optionally) cross-state results.
    const refine = (arr: any[]) => {
      const cleaned = arr.filter((p) => p.name && p.lat != null && p.lng != null);
      if (!stateFilter) return cleaned;
      const needle = stateFilter.toLowerCase();
      const matched = cleaned.filter((p) =>
        (p.address || "").toLowerCase().includes(needle)
      );
      // If state filter wipes everything, fall back to all results so the user still sees something.
      return matched.length > 0 ? matched : cleaned;
    };

    let places: any[] = [];
    let usedRadius = requested;
    let expanded = false;
    try {
      places = refine(dedupe(await search(requested)));
      if (places.length === 0) {
        for (const r of [25000, 50000, 100000]) {
          if (r <= requested) continue;
          usedRadius = r;
          places = refine(dedupe(await search(r)));
          if (places.length > 0) {
            expanded = true;
            break;
          }
        }
      }
    } catch {
      return jsonResp({ places: [], radius_used: usedRadius, expanded, error: "SERVICE_UNAVAILABLE", fallback: true }, 200);
    }

    return jsonResp({ places, radius_used: usedRadius, expanded }, 200);
  } catch (e) {
    console.error("nearby-vets: unexpected error", e);
    return jsonResp({ error: "An unexpected error occurred. Please try again." }, 500);
  }
});

function jsonResp(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
