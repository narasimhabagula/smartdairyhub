// Smart Dairy Hub — Knowledge Base ingestion (RAG)
// Admin-only. Fetches website routes, chunks the content, embeds via Lovable AI,
// and upserts chunks into public.kb_documents.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_BASE = "https://smartdairyhub.online";
const DEFAULT_ROUTES = [
  "/", "/milk-calculator", "/milk-rates", "/marketplace", "/cattle-market",
  "/vet-contacts", "/book-vet", "/schemes", "/help", "/support",
  "/legal/privacy", "/legal/terms",
];

const EMBED_MODEL = "openai/text-embedding-3-small"; // 1536-dim, matches kb_documents.embedding

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function extractTitle(html: string, fallback: string): string {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m ? m[1].trim().slice(0, 200) : fallback;
}

function chunkText(text: string, target = 900, overlap = 120): string[] {
  if (!text) return [];
  const chunks: string[] = [];
  const sentences = text.split(/(?<=[.!?])\s+/);
  let cur = "";
  for (const s of sentences) {
    if ((cur + " " + s).length > target && cur.length > 0) {
      chunks.push(cur.trim());
      cur = cur.slice(Math.max(0, cur.length - overlap)) + " " + s;
    } else {
      cur += " " + s;
    }
  }
  if (cur.trim()) chunks.push(cur.trim());
  return chunks.filter((c) => c.length > 80);
}

async function sha256(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function embedBatch(inputs: string[], apiKey: string): Promise<number[][]> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
    body: JSON.stringify({ model: EMBED_MODEL, input: inputs }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`embed ${res.status}: ${t.slice(0, 300)}`);
  }
  const j = await res.json();
  return (j.data || []).map((d: { embedding: number[] }) => d.embedding);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization") || "";
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const { data: isAdmin } = await userClient.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) return new Response(JSON.stringify({ error: "Admins only" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json().catch(() => ({}));
    const requestedBase: string = (body?.base_url || DEFAULT_BASE).replace(/\/+$/, "");
    // SSRF hardening: only allow ingestion from our own public website. Reject everything else
    // (cloud metadata IPs, internal hosts, file://, ftp://, etc.) regardless of admin role.
    const ALLOWED_BASES = new Set<string>([
      "https://smartdairyhub.online",
      "https://www.smartdairyhub.online",
    ]);
    if (!ALLOWED_BASES.has(requestedBase)) {
      return new Response(
        JSON.stringify({ error: "base_url not allowed", allowed: Array.from(ALLOWED_BASES) }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const base = requestedBase;
    const routes: string[] = Array.isArray(body?.routes) && body.routes.length ? body.routes : [...DEFAULT_ROUTES];
    const purge: boolean = !!body?.purge;

    const admin = createClient(supabaseUrl, serviceKey);
    if (purge) {
      await admin.from("kb_documents").delete().eq("category", "website");
    }

    const log: Record<string, unknown>[] = [];
    let totalChunks = 0;
    let inserted = 0;

    // Also try /llms.txt — if present, also include its discovered links
    try {
      const llms = await fetch(`${base}/llms.txt`);
      if (llms.ok) {
        const txt = await llms.text();
        const found = Array.from(txt.matchAll(/\(([^)]+)\)/g)).map((m) => m[1]).filter((u) => u.startsWith("/"));
        for (const r of found) if (!routes.includes(r)) routes.push(r);
      }
    } catch (_) { /* ignore */ }

    for (const route of routes) {
      try {
        const url = `${base}${route}`;
        const res = await fetch(url, { headers: { "User-Agent": "SmartDairyHub-KB-Ingest" } });
        if (!res.ok) { log.push({ route, status: res.status, skipped: true }); continue; }
        const html = await res.text();
        const title = extractTitle(html, route);
        const text = stripHtml(html);
        if (text.length < 200) { log.push({ route, skipped: "too-short" }); continue; }
        const chunks = chunkText(text);
        totalChunks += chunks.length;
        if (!chunks.length) continue;

        // Embed in small batches of 8
        for (let i = 0; i < chunks.length; i += 8) {
          const batch = chunks.slice(i, i + 8);
          const vectors = await embedBatch(batch, lovableKey);
          const rows = await Promise.all(batch.map(async (c, idx) => ({
            source_url: url,
            title,
            category: "website",
            content: c,
            content_hash: await sha256(`${url}::${c}`),
            embedding: vectors[idx] as unknown as string, // pg accepts array literal
            token_count: Math.ceil(c.length / 4),
            active: true,
          })));
          const { error } = await admin
            .from("kb_documents")
            .upsert(rows, { onConflict: "content_hash", ignoreDuplicates: false });
          if (error) { log.push({ route, error: error.message }); break; }
          inserted += rows.length;
        }
        log.push({ route, title, chunks: chunks.length });
      } catch (e) {
        log.push({ route, error: String(e).slice(0, 200) });
      }
    }

    // Also pull admin-managed chatbot_knowledge snippets so they participate in vector search
    try {
      const { data: snips } = await admin.from("chatbot_knowledge").select("title,content,category,id").eq("active", true);
      if (snips?.length) {
        for (let i = 0; i < snips.length; i += 8) {
          const batch = snips.slice(i, i + 8);
          const inputs = batch.map((s) => `${s.title}\n\n${s.content}`);
          const vectors = await embedBatch(inputs, lovableKey);
          const rows = await Promise.all(batch.map(async (s, idx) => ({
            source_url: null,
            title: s.title,
            category: `admin:${s.category}`,
            content: `${s.title}\n\n${s.content}`,
            content_hash: await sha256(`admin::${s.id}::${s.content}`),
            embedding: vectors[idx] as unknown as string,
            token_count: Math.ceil(inputs[idx].length / 4),
            active: true,
          })));
          await admin.from("kb_documents").upsert(rows, { onConflict: "content_hash" });
          inserted += rows.length;
        }
      }
    } catch (_) { /* non-fatal */ }

    return new Response(JSON.stringify({ ok: true, totalChunks, inserted, log }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err).slice(0, 500) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
