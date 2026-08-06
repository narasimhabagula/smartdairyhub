import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, Check, Search, Volume1, Volume2, VolumeX, CheckCircle2, Globe } from "lucide-react";
import { LANGUAGES, type LanguageCode } from "@/locales";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const STORAGE_KEY_PICKED = "sdh_language_picked";
const STORAGE_KEY_LANG = "i18nextLng";
const STORAGE_KEY_PREF = "preferred_language";

const GREETINGS: Record<string, string> = {
  en: "Welcome to Smart Dairy Hub",
  te: "స్మార్ట్ డెయిరీ హబ్ కు స్వాగతం",
  hi: "स्मार्ट डेयरी हब में आपका स्वागत है",
  ta: "ஸ்மார்ட் டெய்ரி ஹப்பிற்கு நல்வரவு",
  kn: "ಸ್ಮಾರ್ಟ್ ಡೈರಿ ಹಬ್‌ಗೆ ಸ್ವಾಗತ",
  ml: "സ്മാർട്ട് ഡെയറി ഹബ്ബിലേക്ക് സ്വാഗതം",
  bn: "স্মার্ট ডেইরি হাব-এ স্বাগতম",
  mr: "स्मार्ट डेअरी हब मध्ये आपले स्वागत आहे",
  gu: "સ્માર્ટ ડેરી હબમાં આપનું સ્વાગત છે",
  pa: "ਸਮਾਰਟ ਡੇਅਰੀ ਹੱਬ ਵਿੱਚ ਜੀ ਆਇਆਂ ਨੂੰ",
  or: "ସ୍ମାର୍ଟ ଡେୟାରୀ ହବ୍ କୁ ସ୍ୱାଗତ",
};

const SPEECH_LANG: Record<string, string> = {
  en: "en-IN", te: "te-IN", hi: "hi-IN", ta: "ta-IN", kn: "kn-IN", ml: "ml-IN",
  bn: "bn-IN", mr: "mr-IN", gu: "gu-IN", pa: "pa-IN", or: "or-IN",
};

/**
 * Premium, very light full-page backdrop: soft white base, light blue + soft
 * green aurora blooms, a minimal dairy horizon line and a faint grid.
 * Purely decorative, CSS only — no canvas, no battery drain.
 */
function PremiumBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-white">
      <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_-20%,#F0F9FF_0%,#FFFFFF_45%,#F5FBF6_100%)]" />
      <div className="absolute -left-40 -top-32 h-[36rem] w-[36rem] rounded-full bg-[radial-gradient(circle,rgba(22,163,74,0.16),transparent_65%)] blur-3xl" />
      <div className="absolute -right-40 top-10 h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.16),transparent_65%)] blur-3xl" />
      <div className="absolute bottom-[-14rem] left-1/2 h-[32rem] w-[52rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(163,230,153,0.22),transparent_68%)] blur-3xl" />
      <div className="absolute inset-0 opacity-[0.35] [background-image:linear-gradient(to_right,rgba(15,23,42,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.045)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(70%_60%_at_50%_30%,black,transparent)]" />
      {/* Minimal dairy horizon */}
      <svg
        className="absolute inset-x-0 bottom-0 h-40 w-full sm:h-56"
        viewBox="0 0 1440 240"
        preserveAspectRatio="none"
      >
        <path d="M0 150 C 260 96 420 178 720 132 C 1010 88 1200 168 1440 118 V240 H0Z" fill="rgba(22,163,74,0.07)" />
        <path d="M0 186 C 300 140 560 210 880 168 C 1150 132 1290 196 1440 166 V240 H0Z" fill="rgba(22,163,74,0.10)" />
      </svg>
    </div>
  );
}

