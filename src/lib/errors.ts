// Turns raw backend/database errors into calm, non-technical messages.
// Detailed errors stay in the browser console for developers; users never see
// SQL, table names, internal paths or stack traces.

const PATTERNS: Array<[RegExp, string]> = [
  [/row-level security|permission denied|not authorized|forbidden/i, "You don't have permission to do that."],
  [/duplicate key|already exists|unique constraint/i, "That entry already exists."],
  [/foreign key|violates/i, "Some details are missing or invalid. Please check and try again."],
  [/network|failed to fetch|timeout|offline/i, "Network problem. Please check your connection and try again."],
  [/jwt|token|session/i, "Your session expired. Please sign in again."],
  [/too many|rate limit|429/i, "Too many attempts. Please wait a moment and try again."],
  [/payload too large|exceeds|size/i, "That file is too large."],
];

export function friendlyError(err: unknown, fallback = "Something went wrong. Please try again."): string {
  const raw =
    typeof err === "string"
      ? err
      : err && typeof err === "object" && "message" in err
        ? String((err as { message?: unknown }).message ?? "")
        : "";

  if (import.meta.env.DEV) console.error("[error]", err);

  for (const [re, message] of PATTERNS) if (re.test(raw)) return message;
  return fallback;
}
