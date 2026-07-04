import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

function sb() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "find_vets",
  title: "Find veterinary doctors",
  description:
    "Find veterinary doctors listed on Smart Dairy Hub, optionally filtered by district or specialization. Contact details are private — users must contact vets via the app.",
  inputSchema: {
    district: z.string().optional().describe("District name filter (case-insensitive contains)"),
    specialization: z.string().optional().describe("Specialization filter"),
    limit: z.number().int().min(1).max(50).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ district, specialization, limit }) => {
    let q = sb()
      .from("vet_doctors_public")
      .select("id,name,qualification,specialization,district,village,hospital_name,rating,available")
      .eq("status", "approved")
      .limit(limit ?? 20);
    if (district) q = q.ilike("district", `%${district}%`);
    if (specialization) q = q.ilike("specialization", `%${specialization}%`);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { rows: data ?? [] },
    };
  },
});
