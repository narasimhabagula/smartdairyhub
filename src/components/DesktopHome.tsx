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
      {/* ================= MAIN HERO CAROUSEL ================= */}
      <section className={`${SHELL} pt-6 lg:pt-8`}>
        <HeroCarousel />
      </section>


      {/* ================= STATS ================= */}
      <section className="border-b border-border/60 bg-card/60">
        <div className={`${SHELL} grid grid-cols-2 gap-6 py-10 lg:grid-cols-4 lg:py-12`}>
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="font-display text-3xl font-bold text-foreground lg:text-5xl">{s.value}</div>
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
