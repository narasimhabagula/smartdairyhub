import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { supabaseForUser, unauthenticated } from "../supabase";

export default defineTool({
  name: "search_milk_rates",
  title: "Search milk rates",
  description:
    "List today's milk procurement rates from dairy companies on Smart Dairy Hub. Optionally filter by milk_type (cow/buffalo/mixed) and limit results.",
  inputSchema: {
    milk_type: z.enum(["cow", "buffalo", "mixed"]).optional().describe("Filter by milk type"),
    limit: z.number().int().min(1).max(50).optional().describe("Max rows (default 20)"),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ milk_type, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    let q = supabaseForUser(ctx)
      .from("milk_rates")
      .select("milk_type,fat,snf,price_per_litre,bonus,effective_date,collection_timing,notes")
      .order("effective_date", { ascending: false })
      .limit(limit ?? 20);
    if (milk_type) q = q.eq("milk_type", milk_type);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { rows: data ?? [] },
    };
  },
});
