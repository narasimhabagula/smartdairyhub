import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, Check, Search, Volume1, Volume2, VolumeX, CheckCircle2 } from "lucide-react";
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

/** Animated sunrise dairy-farm canvas backdrop (rays, hills, barn, cows, pollen). */
function FarmCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let rayAngle = 0;

    const resize = () => {
      const parent = canvas.parentElement;
      canvas.width = parent?.clientWidth || window.innerWidth;
      canvas.height = parent?.clientHeight || window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles = Array.from({ length: 40 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 2.5 + 0.5,
      alpha: Math.random() * 0.7 + 0.2,
      speedY: -Math.random() * 0.35 - 0.1,
      speedX: Math.random() * 0.3 - 0.15,
    }));

    const cow = (x: number, y: number, scale: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.ellipse(0, 0, 32, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#0f172a";
      ctx.beginPath();
      ctx.ellipse(-10, -5, 12, 10, 0.2, 0, Math.PI * 2);
      ctx.ellipse(12, 2, 10, 12, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(-32, 6, 10, 8, 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-20, 12, 5, 22);
      ctx.fillRect(-10, 12, 5, 22);
      ctx.fillRect(8, 12, 5, 22);
      ctx.fillRect(18, 12, 5, 22);
      ctx.restore();
    };

    const barn = (w: number, h: number) => {
      const bx = w * 0.72;
      const by = h * 0.48;
      ctx.fillStyle = "#dc2626";
      ctx.fillRect(bx, by, 55, 35);
      ctx.fillStyle = "#991b1b";
      ctx.beginPath();
      ctx.moveTo(bx - 5, by);
      ctx.lineTo(bx + 27.5, by - 20);
      ctx.lineTo(bx + 60, by);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(bx + 18, by + 12, 20, 23);
      ctx.strokeStyle = "#dc2626";
      ctx.lineWidth = 2;
      ctx.strokeRect(bx + 18, by + 12, 20, 23);
      ctx.beginPath();
      ctx.moveTo(bx + 18, by + 12);
      ctx.lineTo(bx + 38, by + 35);
      ctx.moveTo(bx + 38, by + 12);
      ctx.lineTo(bx + 18, by + 35);
      ctx.stroke();
      const sx = bx + 60;
      const sy = by - 12;
      ctx.fillStyle = "#94a3b8";
      ctx.fillRect(sx, sy, 18, 47);
      ctx.beginPath();
      ctx.arc(sx + 9, sy, 9, Math.PI, 0);
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      [12, 24, 36].forEach((o) => {
        ctx.moveTo(sx, sy + o);
        ctx.lineTo(sx + 18, sy + o);
      });
      ctx.stroke();
    };

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, "#0284c7");
      sky.addColorStop(0.3, "#38bdf8");
      sky.addColorStop(0.5, "#f59e0b");
      sky.addColorStop(0.65, "#16a34a");
      sky.addColorStop(1, "#052e16");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      const sunX = w * 0.5;
      const sunY = h * 0.28;
      ctx.save();
      ctx.translate(sunX, sunY);
      if (!reduce) rayAngle += 0.002;
      ctx.rotate(rayAngle);
      ctx.fillStyle = "rgba(254, 240, 138, 0.12)";
      for (let i = 0; i < 12; i++) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, Math.max(w, h) * 1.2, (i * Math.PI) / 6, (i * Math.PI) / 6 + 0.18);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      const glow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 90);
      glow.addColorStop(0, "rgba(255,255,255,1)");
      glow.addColorStop(0.2, "rgba(253,224,71,0.9)");
      glow.addColorStop(0.6, "rgba(245,158,11,0.4)");
      glow.addColorStop(1, "rgba(245,158,11,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 90, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(21,128,61,0.85)";
      ctx.beginPath();
      ctx.moveTo(0, h * 0.52);
      ctx.bezierCurveTo(w * 0.3, h * 0.46, w * 0.6, h * 0.54, w, h * 0.48);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.fill();

      barn(w, h);

      const fore = ctx.createLinearGradient(0, h * 0.55, 0, h);
      fore.addColorStop(0, "#16a34a");
      fore.addColorStop(0.5, "#15803d");
      fore.addColorStop(1, "#052e16");
      ctx.fillStyle = fore;
      ctx.beginPath();
      ctx.moveTo(0, h * 0.58);
      ctx.bezierCurveTo(w * 0.35, h * 0.52, w * 0.7, h * 0.62, w, h * 0.56);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.fill();

      cow(w * 0.15, h * 0.62, 0.55);
      cow(w * 0.34, h * 0.66, 0.45);
      cow(w * 0.86, h * 0.64, 0.5);

      particles.forEach((p) => {
        if (!reduce) {
          p.y += p.speedY;
          p.x += p.speedX;
          if (p.y < 0) p.y = h;
          if (p.x > w) p.x = 0;
          if (p.x < 0) p.x = w;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(254, 243, 199, ${p.alpha})`;
        ctx.fill();
      });

      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className="absolute inset-0 z-0 h-full w-full" />;
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
    <div className="flex min-h-[100svh] items-center justify-center bg-slate-950 p-2 sm:p-6">
      <div className="relative flex h-[min(100svh-1rem,880px)] w-full max-w-[520px] flex-col justify-between overflow-hidden rounded-[clamp(24px,5vw,42px)] border-4 border-slate-700/60 bg-slate-950 shadow-2xl">
        <FarmCanvas />

        {/* Header */}
        <header className="relative z-20 flex items-center justify-between px-4 pt-4 sm:px-6 sm:pt-6">
          <div className="flex items-center gap-2 rounded-full border border-white/20 bg-slate-900/60 px-3 py-1.5 shadow-lg backdrop-blur-md">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
              Smart Dairy Hub
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSound((s) => !s)}
              aria-label={sound ? "Mute selection chime" : "Unmute selection chime"}
              className="rounded-full border border-white/30 bg-slate-900/60 p-2 text-white shadow-md backdrop-blur-md transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
            >
              {sound ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => speak()}
              aria-label="Listen to the selected language name"
              className="flex items-center gap-1.5 rounded-full border border-emerald-300/50 bg-gradient-to-r from-emerald-600 to-emerald-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-lg transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200"
            >
              <Volume1 className="h-4 w-4" /> <span>Listen</span>
            </button>
          </div>
        </header>

        {/* Glass HUD */}
        <main className="relative z-10 my-auto min-h-0 px-3 py-3 sm:px-6">
          <div className="glass relative overflow-hidden rounded-[clamp(20px,4vw,32px)] p-4 shadow-2xl sm:p-6">
            <div className="pointer-events-none absolute -left-20 -top-20 h-48 w-48 rounded-full bg-amber-300/30 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-20 -right-20 h-48 w-48 rounded-full bg-emerald-400/30 blur-2xl" />

            {/* Logo + title */}
            <div className="mb-4 flex items-center justify-between gap-3 border-b border-white/40 pb-4">
              <div className="flex min-w-0 items-center gap-3">
                <img
                  src="/logo.png"
                  alt="Smart Dairy Hub logo"
                  width={96}
                  height={96}
                  fetchPriority="high"
                  className="h-12 w-12 shrink-0 rounded-full bg-white/90 object-contain p-1 shadow-lg ring-2 ring-emerald-500 sm:h-14 sm:w-14"
                />
                <div className="min-w-0">
                  <h1 className="truncate text-lg font-extrabold leading-none tracking-tight text-slate-900 sm:text-xl">
                    Smart Dairy Hub
                  </h1>
                  <p className="mt-1 truncate text-[11px] font-semibold text-emerald-900 sm:text-xs" data-no-translate>
                    {GREETINGS[selected] || t("picker.subtitle", "Select your preferred language")}
                  </p>
                </div>
              </div>
              <span className="shrink-0 rounded-full border border-emerald-500 bg-emerald-700 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-sm">
                Official
              </span>
            </div>

            {/* Search */}
            <div className="relative mb-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-800" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("common.search", "Search") + "..."}
                aria-label="Search language"
                className="h-11 rounded-2xl border-white/70 bg-white/70 pl-10 text-sm text-slate-900 placeholder:text-slate-500"
              />
            </div>

            {/* Cards */}
            <div
              data-no-translate
              className="grid max-h-[min(46svh,420px)] grid-cols-1 gap-2.5 overflow-y-auto pr-1 sm:grid-cols-2"
            >
              {filtered.map((lng) => {
                const active = selected === lng.code;
                return (
                  <button
                    key={lng.code}
                    type="button"
                    onClick={() => pick(lng.code)}
                    aria-pressed={active}
                    className={`flex min-h-[56px] items-center justify-between gap-2 rounded-2xl border p-2.5 text-left transition-all duration-300 ${
                      active
                        ? "border-2 border-emerald-600 bg-white shadow-[0_0_25px_rgba(22,163,74,0.45)]"
                        : "border-white/70 bg-white/60 hover:-translate-y-0.5 hover:bg-white/90 hover:shadow-lg"
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span className="text-lg leading-none" aria-hidden>
                        🇮🇳
                      </span>
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate text-sm font-bold text-slate-900">{lng.native}</span>
                        <span className="truncate text-[10px] font-semibold text-slate-700">
                          ({lng.label})
                        </span>
                      </span>
                    </span>
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition ${
                        active
                          ? "bg-emerald-600 text-white shadow-md"
                          : "border border-slate-400/60 bg-white/50 text-transparent"
                      }`}
                    >
                      <Check className="h-3.5 w-3.5" strokeWidth={3.5} />
                    </span>
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <div className="col-span-full rounded-2xl border border-white/70 bg-white/70 p-5 text-center text-sm text-slate-700">
                  No matching language.
                </div>
              )}
            </div>

            {/* Action bar */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/40 pt-3.5">
              <div className="flex min-w-0 items-center gap-1.5 text-xs font-semibold" data-no-translate>
                <span className="text-slate-700">{t("picker.selected", "Selected")}:</span>
                <span className="truncate rounded-lg border border-emerald-400/60 bg-white/80 px-2.5 py-1 font-bold text-emerald-800 shadow-sm">
                  {selectedMeta?.native} ({selectedMeta?.label})
                </span>
              </div>
              <Button
                onClick={onContinue}
                className="h-11 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-green-500 px-6 text-xs font-extrabold tracking-wide text-white shadow-lg transition active:scale-95 hover:brightness-110"
              >
                {t("picker.continue", "Continue")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="relative z-10 flex items-end justify-between gap-3 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-transparent px-4 pb-4 pt-2 sm:px-6 sm:pb-6">
          <div className="text-[11px] text-white/90">
            <p className="font-bold text-emerald-300">Empowering Dairy Farmers Across India</p>
            <p className="text-[10px] text-slate-300">Premium glassmorphism • AI-powered dairy platform</p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/20 bg-slate-900/60 px-2.5 py-1">
            <span className="h-2 w-2 animate-ping rounded-full bg-emerald-400" />
            <span className="text-[10px] font-bold text-emerald-200" data-no-translate>
              {LANGUAGES.length} Languages
            </span>
          </div>
        </footer>

        {/* Confirmation */}
        {confirmed && (
          <div
            role="dialog"
            aria-modal="true"
            className="absolute inset-0 z-50 flex animate-fade-in items-center justify-center bg-slate-950/75 p-6 backdrop-blur-md"
          >
            <div className="w-full max-w-xs animate-scale-in rounded-3xl border-2 border-emerald-400 bg-white/95 p-6 text-center shadow-2xl">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-md">
                <CheckCircle2 className="h-9 w-9" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Welcome to Smart Dairy Hub</h2>
              <p className="mb-5 mt-1 text-xs text-slate-600">
                App language configured to{" "}
                <strong className="font-bold text-emerald-700" data-no-translate>
                  {selectedMeta?.native} ({selectedMeta?.label})
                </strong>
                .
              </p>
              <Button
                autoFocus
                onClick={onGetStarted}
                className="h-12 w-full rounded-xl bg-emerald-600 text-xs font-bold text-white shadow-lg hover:bg-emerald-500"
              >
                Get Started
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
