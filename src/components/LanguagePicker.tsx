import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { LANGUAGE_CODES, type LanguageCode } from "@/locales";
import { useAuth } from "@/contexts/AuthContext";
import { hasStoredSession } from "@/lib/session";

const STORAGE_KEY_PICKED = "sdh_language_picked";
const STORAGE_KEY_LANG = "i18nextLng";
const STORAGE_KEY_PREF = "preferred_language";
/** Guests re-run the language step on every new visit; signed-in users never do. */
const VISIT_KEY = "sdh_language_visit";

/**
 * Side-effect only: guests are sent to the language screen on each new visit,
 * signed-in users keep their saved language and go straight into the app.
 */
export default function LanguagePicker() {
  const { i18n } = useTranslation();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.startsWith("/welcome/language")) return;
    // The OAuth consent screen must never be interrupted by the language gate.
    if (location.pathname.startsWith("/.lovable/oauth/")) return;


    const stored = localStorage.getItem(STORAGE_KEY_PREF);
    const profileLang = (profile as any)?.language as LanguageCode | undefined;
    const preferred = (profileLang || stored) as LanguageCode | undefined;
    const signedIn = !!user || hasStoredSession();

    // Always apply a known preference instantly (no flicker, no refresh).
    if (preferred && (LANGUAGE_CODES as string[]).includes(preferred)) {
      if (i18n.language?.slice(0, 2) !== preferred) i18n.changeLanguage(preferred);
      localStorage.setItem(STORAGE_KEY_PICKED, "1");
      localStorage.setItem(STORAGE_KEY_LANG, preferred);
      localStorage.setItem(STORAGE_KEY_PREF, preferred);
    }

    // Signed-in users with a saved language skip the language step entirely.
    if (signedIn && preferred) return;

    let visited = true;
    try {
      visited = sessionStorage.getItem(VISIT_KEY) === "1";
    } catch {}
    if (visited) return;


    const next = encodeURIComponent(location.pathname + location.search);
    navigate(`/welcome/language?next=${next}`, { replace: true });
  }, [user, profile, i18n, navigate, location.pathname, location.search]);

  return null;
}
