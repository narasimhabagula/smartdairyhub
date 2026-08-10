import apkAsset from "@/assets/Smart-Dairy-Hub.apk.asset.json";

/**
 * Single source of truth for the Android build shipped with the site.
 * The file is a genuine signed Android package (classes.dex + APK signing block)
 * hosted on Lovable Assets with the `application/vnd.android.package-archive`
 * content type — that MIME type is what makes Android treat the download as an
 * installable app instead of saving it as a .zip archive.
 */
export const APK = {
  url: apkAsset.url as string,
  /** Hyphenated, extension-safe name — Android installers dislike spaces. */
  filename: "Smart-Dairy-Hub.apk",
  mime: "application/vnd.android.package-archive",
  bytes: (apkAsset.size as number) || 0,
  updatedAt: (apkAsset.created_at as string) || "",
};

export function apkSizeLabel(bytes = APK.bytes): string {
  if (!bytes) return "";
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

function anchorDownload(href: string, revoke?: () => void) {
  const a = document.createElement("a");
  a.href = href;
  a.download = APK.filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  if (revoke) window.setTimeout(revoke, 60_000);
}

/**
 * Downloads the real APK. We fetch the bytes and re-wrap them in a Blob that
 * carries the Android package MIME type, so browsers never rewrite the
 * extension to .zip. Falls back to a plain link if fetch/blob is unavailable.
 */
export async function downloadApk(): Promise<void> {
  try {
    const res = await fetch(APK.url, { cache: "force-cache" });
    if (!res.ok) throw new Error(String(res.status));
    const buf = await res.arrayBuffer();
    const blob = new Blob([buf], { type: APK.mime });
    const href = URL.createObjectURL(blob);
    anchorDownload(href, () => URL.revokeObjectURL(href));
  } catch {
    anchorDownload(APK.url);
  }
}
