import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

function sb() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "list_schemes",
  title: "List government schemes",
  description:
    "List active government dairy schemes, subsidies, and loans (NABARD, PM Kisan, etc.) published on Smart Dairy Hub.",
  inputSchema: {
    category: z.string().optional().describe("Optional category filter"),
    search: z.string().optional().describe("Text search in title/description"),
    limit: z.number().int().min(1).max(50).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ category, search, limit }) => {
    let q = sb()
      .from("schemes")
      .select("id,title,description,eligibility,benefits,category,apply_url")
      .eq("active", true)
      .limit(limit ?? 20);
    if (category) q = q.eq("category", category);
    if (search) q = q.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { rows: data ?? [] },
    };
  },
});
