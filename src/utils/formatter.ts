import DOMPurify from "dompurify";

/** Strip HTML / script payloads from anything the user types before it leaves the browser. */
export function sanitizeInput(raw: string): string {
  const noTags = DOMPurify.sanitize(raw, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  return noTags.replace(/\u0000/g, "").trim();
}

/** Escape HTML entities (used where text is rendered outside markdown). */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Remove markdown so speech synthesis reads clean sentences. */
export function toSpeechText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_`#>|-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function formatTime(ts: number): string {
  try {
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export function formatTranscript(messages: { role: string; content: string; createdAt: number }[]): string {
  return messages
    .map((m) => `[${formatTime(m.createdAt)}] ${m.role === "user" ? "You" : "Jerry"}: ${m.content}`)
    .join("\n\n");
}
