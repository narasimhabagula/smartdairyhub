// Guards against javascript:/data: URI injection in user/admin-supplied URL fields.
export function isSafeHttpUrl(url: string | null | undefined): url is string {
  if (!url) return false;
  try {
    const p = new URL(url, window.location.origin);
    return p.protocol === "https:" || p.protocol === "http:";
  } catch {
    return false;
  }
}

export function safeHref(url: string | null | undefined, fallback = "#"): string {
  return isSafeHttpUrl(url) ? url : fallback;
}

// Minimal HTML escape for raw-HTML sinks (e.g. Google Maps InfoWindow)
export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
