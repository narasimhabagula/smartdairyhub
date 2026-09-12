import { rateLimit } from "../_shared/rate-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const SYSTEM_PROMPT = `You are an expert veterinary AI for Indian dairy animals (cows, buffaloes, poultry).
Examine the photo carefully and give a practical field diagnosis a smallholder farmer can act on today.

Rules:
- Identify the animal and, if visible, the likely breed (Indian breeds where plausible: Gir, Sahiwal, Murrah, HF cross, Jersey cross...).
- Name the single most likely condition. If the animal looks healthy, set disease to "Healthy", severity "Mild", confidence high.
- confidence reflects how sure you are from the image alone. Do not exceed 92 unless the signs are unmistakable.
- symptoms: 3-6 short observations you can actually see or that typically accompany the condition.
- medicines: 2-4 entries with commonly available Indian veterinary products, realistic dosage by body weight and a duration. Always note that a vet must confirm before administering.
- nutrition: 3-5 short feeding actions. isolation, vaccination, nextCheckup: one short sentence each.
- affectedArea: percentage box (x, y from top-left, w, h) around the visible problem area in the image. Use a small central box if nothing specific is visible.
- If the photo is not an animal, set animal to "Unknown", disease to "Image unclear", confidence low, and explain in symptoms what a better photo should show.`;

const RESULT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "animal", "breed", "disease", "confidence", "severity", "recoveryChance",
    "symptoms", "medicines", "isolation", "nutrition", "vaccination", "nextCheckup", "affectedArea",
  ],
  properties: {
    animal: { type: "string" },
    breed: { type: "string" },
    disease: { type: "string" },
    confidence: { type: "number" },
    severity: { type: "string", enum: ["Mild", "Moderate", "Severe"] },
    recoveryChance: { type: "number" },
    symptoms: { type: "array", items: { type: "string" } },
    medicines: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "dosage", "duration"],
        properties: {
          name: { type: "string" },
          dosage: { type: "string" },
          duration: { type: "string" },
        },
      },
    },
    isolation: { type: "string" },
    nutrition: { type: "array", items: { type: "string" } },
    vaccination: { type: "string" },
    nextCheckup: { type: "string" },
    affectedArea: {
      type: "object",
      additionalProperties: false,
      required: ["x", "y", "w", "h"],
      properties: {
        x: { type: "number" }, y: { type: "number" },
        w: { type: "number" }, h: { type: "number" },
      },
    },
  },
} as const;

const clamp = (n: unknown, min: number, max: number, fallback: number) => {
  const v = typeof n === "number" && Number.isFinite(n) ? n : Number(n);
  return Number.isFinite(v) ? Math.min(max, Math.max(min, Math.round(v))) : fallback;
};

const strList = (v: unknown, fallback: string[]) => {
  const arr = Array.isArray(v) ? v.map((s) => String(s).trim()).filter(Boolean) : [];
  return arr.length ? arr.slice(0, 8) : fallback;
};

function normalize(raw: any) {
  const severity = ["Mild", "Moderate", "Severe"].includes(raw?.severity) ? raw.severity : "Moderate";
  const area = raw?.affectedArea ?? {};
  const meds = Array.isArray(raw?.medicines)
    ? raw.medicines
        .filter((m: any) => m && (m.name || m.dosage))
        .slice(0, 5)
        .map((m: any) => ({
          name: String(m.name ?? "Vet-prescribed medicine"),
          dosage: String(m.dosage ?? "As advised by your veterinarian"),
          duration: String(m.duration ?? "Until the vet reviews the animal"),
        }))
    : [];

  return {
    animal: String(raw?.animal || "Unknown"),
    breed: String(raw?.breed || "Not identified"),
    disease: String(raw?.disease || "Needs vet review"),
    confidence: clamp(raw?.confidence, 1, 99, 60),
    severity,
    recoveryChance: clamp(raw?.recoveryChance, 1, 100, 75),
    symptoms: strList(raw?.symptoms, ["No clear symptoms visible in this photo"]),
    medicines: meds.length ? meds : [
      { name: "Vet consultation required", dosage: "No medicine without examination", duration: "Within 24 hours" },
    ],
    isolation: String(raw?.isolation || "Keep the animal separate from the herd until a vet confirms the condition."),
    nutrition: strList(raw?.nutrition, ["Clean drinking water at all times", "Soft green fodder", "Mineral mixture in feed"]),
    vaccination: String(raw?.vaccination || "Check the animal's vaccination record with your local vet."),
    nextCheckup: String(raw?.nextCheckup || "Within 3 days"),
    affectedArea: {
      x: clamp(area?.x, 0, 95, 38),
      y: clamp(area?.y, 0, 95, 45),
      w: clamp(area?.w, 3, 100, 24),
      h: clamp(area?.h, 3, 100, 20),
    },
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const limited = rateLimit(req, "analyze-animal-health", 10, 60_000, corsHeaders);
  if (limited) return limited;

  try {
    const { imageBase64, mimeType } = await req.json().catch(() => ({}));
    if (!imageBase64 || typeof imageBase64 !== "string") {
      return json({ error: "Please attach a photo of the animal." }, 400);
    }
    // ~10 MB binary => ~13.7 MB base64
    if (imageBase64.length > 14_000_000) {
      return json({ error: "That photo is too large. Please use an image under 10 MB." }, 413);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "AI service is not configured." }, 500);

    const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];
    const mime = typeof mimeType === "string" && ALLOWED_MIME.includes(mimeType) ? mimeType : "image/jpeg";
    const dataUrl = `data:${mime};base64,${imageBase64}`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": LOVABLE_API_KEY,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "google/gemini-3.7-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: "Diagnose this dairy animal from the photo and give a treatment plan." },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: { name: "animal_diagnosis", strict: true, schema: RESULT_SCHEMA },
        },
      }),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      console.error("AI gateway error", resp.status, txt.slice(0, 400));
      if (resp.status === 429) {
        return json({ error: "The AI is busy right now. Please try again in a moment." }, 429);
      }
      if (resp.status === 402) {
        return json({ error: "AI usage credits have run out. Please add credits to continue." }, 402);
      }
      if (resp.status === 403) {
        return json({ error: "AI access is currently blocked for this workspace." }, 403);
      }
      return json({ error: "The AI could not read this photo. Please try another one." }, 502);
    }

    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content ?? "";
    let parsed: any = null;
    try {
      parsed = JSON.parse(content);
    } catch {
      const match = String(content).match(/\{[\s\S]*\}/);
      if (match) { try { parsed = JSON.parse(match[0]); } catch { /* ignore */ } }
    }
    if (!parsed || typeof parsed !== "object") {
      return json({ error: "The AI reply could not be read. Please try again." }, 502);
    }

    return json(normalize(parsed));
  } catch (e) {
    console.error("analyze-animal-health failed", e);
    return json({ error: "Something went wrong while analysing the photo." }, 500);
  }
});
