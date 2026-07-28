import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Languages, Search, Sparkles } from "lucide-react";
import { LANGUAGES, type LanguageCode } from "@/locales";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthModal } from "@/components/auth/AuthModalProvider";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY_PICKED = "sdh_language_picked";
const STORAGE_KEY_LANG = "i18nextLng";

const FLAGS: Record<string, string> = {
  en: "🇬🇧",
  hi: "🇮🇳",
  te: "🟢",
  ta: "🟠",
  kn: "🟡",
  ml: "🌴",
  mr: "🟣",
  gu: "🦁",
  pa: "🌾",
  bn: "🐅",
  or: "🛕",
};

export default function LanguageSelect() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<LanguageCode>(
    ((i18n.language || "en").slice(0, 2) as LanguageCode) || "en",
  );
  const [saving, setSaving] = useState(false);

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

  const onContinue = async () => {
    setSaving(true);
    try {
      await i18n.changeLanguage(selected);
      localStorage.setItem(STORAGE_KEY_PICKED, "1");
      localStorage.setItem(STORAGE_KEY_LANG, selected);
      if (user) {
        await supabase
          .from("profiles")
          .update({ language: selected } as any)
          .eq("user_id", user.id);
        const next = params.get("next") || "/dashboard";
        navigate(next, { replace: true });
      } else {
        // Guests continue to the login experience before browsing.
        navigate("/", { replace: true });
        openAuth(params.get("next") || "/");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative min-h-[100svh] overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/10">
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl animate-pulse" />
        <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-accent/20 blur-3xl animate-pulse" />
      </div>

      <div className="container relative mx-auto max-w-4xl px-4 py-10 sm:py-16">
        <div className="text-center animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="mx-auto mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
            <Languages className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-5xl">
            {t("picker.title", "Choose Your Language")}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
            {t(
              "picker.subtitle",
              "Select your preferred language. You can change it anytime from Settings.",
            )}
          </p>
        </div>

        <div className="mx-auto mt-8 max-w-md">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("common.search", "Search") + "..."}
              className="h-12 rounded-xl pl-10 text-base shadow-sm"
              aria-label="Search language"
            />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((lng, idx) => {
            const active = selected === lng.code;
            return (
              <button
                key={lng.code}
                type="button"
                onClick={() => setSelected(lng.code)}
                aria-pressed={active}
                style={{ animationDelay: `${idx * 30}ms` }}
                className={`group relative flex min-h-[110px] flex-col items-start justify-between rounded-2xl border-2 p-4 text-left transition-all duration-200 animate-in fade-in zoom-in-95 ${
                  active
                    ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/30"
                    : "border-border bg-card hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
                }`}
              >
                <div className="flex w-full items-start justify-between">
                  <span className="text-2xl" aria-hidden>
                    {FLAGS[lng.code] || "🌐"}
                  </span>
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full transition-all ${
                      active
                        ? "bg-primary text-primary-foreground scale-100"
                        : "bg-muted text-transparent scale-0"
                    }`}
                  >
                    <Check className="h-4 w-4" />
                  </span>
                </div>
                <div className="mt-3">
                  <div className="text-base font-semibold leading-tight">{lng.native}</div>
                  <div className="text-xs text-muted-foreground">{lng.label}</div>
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-full rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
              No matching language.
            </div>
          )}
        </div>

        <div className="sticky bottom-4 mt-10 flex justify-center">
          <Button
            size="lg"
            onClick={onContinue}
            disabled={saving}
            className="h-12 min-w-[220px] rounded-xl text-base shadow-lg"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            {saving ? t("common.loading", "Loading...") : t("picker.continue", "Continue")}
          </Button>
        </div>
      </div>
    </div>
  );
}
