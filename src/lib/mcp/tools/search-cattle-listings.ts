import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { supabaseForUser, unauthenticated } from "../supabase";

export default defineTool({
  name: "search_cattle_listings",
  title: "Search cattle marketplace",
  description:
    "Search active cattle listings (cows, buffaloes) on the Smart Dairy Hub marketplace. Seller contact info is private — buyers must contact via the app.",
  inputSchema: {
    type: z.string().optional().describe("Animal type e.g. cow, buffalo"),
    breed: z.string().optional().describe("Breed filter (contains)"),
    district: z.string().optional().describe("District filter (contains)"),
    max_price: z.number().optional().describe("Maximum price"),
    limit: z.number().int().min(1).max(50).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ type, breed, district, max_price, limit }, ctx) => {
    let q = supabaseForUser(ctx)
      .from("cattle_listings_public")
      .select("id,name,type,breed,age,milk_yield,price,district,village,state,health_status")
      .eq("status", "active")
      .limit(limit ?? 20);
    if (type) q = q.ilike("type", `%${type}%`);
    if (breed) q = q.ilike("breed", `%${breed}%`);
    if (district) q = q.ilike("district", `%${district}%`);
    if (max_price !== undefined) q = q.lte("price", max_price);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { rows: data ?? [] },
    };
  },
});
