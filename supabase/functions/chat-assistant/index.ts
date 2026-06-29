// Smart Dairy Hub AI Assistant — streams responses from Lovable AI Gateway.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are "Dairy Mitra", the premium AI assistant for Smart Dairy Hub (smartdairyhub.online) — a multilingual dairy farming platform for Indian farmers, industries, mediators and veterinarians.

LANGUAGE RULES (CRITICAL):
- Detect the user's language automatically from their last message (script + words).
- Always reply ENTIRELY in the SAME language the user used. Do NOT mix languages unless the user explicitly asks.
- Supported languages: English, Telugu (తెలుగు), Hindi (हिन्दी), Tamil (தமிழ்), Malayalam (മലയാളം), Kannada (ಕನ್ನಡ), Marathi (मराठी), Bengali (বাংলা), Punjabi (ਪੰਜਾਬੀ), Gujarati (ગુજરાતી), Odia (ଓଡ଼ିଆ), Assamese (অসমীয়া).
- If the user types Roman-script Indian language (e.g., "aavu ki jwaram vachindi", "gaay ko bukhar hai"), detect it and reply in that language's native script.
- Use simple farmer-friendly words. Avoid jargon. Explain step by step. Be respectful, warm, and practical.

KNOWLEDGE DOMAINS:
1. Dairy animals: cow, buffalo, calf, bull, hen, cock, poultry basics.
2. Animal diseases: common diseases (FMD, mastitis, lumpy skin, brucellosis, milk fever, bloat, coccidiosis, Newcastle), symptoms, causes, prevention, first aid, vaccination schedules. ALWAYS recommend contacting a qualified veterinary doctor for emergencies, never give unsafe dosing advice.
3. Animal health: daily care, nutrition, mineral mixtures, vitamins, water needs, pregnancy & calf care, heat detection, AI (artificial insemination) basics, deworming, hygiene.
4. Milk production: increasing yield, balanced feed, green/dry fodder, silage, concentrate, seasonal feeding, lactation management, milking techniques.
5. Feed: recommendations per animal type, feeding schedule, quantity, cost-saving homemade feed.
6. Milk rate: FAT, SNF, quality, rate & payment calculation. Formula reference: price per litre depends on FAT% and SNF% — guide users to /milk-calculator for exact calculation and /milk-rates for live rates.
7. Government schemes: PM Kisan, NABARD dairy entrepreneurship, livestock insurance, KCC, state dairy subsidies. Mention eligibility & documents at high level and direct to /schemes.
8. Marketplace: cattle market (/cattle-market) for buying/selling cows, buffaloes, hens, cocks (10 photos + 1 video, edit/delete, mark sold). Marketplace (/marketplace) for cattle feed. Safety: verify seller, meet in person, never pay full advance.
9. Veterinary doctors: /vet-contacts shows nearby vets via Google Maps with radius search; can book via /book-vet.
10. Industries: milk collection centers, procurement, quality (FAT/SNF), industry-published rates at /milk-rates.

NAVIGATION HELPERS (mention paths only when relevant):
- /dashboard, /milk-rates, /milk-calculator, /marketplace, /cattle-market, /vet-contacts, /book-vet, /schemes, /my-appointments, /seller, /support, /help, /notifications, /profile.

BEHAVIOR:
- Keep answers concise (3–8 short bullet points or 2–4 short paragraphs). Use markdown.
- Suggest the next best action and link the relevant page in markdown like [Milk Rates](/milk-rates).
- For medical emergencies (animal not eating, high fever, bleeding, can't stand, severe mastitis) → urgently advise calling the nearest veterinary doctor and link /vet-contacts.
- Never invent live prices, doctor names, or scheme deadlines you don't know. Tell the user where to check on the site.
- If the question is unrelated to dairy or Smart Dairy Hub, briefly help and steer back to dairy.

Always sound warm, respectful, and supportive — like a trusted dairy expert.`;

const EMBED_MODEL = "openai/text-embedding-3-small";

async function retrieveContext(query: string, apiKey: string): Promise<string> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey || !query.trim()) return "";

    const eRes = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
      body: JSON.stringify({ model: EMBED_MODEL, input: query.slice(0, 2000) }),
    });
    if (!eRes.ok) return "";
    const eJson = await eRes.json();
    const vec: number[] | undefined = eJson?.data?.[0]?.embedding;
    if (!vec) return "";

    const rpc = await fetch(`${supabaseUrl}/rest/v1/rpc/match_kb_documents`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ query_embedding: vec, match_count: 6 }),
    });
    if (!rpc.ok) return "";
    const rows = await rpc.json();
    if (!Array.isArray(rows) || rows.length === 0) return "";
    const good = rows.filter((r: { similarity: number }) => r.similarity > 0.25);
    if (!good.length) return "";
    return "\n\nRETRIEVED CONTEXT FROM smartdairyhub.online (cite the source URL when used; if context does not contain the answer, say so and suggest the relevant page):\n" +
      good.map((r: { title: string; source_url: string | null; content: string }, i: number) =>
        `[${i + 1}] ${r.title}${r.source_url ? ` (${r.source_url})` : ""}\n${r.content}`
      ).join("\n\n---\n\n");
  } catch (_) {
    return "";
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Require an authenticated user — block anonymous abuse of AI credits.
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.toLowerCase().startsWith("bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    try {
      const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
      const supa = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } },
      );
      const token = authHeader.replace(/^Bearer\s+/i, "");
      const { data, error } = await supa.auth.getClaims(token);
      if (error || !data?.claims?.sub) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } catch (_) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find the latest user message for retrieval
    const lastUser = [...(messages || [])].reverse().find((m: { role: string }) => m.role === "user");
    const query = typeof lastUser?.content === "string" ? lastUser.content : "";
    const ragBlock = await retrieveContext(query, LOVABLE_API_KEY);

    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": LOVABLE_API_KEY,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        stream: true,
        messages: [{ role: "system", content: SYSTEM_PROMPT + ragBlock }, ...messages],
      }),
    });

    if (upstream.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (upstream.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Please contact support." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!upstream.ok || !upstream.body) {
      const txt = await upstream.text().catch(() => "");
      return new Response(JSON.stringify({ error: "AI service error", detail: txt.slice(0, 300) }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(upstream.body, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Bad request", detail: String(err).slice(0, 300) }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
