// Shared, strict client-side upload guards.
// Server-side storage policies remain the real boundary; these rules stop
// obviously unsafe files (SVG/HTML/scripts) before they ever reach the public
// image bucket, and they never trust the user-supplied filename.

export const IMAGE_MAX_BYTES = 5 * 1024 * 1024; // 5 MB
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024; // 2 MB
export const VIDEO_MAX_BYTES = 30 * 1024 * 1024; // 30 MB

/** Only raster formats a browser cannot execute. SVG is intentionally absent. */
const IMAGE_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const VIDEO_EXT: Record<string, string> = {
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
};

export function validateImage(file: File, maxBytes: number = IMAGE_MAX_BYTES): string | null {
  if (!IMAGE_EXT[file.type]) return "Please choose a JPG, PNG or WebP photo.";
  if (file.size > maxBytes) return `Photo must be under ${Math.round(maxBytes / (1024 * 1024))} MB.`;
  if (file.size === 0) return "That file looks empty. Please pick another photo.";
  return null;
}

export function validateVideoFile(file: File, maxBytes: number = VIDEO_MAX_BYTES): string | null {
  if (!VIDEO_EXT[file.type]) return "Please choose an MP4, MOV or WebM video.";
  if (file.size > maxBytes) return `Video must be under ${Math.round(maxBytes / (1024 * 1024))} MB.`;
  if (file.size === 0) return "That file looks empty. Please pick another video.";
  return null;
}

/** Extension derived from the validated MIME type — never from the filename. */
export function safeExtension(file: File, kind: "image" | "video" = "image"): string {
  const map = kind === "image" ? IMAGE_EXT : VIDEO_EXT;
  return map[file.type] ?? (kind === "image" ? "jpg" : "mp4");
}

/** Unguessable, user-scoped storage key. Keeps one user's uploads out of another's prefix. */
export function safeStoragePath(userId: string, folder: string, file: File, kind: "image" | "video" = "image"): string {
  return `${userId}/${folder}/${crypto.randomUUID()}.${safeExtension(file, kind)}`;
}
