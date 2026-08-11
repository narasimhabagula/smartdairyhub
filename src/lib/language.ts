import type { i18n as I18n } from "i18next";
import { LANGUAGE_CODES, type LanguageCode } from "@/locales";
import { supabase } from "@/integrations/supabase/client";

export const LANG_KEYS = {
  picked: "sdh_language_picked",
  i18next: "i18nextLng",
  preferred: "preferred_language",
  /** Legacy/simple key some surfaces read. */
  selected: "selectedLanguage",
} as const;

/** The language the app should boot in, read synchronously before first paint. */
export function readStoredLanguage(): LanguageCode | undefined {
  try {
    const raw =
      localStorage.getItem(LANG_KEYS.preferred) ||
      localStorage.getItem(LANG_KEYS.selected) ||
      localStorage.getItem(LANG_KEYS.i18next);
    const code = raw?.slice(0, 2) as LanguageCode | undefined;
    return code && (LANGUAGE_CODES as string[]).includes(code) ? code : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Single source of truth for switching language anywhere in the app.
 * Persists to every storage key the app reads, so the choice survives
 * language screen → login → OAuth redirect → home → reload.
 */
export async function setAppLanguage(i18n: I18n, code: LanguageCode, userId?: string | null) {
  try {
    localStorage.setItem(LANG_KEYS.picked, "1");
    localStorage.setItem(LANG_KEYS.i18next, code);
    localStorage.setItem(LANG_KEYS.preferred, code);
    localStorage.setItem(LANG_KEYS.selected, code);
  } catch {}
  try {
    sessionStorage.setItem("sdh_language_visit", "1");
  } catch {}

  if (i18n.language?.slice(0, 2) !== code) await i18n.changeLanguage(code);

  if (userId) {
    try {
      await supabase.from("profiles").update({ language: code } as any).eq("user_id", userId);
    } catch {}
  }
}
