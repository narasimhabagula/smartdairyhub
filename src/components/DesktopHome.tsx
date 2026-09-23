import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Bot, ChevronRight, Newspaper, ShieldCheck, Sparkles, ArrowRight } from "lucide-react";
import { BANNERS, FEATURE_CARDS, QUICK_ACTIONS, IMG } from "@/components/home/homeData";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthModal } from "@/components/auth/AuthModalProvider";
import { Button } from "@/components/ui/button";
import DownloadAppSection from "@/components/DownloadAppSection";

const SHELL = "mx-auto w-full max-w-[1600px] px-6 lg:px-10 xl:px-14";

const STATS = [
  { value: "1,00,000+", label: "Farmers" },
  { value: "50,000+", label: "Healthy cattle" },
  { value: "1 Cr+", label: "Milk records" },
  { value: "24/7", label: "AI support" },
];

/** Dedicated tablet / laptop / desktop home layout. Never rendered on mobile. */
export default function DesktopHome() {
  const { user } = useAuth();
  const { openAuth } = useAuthModal();
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % BANNERS.length), 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="w-full bg-gradient-to-b from-emerald-50/50 via-background to-background pb-20">
      {/* ================= HERO ================= */}
      <section className="relative w-full overflow-hidden">
        <img
          src={IMG.banner1}
          alt="Indian dairy farm with healthy cattle"
          className="absolute inset-0 h-full w-full object-cover"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/90 via-emerald-950/70 to-emerald-950/25" />
        <div className={`${SHELL} relative grid items-center gap-10 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:py-24 xl:py-28`}>
          <div className="max-w-2xl text-white">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest ring-1 ring-inset ring-white/25 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> AI-powered dairy platform
            </span>
            <h1 className="mt-6 font-display text-4xl font-bold leading-[1.05] lg:text-6xl xl:text-7xl">
              Everything your dairy farm needs, in one place
            </h1>
            <p className="mt-5 max-w-xl text-base text-white/85 lg:text-lg">
              Live milk rates, AI disease detection, verified veterinarians, cattle trading and government schemes —
              built for Indian dairy farmers, in 11 languages.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="h-12 rounded-full px-7 text-base">
                <Link to="/marketplace">
                  Explore marketplace <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              {user ? (
                <Button asChild size="lg" variant="secondary" className="h-12 rounded-full px-7 text-base">
                  <Link to="/dashboard">Go to dashboard</Link>
                </Button>
              ) : (
                <Button
                  size="lg"
                  variant="secondary"
                  className="h-12 rounded-full px-7 text-base"
                  onClick={() => openAuth("/dashboard")}
                >
                  Farmer sign in
                </Button>
              )}
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-white/75">
              <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Verified vets & sellers</span>
              <span className="inline-flex items-center gap-2"><Sparkles className="h-4 w-4" /> AI diagnosis in seconds</span>
              <span className="inline-flex items-center gap-2"><Newspaper className="h-4 w-4" /> 11 Indian languages</span>
            </div>
          </div>

          {/* Rotating banner card */}
          <div className="block">
            <div className="relative mx-auto aspect-[16/9] w-full max-w-3xl overflow-hidden rounded-[28px] shadow-2xl ring-1 ring-white/15 lg:aspect-auto lg:h-[380px] lg:max-w-none">
              {BANNERS.map((b, i) => (
                <Link
                  key={b.title}
                  to={b.to}
                  aria-hidden={i !== idx}
                  tabIndex={i === idx ? 0 : -1}
                  className={`absolute inset-0 flex flex-col justify-end p-7 pb-12 text-primary-foreground transition-opacity duration-700 lg:pb-7 ${
                    i === idx ? "opacity-100" : "pointer-events-none opacity-0"
                  }`}
                >
                  <img src={b.img} alt="" className="absolute inset-0 h-full w-full object-cover object-center" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
                  <div className="relative">
                    <div className="font-display text-2xl font-bold">{b.title}</div>
                    <div className="mt-1 text-sm text-white/85">{b.subtitle}</div>
                    <span className={`mt-4 inline-flex items-center gap-1 rounded-full ${b.accent} px-4 py-1.5 text-xs font-bold`}>
                      {b.cta} <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              ))}
              <div className="absolute bottom-4 right-6 z-10 flex gap-2">
                {BANNERS.map((_, i) => (
                  <Button
                    key={i}
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setIdx(i)}
                    aria-label={`Show banner ${i + 1}`}
                    className="h-7 w-7 rounded-full p-0 hover:bg-background/20"
                  >
                    <span className={`block h-1.5 rounded-full bg-primary-foreground transition-all ${i === idx ? "w-5" : "w-1.5 opacity-60"}`} />
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= STATS ================= */}
      <section className="border-b border-border/60 bg-card/60">
        <div className={`${SHELL} grid grid-cols-2 gap-6 py-10 lg:grid-cols-4 lg:py-12`}>
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="font-display text-3xl font-bold text-foreground lg:text-4xl xl:text-5xl">{s.value}</div>
              <div className="mt-1.5 text-xs font-medium uppercase tracking-widest text-muted-foreground lg:text-sm">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= QUICK ACTIONS ================= */}
      <section className={`${SHELL} pt-14 lg:pt-20`}>
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold lg:text-3xl">Quick actions</h2>
            <p className="mt-1 text-sm text-muted-foreground">Everything a dairy farmer uses every day.</p>
          </div>
        </div>
        <div className="mt-8 grid grid-cols-4 gap-5 md:grid-cols-5 lg:grid-cols-8 xl:grid-cols-10">
          {QUICK_ACTIONS.map((a) => (
            <Link key={a.label} to={a.to} className="group flex flex-col items-center gap-2.5 text-center">
              <span className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[24px] bg-card shadow-[0_8px_20px_-10px_rgba(0,0,0,0.25)] ring-1 ring-black/[0.04] transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-[0_18px_32px_-12px_rgba(0,0,0,0.28)]">
                <img src={a.img} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
              </span>
              <span className="text-xs font-semibold leading-tight text-foreground/90">{a.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section className={`${SHELL} pt-16 lg:pt-24`}>
        <h2 className="font-display text-2xl font-bold lg:text-3xl">Explore Smart Dairy Hub</h2>
        <p className="mt-1 text-sm text-muted-foreground">Premium tools built for modern dairy businesses.</p>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURE_CARDS.map((f) => (
            <Link
              key={f.to}
              to={f.to}
              className="group relative h-64 overflow-hidden rounded-3xl bg-card shadow-soft ring-1 ring-black/[0.04] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl lg:h-72"
            >
              <img
                src={f.img}
                alt={f.title}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
              {(f as any).badge && (
                <span className="absolute right-4 top-4 rounded-full bg-primary px-2.5 py-1 text-[11px] font-bold text-primary-foreground">
                  {(f as any).badge}
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                <div className="font-display text-xl font-bold">{f.title}</div>
                <div className="mt-1 text-sm text-white/85">{f.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ================= JERRY CTA ================= */}
      <section className={`${SHELL} pt-16 lg:pt-24`}>
        <div className="flex flex-col items-start gap-6 rounded-[32px] bg-gradient-to-br from-primary to-emerald-700 p-8 text-primary-foreground shadow-glow lg:flex-row lg:items-center lg:p-12">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-white/15 backdrop-blur">
            <Bot className="h-8 w-8" />
          </div>
          <div className="flex-1">
            <div className="font-display text-2xl font-bold lg:text-3xl">Ask Jerry, your dairy AI assistant</div>
            <div className="mt-1.5 text-sm text-white/85 lg:text-base">
              Voice or text, in your language — disease help, milk pricing, schemes and more.
            </div>
          </div>
          <Button asChild size="lg" variant="secondary" className="h-12 rounded-full px-7 text-base">
            <Link to="/ai-chat">Chat with Jerry</Link>
          </Button>
        </div>
      </section>

      {/* ================= DOWNLOAD APP ================= */}
      <DownloadAppSection />
    </div>
  );
}
