import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { RESOURCES, LANGUAGE_CODES } from "./locales";

/** The saved choice from the language screen wins over browser detection. */
let saved: string | null = null;
try {
  saved = localStorage.getItem("preferred_language") || localStorage.getItem("i18nextLng");
} catch {
  saved = null;
}
const initial = saved && (LANGUAGE_CODES as string[]).includes(saved.slice(0, 2)) ? saved.slice(0, 2) : undefined;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: RESOURCES,
    lng: initial,
    fallbackLng: "en",
    supportedLngs: LANGUAGE_CODES as unknown as string[],
    nonExplicitSupportedLngs: true, // map "en-US" → "en", "hi-IN" → "hi"
    load: "languageOnly",
    interpolation: { escapeValue: false },
    detection: { order: ["localStorage", "navigator"], caches: ["localStorage"] },
  });

export default i18n;

