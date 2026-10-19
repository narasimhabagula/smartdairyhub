import { supabase } from "@/integrations/supabase/client";
import { safeStoragePath } from "@/lib/uploads";

export const PHOTO_MAX_BYTES = 5 * 1024 * 1024; // 5 MB
export const VIDEO_MAX_BYTES = 30 * 1024 * 1024; // 30 MB
export const MAX_PHOTOS = 10;

const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];

export function validatePhoto(file: File): string | null {
  if (!PHOTO_TYPES.includes(file.type)) return "Photo must be JPG, PNG, or WebP";
  if (file.size > PHOTO_MAX_BYTES) return "Photo must be under 5 MB";
  return null;
}

export function validateVideo(file: File): string | null {
  if (!VIDEO_TYPES.includes(file.type)) return "Video must be MP4, MOV, or WebM";
  if (file.size > VIDEO_MAX_BYTES) return "Video must be under 30 MB";
  return null;
}

export async function uploadCattleFile(
  userId: string,
  file: File,
  kind: "photo" | "video",
): Promise<string> {
  const validationError = kind === "photo" ? validatePhoto(file) : validateVideo(file);
  if (validationError) throw new Error(validationError);
  const path = safeStoragePath(userId, "cattle", file, kind === "photo" ? "image" : "video");
  const { error } = await supabase.storage.from("images").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });
  if (error) throw error;
  return supabase.storage.from("images").getPublicUrl(path).data.publicUrl;
}

export function pathFromPublicUrl(url: string): string | null {
  const marker = "/object/public/images/";
  const i = url.indexOf(marker);
  return i === -1 ? null : url.slice(i + marker.length);
}

export async function deleteCattleFiles(urls: string[]) {
  const paths = urls.map(pathFromPublicUrl).filter((p): p is string => !!p);
  if (paths.length === 0) return;
  await supabase.storage.from("images").remove(paths);
}
