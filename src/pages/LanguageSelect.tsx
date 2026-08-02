import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Search, ArrowRight } from "lucide-react";
import { LANGUAGES, type LanguageCode } from "@/locales";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthModal } from "@/components/auth/AuthModalProvider";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY_PICKED = "sdh_language_picked";
const STORAGE_KEY_LANG = "i18nextLng";
const STORAGE_KEY_PREF = "preferred_language";

const FLAGS: Record<string, string> = {
  en: "🇮🇳",
  hi: "🇮🇳",
  te: "🇮🇳",
  ta: "🇮🇳",
  kn: "🇮🇳",
  ml: "🇮🇳",
  mr: "🇮🇳",
  gu: "🇮🇳",
  pa: "🇮🇳",
  bn: "🇮🇳",
  or: "🇮🇳",
};

export default function LanguageSelect() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { openAuth } = useAuthModal();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<LanguageCode>(() => {
    const current = (i18n.language || "en").slice(0, 2) as LanguageCode;
    return LANGUAGES.some((l) => l.code === current) ? current : "en";
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return LANGUAGES;
    return LANGUAGES.filter(
      (l) =>
        l.label.toLowerCase().includes(q) ||
        l.native.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q),
    );
  }, [query]);

  const selectedMeta = LANGUAGES.find((l) => l.code === selected);

  const onContinue = () => {
    // Apply + persist instantly; never block navigation on the network.
    void i18n.changeLanguage(selected);
    localStorage.setItem(STORAGE_KEY_PICKED, "1");
    localStorage.setItem(STORAGE_KEY_LANG, selected);
    localStorage.setItem(STORAGE_KEY_PREF, selected);
    try {
      sessionStorage.setItem("sdh_language_visit", "1");
    } catch {}

    if (user) {
      void supabase
        .from("profiles")
        .update({ language: selected } as any)
        .eq("user_id", user.id);
      navigate(params.get("next") || "/dashboard", { replace: true });
    } else {
      // Guests continue to the animated landing page — login stays optional.
      navigate("/", { replace: true });
    }
  };


  return (
    <div className="relative min-h-[100svh] overflow-hidden bg-background">
      {/* Soft brand wash — clean, light, Material 3 inspired */}
      <div className="pointer-events-none absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 translate-x-1/4 rounded-full bg-accent/10 blur-3xl" />

      <div className="container relative mx-auto max-w-5xl px-4 py-10 sm:py-14">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center animate-fade-in">
          <img
            src="/logo.png"
            alt="Smart Dairy Hub"
            width={128}
            height={128}
            fetchPriority="high"
            className="mx-auto mb-4 h-24 w-24 object-contain sm:h-28 sm:w-28"
          />
          <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            {t("picker.title", "Choose Your Language")}
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground sm:text-base">
            {t("picker.subtitle", "Select your preferred language")}
          </p>

          <div className="relative mx-auto mt-6 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("common.search", "Search") + "..."}
              className="h-12 rounded-full border-border bg-card pl-10 text-base shadow-sm"
              aria-label="Search language"
            />
          </div>
        </div>

        {/* Language grid */}
        <div data-no-translate className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((lng) => {
            const active = selected === lng.code;
            return (
              <button
                key={lng.code}
                type="button"
                onClick={() => setSelected(lng.code)}
                aria-pressed={active}
                className={`group relative flex min-h-[116px] flex-col items-start justify-between rounded-3xl border p-4 text-left transition-all duration-200 will-change-transform ${
                  active
                    ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                    : "border-border bg-card hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                }`}
              >
                <div className="flex w-full items-start justify-between">
                  <span className="text-2xl" aria-hidden>
                    {FLAGS[lng.code] || "🌐"}
                  </span>
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full transition-all duration-200 ${
                      active
                        ? "scale-100 bg-primary text-primary-foreground"
                        : "scale-0 bg-muted text-transparent"
                    }`}
                  >
                    <Check className="h-4 w-4" />
                  </span>
                </div>
                <div className="mt-3">
                  <div className="text-base font-bold leading-tight">{lng.native}</div>
                  <div className="text-xs text-muted-foreground">
                    {lng.label}
                    {lng.code === "en" ? " · Default" : ""}
                  </div>
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-full rounded-3xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
              No matching language.
            </div>
          )}
        </div>

        {/* Sticky continue bar */}
        <div className="sticky bottom-4 mt-8 flex justify-center">
          <div className="flex w-full max-w-md items-center gap-3 rounded-full border border-border bg-card/95 p-2.5 shadow-xl backdrop-blur">
            <div className="min-w-0 flex-1 pl-3" data-no-translate>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {t("picker.selected", "Selected")}
              </p>
              <p className="truncate text-sm font-bold">
                {selectedMeta?.native}{" "}
                <span className="text-muted-foreground">({selectedMeta?.label})</span>
              </p>
            </div>
            <Button size="lg" onClick={onContinue} className="h-12 rounded-full px-6 text-base shadow-md">
              {t("picker.continue", "Continue")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
