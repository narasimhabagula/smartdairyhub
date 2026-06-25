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
    const { data: claims, error: authErr } = await userClient.auth.getClaims(
      authHeader.replace("Bearer ", ""),
    );
    if (authErr || !claims?.claims?.sub) {
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
    const radius = Math.min(Math.max(Number(body.radius) || 15000, 500), 50000);

    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return jsonResp({ error: "Invalid latitude/longitude" }, 400);
    }

    const placesRes = await fetch(`${GATEWAY_URL}/places/v1/places:searchNearby`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": GOOGLE_MAPS_API_KEY,
        "Content-Type": "application/json",
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.nationalPhoneNumber,places.internationalPhoneNumber,places.googleMapsUri,places.businessStatus,places.currentOpeningHours.openNow",
      },
      body: JSON.stringify({
        includedTypes: ["veterinary_care"],
        maxResultCount: 20,
        locationRestriction: {
          circle: { center: { latitude: lat, longitude: lng }, radius },
        },
        rankPreference: "DISTANCE",
      }),
    });

    if (!placesRes.ok) {
      const detail = await placesRes.text().catch(() => "");
      console.error("nearby-vets: Places API error", placesRes.status, detail);
      return jsonResp({ error: "External service error" }, 502);
    }

    const data = await placesRes.json();
    const places = (data.places || []).map((p: any) => ({
      id: p.id,
      name: p.displayName?.text || "Unknown",
      address: p.formattedAddress || null,
      lat: p.location?.latitude ?? null,
      lng: p.location?.longitude ?? null,
      rating: p.rating ?? null,
      total_ratings: p.userRatingCount ?? null,
      phone: p.internationalPhoneNumber || p.nationalPhoneNumber || null,
      maps_url: p.googleMapsUri || null,
      open_now: p.currentOpeningHours?.openNow ?? null,
      business_status: p.businessStatus ?? null,
    }));

    return jsonResp({ places }, 200);
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
