// Nearby vet search via Google Places API (New) through Lovable connector gateway
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Require an authenticated user — this function calls a paid third-party API.
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
    const requested = Math.min(Math.max(Number(body.radius) || 10000, 500), 50000);

    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return jsonResp({ error: "Invalid latitude/longitude" }, 400);
    }

    const fieldMask =
      "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.nationalPhoneNumber,places.internationalPhoneNumber,places.googleMapsUri,places.websiteUri,places.businessStatus,places.types,places.currentOpeningHours.openNow,places.regularOpeningHours.weekdayDescriptions";

    async function search(radius: number) {
      const res = await fetch(`${GATEWAY_URL}/places/v1/places:searchNearby`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": GOOGLE_MAPS_API_KEY,
          "Content-Type": "application/json",
          "X-Goog-FieldMask": fieldMask,
        },
        body: JSON.stringify({
          includedTypes: ["veterinary_care"],
          maxResultCount: 20,
          locationRestriction: { circle: { center: { latitude: lat, longitude: lng }, radius } },
          rankPreference: "DISTANCE",
        }),
      });
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        console.error("nearby-vets: Places API error", res.status, detail);
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

    let places: any[] = [];
    let usedRadius = requested;
    try {
      places = await search(requested);
      // Expand search if nothing found
      if (places.length === 0) {
        for (const r of [25000, 50000]) {
          if (r <= requested) continue;
          usedRadius = r;
          places = await search(r);
          if (places.length > 0) break;
        }
      }
    } catch {
      return jsonResp({ error: "External service error" }, 502);
    }

    return jsonResp({ places, radius_used: usedRadius, expanded: usedRadius !== requested }, 200);
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
