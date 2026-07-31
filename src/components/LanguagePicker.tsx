import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { LANGUAGE_CODES, type LanguageCode } from "@/locales";
import { useAuth } from "@/contexts/AuthContext";

const STORAGE_KEY_PICKED = "sdh_language_picked";
const STORAGE_KEY_LANG = "i18nextLng";
const STORAGE_KEY_PREF = "preferred_language";

/**
 * Side-effect only: on first authenticated session, redirect to the language
 * selection page. On later logins, apply the saved language instantly.
 */
export default function LanguagePicker() {
  const { i18n } = useTranslation();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.startsWith("/welcome/language")) return;

    const picked = localStorage.getItem(STORAGE_KEY_PICKED);
    const profileLang = (profile as any)?.language as LanguageCode | undefined;

    if (user && profileLang && (LANGUAGE_CODES as string[]).includes(profileLang)) {
      if (i18n.language?.slice(0, 2) !== profileLang) i18n.changeLanguage(profileLang);
      localStorage.setItem(STORAGE_KEY_PICKED, "1");
      localStorage.setItem(STORAGE_KEY_LANG, profileLang);
      return;
    }

    // First-ever visit (guest or signed in): choose a language before anything else.
    if (!picked) {
      const next = encodeURIComponent(location.pathname + location.search);
      navigate(`/welcome/language?next=${next}`, { replace: true });
    }
  }, [user, profile, i18n, navigate, location.pathname, location.search]);

  return null;
}
