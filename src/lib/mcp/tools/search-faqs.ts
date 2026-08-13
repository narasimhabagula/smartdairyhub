import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { supabaseForUser, unauthenticated } from "../supabase";

export default defineTool({
  name: "search_faqs",
  title: "Search FAQs",
  description:
    "Search Smart Dairy Hub FAQ knowledge base for answers about dairy farming, milk production, animal health, and platform usage.",
  inputSchema: {
    query: z.string().min(1).describe("Search text"),
    limit: z.number().int().min(1).max(20).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    const { data, error } = await supabaseForUser(ctx)
      .from("faqs")
      .select("question,answer,category")
      .eq("active", true)
      .or(`question.ilike.%${query}%,answer.ilike.%${query}%`)
      .limit(limit ?? 10);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { rows: data ?? [] },
    };
  },
});
