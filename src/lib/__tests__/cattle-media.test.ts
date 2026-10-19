import { beforeEach, describe, expect, it, vi } from "vitest";
import { uploadCattleFile } from "../cattle-media";

const { upload, getPublicUrl } = vi.hoisted(() => ({ upload: vi.fn(), getPublicUrl: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { storage: { from: () => ({ upload, getPublicUrl }) } },
}));

describe("cattle media owner-scoped uploads", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    upload.mockResolvedValue({ error: null });
    getPublicUrl.mockImplementation((path: string) => ({ data: { publicUrl: `https://example.test/object/public/images/${path}` } }));
  });

  it.each([
    ["photo", "image/jpeg", "jpg"],
    ["video", "video/mp4", "mp4"],
  ] as const)("uploads a %s under the caller's first folder", async (kind, mime, ext) => {
    const file = new File(["media"], "untrusted.html", { type: mime });
    const url = await uploadCattleFile("owner-123", file, kind);
    const path = upload.mock.calls[0][0] as string;
    expect(path.split("/")[0]).toBe("owner-123");
    expect(path).toMatch(new RegExp(`^owner-123/cattle/[^/]+\\.${ext}$`));
    expect(upload).toHaveBeenCalledWith(path, file, { cacheControl: "3600", upsert: false, contentType: mime });
    expect(url).toBe(`https://example.test/object/public/images/${path}`);
  });

  it("keeps storage rejections visible to the caller", async () => {
    upload.mockResolvedValueOnce({ error: new Error("Upload rejected") });
    await expect(uploadCattleFile("owner-123", new File(["photo"], "cow.jpg", { type: "image/jpeg" }), "photo")).rejects.toThrow("Upload rejected");
    expect(getPublicUrl).not.toHaveBeenCalled();
  });
});