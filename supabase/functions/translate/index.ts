// Machine-translation fallback for any UI string that has no local translation.
// Results are cached in `translation_cache` so each phrase is translated once.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { rateLimit } from "../_shared/rate-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LANG_NAMES: Record<string, string> = {
  en: "English",
  hi: "Hindi",
  te: "Telugu",
  ta: "Tamil",
  kn: "Kannada",
  ml: "Malayalam",
  mr: "Marathi",
  gu: "Gujarati",
  pa: "Punjabi",
  bn: "Bengali",
  or: "Odia",
};

const MAX_TEXTS = 120;
const MAX_CHARS = 600;

async function sha1(text: string) {
  const buf = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const limited = await rateLimit(req, "translate", 60, 60_000, corsHeaders);
  if (limited) return limited;

  try {
    const { texts, target } = await req.json();
    const lang = String(target || "").slice(0, 5);
    if (!LANG_NAMES[lang] || lang === "en") {
      return new Response(JSON.stringify({ translations: {} }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const list: string[] = Array.from(
      new Set((Array.isArray(texts) ? texts : []).map((t) => String(t).trim()).filter(Boolean)),
    )
      .filter((t) => t.length <= MAX_CHARS)
      .slice(0, MAX_TEXTS);

    if (!list.length) {
      return new Response(JSON.stringify({ translations: {} }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const hashes = await Promise.all(list.map(sha1));
    const byHash = new Map(hashes.map((h, i) => [h, list[i]]));

    const { data: cached } = await supabase
      .from("translation_cache")
      .select("source_hash, translated_text")
      .eq("lang", lang)
      .in("source_hash", hashes);

    const translations: Record<string, string> = {};
    const cachedHashes = new Set<string>();
    for (const row of cached ?? []) {
      cachedHashes.add(row.source_hash);
      const src = byHash.get(row.source_hash);
      if (src) translations[src] = row.translated_text;
    }

    const missing = hashes.filter((h) => !cachedHashes.has(h)).map((h) => byHash.get(h)!);

    if (missing.length) {
      const apiKey = Deno.env.get("LOVABLE_API_KEY");
      if (!apiKey) throw new Error("Translation service is not configured");

      const prompt =
        `Translate this JSON array of UI strings from English into ${LANG_NAMES[lang]} for a dairy farming app used in India.\n` +
        `Rules: keep the same array order and length; keep numbers, units, brand names ("Smart Dairy Hub", "Jerry"), and technical terms like FAT/SNF understandable; ` +
        `translate naturally for farmers; never add explanations. Reply with ONLY a JSON array of translated strings.\n\n` +
        JSON.stringify(missing);

      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            { role: "system", content: "You are a precise professional localization engine. Output raw JSON only." },
            { role: "user", content: prompt },
          ],
        }),
      });

      if (res.status === 429 || res.status === 402) {
        return new Response(JSON.stringify({ translations, error: "rate_limited" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (!res.ok) throw new Error(`AI gateway error ${res.status}`);

      const json = await res.json();
      const raw: string = json?.choices?.[0]?.message?.content ?? "[]";
      const cleaned = raw.replace(/```json|```/g, "").trim();
      let out: unknown = [];
      try {
        out = JSON.parse(cleaned);
      } catch {
        const m = cleaned.match(/\[[\s\S]*\]/);
        if (m) out = JSON.parse(m[0]);
      }

      const arr = Array.isArray(out) ? out : [];
      const rows: { lang: string; source_hash: string; source_text: string; translated_text: string }[] = [];
      for (let i = 0; i < missing.length; i++) {
        const value = typeof arr[i] === "string" ? (arr[i] as string).trim() : "";
        if (!value) continue;
        translations[missing[i]] = value;
        rows.push({
          lang,
          source_hash: await sha1(missing[i]),
          source_text: missing[i],
          translated_text: value,
        });
      }
      if (rows.length) {
        await supabase.from("translation_cache").upsert(rows, { onConflict: "lang,source_hash" });
      }
    }

    return new Response(JSON.stringify({ translations }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("translate error", e);
    return new Response(JSON.stringify({ translations: {}, error: (e as Error).message }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
