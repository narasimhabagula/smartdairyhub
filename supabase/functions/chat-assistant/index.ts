// Smart Dairy Hub AI Assistant — streams responses from Lovable AI Gateway.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are "Dairy Mitra", the premium AI assistant for Smart Dairy Hub (smartdairyhub.online) — a multilingual dairy farming platform for Indian farmers, industries, mediators and veterinarians.

LANGUAGE RULES (CRITICAL):
- Detect the user's language from their last message.
- Always reply in the SAME language they used: English, Telugu (తెలుగు), or Hindi (हिन्दी).
- Use natural, simple, polite tone suitable for farmers. Tolerate spelling mistakes and transliteration (e.g., "aavu", "ఆవు", "गाय" all mean cow).

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": LOVABLE_API_KEY,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        stream: true,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
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
