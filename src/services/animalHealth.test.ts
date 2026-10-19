import { describe, expect, it, vi } from "vitest";
import { analyzeAnimalPhoto } from "./animalHealth";

const { invoke } = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { functions: { invoke } } }));

describe("real animal photo analysis", () => {
  it("sends the uploaded image and returns the actual assessment", async () => {
    const diagnosis = { animal: "Cow", breed: "Unknown", disease: "Needs examination", confidence: 30,
      severity: "Moderate", recoveryChance: 50, symptoms: ["Swelling visible"], medicines: [],
      isolation: "Separate pending review", nutrition: ["Clean water"], vaccination: "Ask a vet",
      nextCheckup: "Today", affectedArea: { x: 20, y: 30, w: 10, h: 10 } };
    invoke.mockResolvedValueOnce({ data: diagnosis, error: null });
    await expect(analyzeAnimalPhoto("actual-photo-bytes", "image/png")).resolves.toEqual(diagnosis);
    expect(invoke).toHaveBeenCalledWith("analyze-animal-health", { body: { imageBase64: "actual-photo-bytes", mimeType: "image/png" } });
  });
  it("rejects failed analysis rather than substituting a sample diagnosis", async () => {
    invoke.mockResolvedValueOnce({ data: null, error: { context: new Response(JSON.stringify({ error: "AI access is blocked" }), { status: 403 }) } });
    await expect(analyzeAnimalPhoto("photo", "image/jpeg")).rejects.toThrow("AI access is blocked");
  });
  it("rejects placeholder or incomplete responses", async () => {
    invoke.mockResolvedValueOnce({ data: { disease: "Mastitis" }, error: null });
    await expect(analyzeAnimalPhoto("photo", "image/jpeg")).rejects.toThrow("incomplete");
  });
});