export default function LanguageSelect() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [query, setQuery] = useState("");
  const [sound, setSound] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const audioRef = useRef<AudioContext | null>(null);
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

  const chime = useCallback(() => {
    if (!sound) return;
    try {
      audioRef.current ??= new (window.AudioContext || (window as any).webkitAudioContext)();
      const ctx = audioRef.current!;
      if (ctx.state === "suspended") void ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {}
  }, [sound]);

  const speak = useCallback(
    (code: LanguageCode = selected) => {
      if (!("speechSynthesis" in window)) return;
      const meta = LANGUAGES.find((l) => l.code === code);
      if (!meta) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(meta.native);
      u.rate = 0.9;
      u.lang = SPEECH_LANG[code] || "hi-IN";
      window.speechSynthesis.speak(u);
    },
    [selected],
  );

  const pick = (code: LanguageCode) => {
    if (code === selected) return;
    setSelected(code);
    chime();
    speak(code);
  };

  const persist = () => {
    void i18n.changeLanguage(selected);
    localStorage.setItem(STORAGE_KEY_PICKED, "1");
    localStorage.setItem(STORAGE_KEY_LANG, selected);
    localStorage.setItem(STORAGE_KEY_PREF, selected);
    try {
      sessionStorage.setItem("sdh_language_visit", "1");
    } catch {}
  };

  const onContinue = () => {
    persist();
    chime();
    setConfirmed(true);
  };

  const onGetStarted = () => {
    if (user) {
      void supabase
        .from("profiles")
        .update({ language: selected } as any)
        .eq("user_id", user.id);
      navigate(params.get("next") || "/dashboard", { replace: true });
    } else {
      // Guests continue to the premium login page (they can Skip from there).
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="relative flex min-h-[100svh] w-full items-center justify-center overflow-x-hidden px-4 py-6 sm:px-6 sm:py-10">
      <PremiumBackdrop />

      {/* Card — grows on desktop, never taller than the viewport, sticky footer */}
      <section
        className="relative z-10 flex w-full max-w-[560px] flex-col overflow-hidden rounded-[28px] border border-white/70 bg-white/80 shadow-[0_30px_80px_-30px_rgba(7,26,11,0.28),0_2px_8px_-2px_rgba(7,26,11,0.06)] backdrop-blur-2xl animate-fade-in md:max-w-[720px] lg:max-w-[860px]"
        style={{ maxHeight: "calc(100svh - 3rem)" }}
      >
        {/* Header */}
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-900/[0.06] px-5 py-4 sm:px-8 sm:py-5">
          <div className="flex min-w-0 items-center gap-3">
            <img
              src="/logo.png"
              alt="Smart Dairy Hub logo"
              width={96}
              height={96}
              fetchPriority="high"
              className="h-11 w-11 shrink-0 rounded-2xl bg-white object-contain p-1 shadow-sm ring-1 ring-emerald-500/25 sm:h-14 sm:w-14"
            />
            <div className="min-w-0">
              <h1 className="truncate text-[17px] font-extrabold leading-tight tracking-tight text-slate-900 sm:text-2xl">
                Smart Dairy Hub
              </h1>
              <p
                className="mt-0.5 truncate text-[11px] font-medium text-emerald-700 sm:text-[13px]"
                data-no-translate
              >
                {GREETINGS[selected] || t("picker.subtitle", "Select your preferred language")}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setSound((s) => !s)}
              aria-label={sound ? "Mute selection chime" : "Unmute selection chime"}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
            >
              {sound ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => speak()}
              aria-label="Listen to the selected language name"
              className="flex h-10 items-center gap-1.5 rounded-full bg-emerald-600 px-4 text-xs font-bold text-white shadow-[0_8px_20px_-8px_rgba(22,163,74,0.7)] transition hover:bg-emerald-700 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
            >
              <Volume1 className="h-4 w-4" />
              <span className="hidden sm:inline">Listen</span>
            </button>
          </div>
        </header>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-8 sm:py-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700">
              <Globe className="h-3 w-3" /> <span data-no-translate>{LANGUAGES.length} Languages</span>
            </span>
            <span className="text-[12px] font-medium text-slate-500">
              {t("picker.subtitle", "Select your preferred language")}
            </span>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("common.search", "Search") + "..."}
              aria-label="Search language"
              className="h-12 rounded-2xl border-slate-200 bg-white pl-11 text-[15px] text-slate-900 shadow-sm placeholder:text-slate-400 focus-visible:ring-emerald-500/25"
            />
          </div>

          {/* Cards */}
          <div
            data-no-translate
            className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filtered.map((lng) => {
              const active = selected === lng.code;
              return (
                <button
                  key={lng.code}
                  type="button"
                  onClick={() => pick(lng.code)}
                  aria-pressed={active}
                  className={`group flex min-h-[62px] items-center justify-between gap-2 rounded-2xl border p-3 text-left transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 ${
                    active
                      ? "border-emerald-500 bg-emerald-50/80 shadow-[0_10px_24px_-12px_rgba(22,163,74,0.55)]"
                      : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-[0_12px_28px_-18px_rgba(7,26,11,0.35)]"
                  }`}
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-[15px] font-bold text-slate-900">{lng.native}</span>
                    <span className="truncate text-[11px] font-medium text-slate-500">{lng.label}</span>
                  </span>
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition ${
                      active
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "border border-slate-300 bg-white text-transparent group-hover:border-emerald-300"
                    }`}
                  >
                    <Check className="h-3.5 w-3.5" strokeWidth={3.5} />
                  </span>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="col-span-full rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
                No matching language.
              </div>
            )}
          </div>
        </div>

        {/* Sticky action bar — always visible & clickable on every screen */}
        <footer
          className="shrink-0 border-t border-slate-900/[0.06] bg-white/85 px-5 py-4 backdrop-blur-xl sm:px-8"
          style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2 text-[12px]" data-no-translate>
              <span className="font-medium text-slate-500">{t("picker.selected", "Selected")}:</span>
              <span className="truncate rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-bold text-emerald-800">
                {selectedMeta?.native} ({selectedMeta?.label})
              </span>
            </div>
            <Button
              onClick={onContinue}
              className="h-12 min-w-[160px] flex-1 rounded-2xl bg-emerald-600 px-6 text-sm font-extrabold tracking-wide text-white shadow-[0_14px_30px_-12px_rgba(22,163,74,0.7)] transition hover:bg-emerald-700 active:scale-[0.98] sm:flex-none"
            >
              {t("picker.continue", "Continue")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </footer>

        {/* Confirmation */}
        {confirmed && (
          <div
            role="dialog"
            aria-modal="true"
            className="absolute inset-0 z-50 flex animate-fade-in items-center justify-center bg-white/70 p-6 backdrop-blur-md"
          >
            <div className="w-full max-w-sm animate-scale-in rounded-3xl border border-emerald-100 bg-white p-7 text-center shadow-[0_30px_70px_-24px_rgba(7,26,11,0.3)]">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-9 w-9" />
              </div>
              <h2 className="text-lg font-extrabold tracking-tight text-slate-900">Welcome to Smart Dairy Hub</h2>
              <p className="mb-6 mt-1.5 text-[13px] text-slate-500">
                App language configured to{" "}
                <strong className="font-bold text-emerald-700" data-no-translate>
                  {selectedMeta?.native} ({selectedMeta?.label})
                </strong>
                .
              </p>
              <Button
                autoFocus
                onClick={onGetStarted}
                className="h-12 w-full rounded-2xl bg-emerald-600 text-sm font-bold text-white shadow-[0_14px_30px_-12px_rgba(22,163,74,0.7)] hover:bg-emerald-700"
              >
                Get Started
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
