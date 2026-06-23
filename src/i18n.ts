import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { RESOURCES, LANGUAGE_CODES } from "./locales";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: RESOURCES,
    fallbackLng: "en",
    supportedLngs: LANGUAGE_CODES as unknown as string[],
    nonExplicitSupportedLngs: true, // map "en-US" → "en", "hi-IN" → "hi"
    load: "languageOnly",
    interpolation: { escapeValue: false },
    detection: { order: ["localStorage", "navigator"], caches: ["localStorage"] },
  });

export default i18n;
