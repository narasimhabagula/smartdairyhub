import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Globe2, Search, Sparkles } from "lucide-react";
import { LANGUAGES, type LanguageCode } from "@/locales";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthModal } from "@/components/auth/AuthModalProvider";
import { supabase } from "@/integrations/supabase/client";
import farmBg from "@/assets/bg-language-farm.jpg";

const STORAGE_KEY_PICKED = "sdh_language_picked";
const STORAGE_KEY_LANG = "i18nextLng";
const STORAGE_KEY_PREF = "preferred_language";

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
  const { openAuth } = useAuthModal();
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

  const selectedMeta = LANGUAGES.find((l) => l.code === selected);

  const onContinue = async () => {
    setSaving(true);
    try {
      await i18n.changeLanguage(selected);
      localStorage.setItem(STORAGE_KEY_PICKED, "1");
      localStorage.setItem(STORAGE_KEY_LANG, selected);
      localStorage.setItem(STORAGE_KEY_PREF, selected);
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
    <div className="relative min-h-[100svh] overflow-hidden">
      {/* Dairy farm backdrop */}
      <img
        src={farmBg}
        alt=""
        aria-hidden="true"
        width={1536}
        height={1024}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/70 to-background/90 backdrop-blur-[2px]" />
      <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/25 blur-3xl" />

      <div className="container relative mx-auto max-w-5xl px-4 py-8 sm:py-14">
        {/* Header card */}
        <div className="mx-auto max-w-2xl rounded-3xl border border-white/40 bg-card/70 p-6 text-center shadow-xl backdrop-blur-xl sm:p-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <img
            src="/logo.png"
            alt="Smart Dairy Hub"
            width={128}
            height={128}
            fetchPriority="high"
            className="mx-auto mb-3 h-24 w-24 object-contain drop-shadow-md sm:h-28 sm:w-28"
          />
          <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
            <Globe2 className="h-3.5 w-3.5" />
            Smart Dairy Hub
          </p>
          <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-4xl">
            {t("picker.title", "Choose Your Language")}
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground sm:text-base">
            {t(
              "picker.subtitle",
              "Select your preferred language. You can change it anytime from Settings.",
            )}
          </p>

          <div className="relative mx-auto mt-5 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("common.search", "Search") + "..."}
              className="h-12 rounded-2xl border-white/50 bg-background/70 pl-10 text-base shadow-sm backdrop-blur"
              aria-label="Search language"
            />
          </div>
        </div>

        {/* Language grid */}
        <div data-no-translate className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((lng, idx) => {
            const active = selected === lng.code;
            return (
              <button
                key={lng.code}
                type="button"
                onClick={() => setSelected(lng.code)}
                aria-pressed={active}
                style={{ animationDelay: `${idx * 30}ms` }}
                className={`group relative flex min-h-[112px] flex-col items-start justify-between rounded-2xl border p-4 text-left backdrop-blur-xl transition-all duration-300 animate-in fade-in zoom-in-95 ${
                  active
                    ? "border-primary bg-card/90 shadow-[0_0_28px_-6px_hsl(var(--primary)/0.55)] ring-2 ring-primary/40"
                    : "border-white/45 bg-card/60 hover:-translate-y-1 hover:border-primary/50 hover:bg-card/85 hover:shadow-lg"
                }`}
              >
                <div className="flex w-full items-start justify-between">
                  <span className="text-2xl" aria-hidden>
                    {FLAGS[lng.code] || "🌐"}
                  </span>
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full transition-all duration-300 ${
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
                  <div className="text-xs text-muted-foreground">{lng.label}</div>
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-full rounded-2xl border border-white/45 bg-card/70 p-6 text-center text-sm text-muted-foreground backdrop-blur">
              No matching language.
            </div>
          )}
        </div>

        {/* Sticky continue bar */}
        <div className="sticky bottom-4 mt-8 flex justify-center">
          <div className="flex w-full max-w-md items-center gap-3 rounded-2xl border border-white/50 bg-card/80 p-2.5 shadow-2xl backdrop-blur-xl">
            <div className="min-w-0 flex-1 pl-2" data-no-translate>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {t("picker.selected", "Selected")}
              </p>
              <p className="truncate text-sm font-bold">
                {selectedMeta?.native} <span className="text-muted-foreground">({selectedMeta?.label})</span>
              </p>
            </div>
            <Button
              size="lg"
              onClick={onContinue}
              disabled={saving}
              className="h-12 rounded-xl px-6 text-base shadow-lg"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {saving ? t("common.loading", "Loading...") : t("picker.continue", "Continue")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
