import apkAsset from "@/assets/smart-dairy-hub.apk.asset.json";

/**
 * Single source of truth for the Android build shipped with the site.
 * The file itself lives in Lovable Assets — replacing the pointer JSON
 * (or re-running `lovable-assets create`) swaps the download with no code change.
 */
export const APK = {
  url: apkAsset.url as string,
  filename: (apkAsset.original_filename as string) || "smart-dairy-hub.apk",
  bytes: (apkAsset.size as number) || 0,
  updatedAt: (apkAsset.created_at as string) || "",
};

export function apkSizeLabel(bytes = APK.bytes): string {
  if (!bytes) return "";
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

/** Triggers a real file download of the uploaded APK (no fake links). */
export function downloadApk(): void {
  const a = document.createElement("a");
  a.href = APK.url;
  a.download = APK.filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}
