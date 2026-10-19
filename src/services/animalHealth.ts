import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import type { DiseaseSample } from "@/data/demo/diseases";

const resultSchema = z.object({
  animal: z.string(), breed: z.string(), disease: z.string(),
  confidence: z.number().min(0).max(100),
  severity: z.enum(["Mild", "Moderate", "Severe"]),
  recoveryChance: z.number().min(0).max(100),
  symptoms: z.array(z.string()),
  medicines: z.array(z.object({ name: z.string(), dosage: z.string(), duration: z.string() })),
  isolation: z.string(), nutrition: z.array(z.string()), vaccination: z.string(), nextCheckup: z.string(),
  affectedArea: z.object({ x: z.number(), y: z.number(), w: z.number(), h: z.number() }),
});

export async function analyzeAnimalPhoto(imageBase64: string, mimeType: string): Promise<Omit<DiseaseSample, "id">> {
  const { data, error } = await supabase.functions.invoke("analyze-animal-health", {
    body: { imageBase64, mimeType },
  });
  if (error) {
    let message = "The photo could not be analysed. Please try again later.";
    if (error.context instanceof Response) {
      const body = await error.context.json().catch(() => null);
      if (typeof body?.error === "string") message = body.error;
      else if (typeof body?.message === "string") message = body.message;
    }
    throw new Error(message);
  }
  if (typeof data?.error === "string") throw new Error(data.error);
  const parsed = resultSchema.safeParse(data);
  if (!parsed.success) throw new Error("The photo analysis was incomplete. No diagnosis has been saved.");
  return parsed.data as Omit<DiseaseSample, "id">;
}