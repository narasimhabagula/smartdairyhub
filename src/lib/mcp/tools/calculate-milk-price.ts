import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

// Smart Dairy Hub milk pricing formula:
// rate_per_litre = (FAT * fat_rate) + (SNF * snf_rate)
// Defaults reflect common Indian dairy co-op rates.
export default defineTool({
  name: "calculate_milk_price",
  title: "Calculate milk price",
  description:
    "Calculate milk price from FAT %, SNF %, and litres using the Smart Dairy Hub rate formula (rate = FAT*fat_rate + SNF*snf_rate).",
  inputSchema: {
    fat: z.number().min(0).max(15).describe("Fat percentage"),
    snf: z.number().min(0).max(15).describe("Solids-not-fat percentage"),
    litres: z.number().min(0).describe("Volume in litres"),
    fat_rate: z.number().min(0).optional().describe("Rate per unit FAT (default 6.5)"),
    snf_rate: z.number().min(0).optional().describe("Rate per unit SNF (default 4.0)"),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ fat, snf, litres, fat_rate, snf_rate }) => {
    const fr = fat_rate ?? 6.5;
    const sr = snf_rate ?? 4.0;
    const ratePerLitre = fat * fr + snf * sr;
    const total = ratePerLitre * litres;
    return {
      content: [
        {
          type: "text",
          text: `Rate: ₹${ratePerLitre.toFixed(2)}/L · Total for ${litres}L = ₹${total.toFixed(2)}`,
        },
      ],
      structuredContent: {
        rate_per_litre: Number(ratePerLitre.toFixed(2)),
        total_price: Number(total.toFixed(2)),
        fat_rate: fr,
        snf_rate: sr,
      },
    };
  },
});
