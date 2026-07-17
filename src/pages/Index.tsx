import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight, Sparkles, ScanLine, Stethoscope, Store, Landmark, TrendingUp,
  ShieldCheck, Zap, MessageCircle, Star, Camera, Cloud, Bot, ChevronRight,
  Users, HeartPulse, Wheat, PhoneCall,
} from "lucide-react";
import cowPortrait from "@/assets/cow-portrait.jpg";
import milkPour from "@/assets/milk-pour.jpg";
import vetCare from "@/assets/vet-care.jpg";
import { useAuth } from "@/contexts/AuthContext";
import SmartHeroSearch from "@/components/SmartHeroSearch";
import HeroFarmCanvas from "@/components/three/HeroFarmCanvas";

// ---------- Animated counter ----------
function useCountUp(target: number, duration = 1600, start = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.floor(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, start]);
  return value;
}

function Stat({ value, suffix, label, start }: { value: number; suffix: string; label: string; start: boolean }) {
  const n = useCountUp(value, 1800, start);
  const display = value >= 1_000_000 ? (n / 1_000_000).toFixed(n === value ? 0 : 1) + "M" :
                  value >= 1_000 ? (n / 1_000).toFixed(0) + "K" : String(n);
  return (
    <div className="flex flex-col items-center text-center">
      <span className="font-display text-4xl font-bold text-foreground sm:text-5xl md:text-6xl">
        {display}<span className="text-primary">{suffix}</span>
      </span>
      <span className="mt-2 text-xs font-medium uppercase tracking-widest text-muted-foreground sm:text-sm">
        {label}
      </span>
    </div>
  );
}

// ---------- Page ----------
export default function Landing() {
  const { user } = useAuth();
  const heroRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);
  const [statsInView, setStatsInView] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  // Parallax on hero image
  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Trigger stat counters when in view
  useEffect(() => {
    if (!statsRef.current) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setStatsInView(true), { threshold: 0.3 });
    io.observe(statsRef.current);
    return () => io.disconnect();
  }, []);

  const features = [
    {
      to: "/disease-detection",
      icon: ScanLine,
      badge: "AI",
      title: "AI Disease Detection",
      desc: "Snap a photo of your cow — get instant diagnosis, medicine and vet recommendations powered by Jerry AI.",
      accent: "from-primary/20 to-primary/5",
      image: cowPortrait,
      big: true,
    },
    { to: "/milk-rates", icon: TrendingUp, title: "Live Milk Prices", desc: "Real-time cow & buffalo rates by district, FAT & SNF.", image: milkPour },
    { to: "/vet-contacts", icon: Stethoscope, title: "Veterinary Doctors", desc: "Book verified vets, video calls & emergencies near you.", image: vetCare },
    { to: "/cattle-market", icon: Store, title: "Cattle Marketplace", desc: "Buy & sell cows, buffaloes and calves — safely." },
    { to: "/marketplace", icon: Wheat, title: "Feed & Supplies Store", desc: "Premium feed, minerals, medicine and equipment." },
    { to: "/schemes", icon: Landmark, title: "Government Schemes", desc: "PM Kisan, NABARD loans, subsidies & insurance." },
  ];

  const testimonials = [
    { name: "Ramesh Reddy", role: "Dairy Farmer, Guntur", quote: "Milk prices updated in real time. My earnings went up 18% in three months.", rating: 5 },
    { name: "Dr. Priya Nair", role: "Veterinarian, Kerala", quote: "The AI disease detection is remarkably accurate. It's a game-changer for rural care.", rating: 5 },
    { name: "Sunita Devi", role: "Farm Owner, Punjab", quote: "Jerry AI answers my questions in Hindi — feels like having an expert on call 24/7.", rating: 5 },
  ];

  return (
    <div className="overflow-x-hidden">
      {/* ================= HERO ================= */}
      <section
        ref={heroRef}
        className="relative isolate flex min-h-[92vh] w-full items-center overflow-hidden bg-[hsl(158_34%_8%)]"
      >
        {/* Live 3D dairy farm scene */}
        <div className="absolute inset-0 -z-10">
          <HeroFarmCanvas className="!absolute inset-0 h-full w-full" />
          <div className="hero-overlay pointer-events-none absolute inset-0" />
        </div>

        {/* Floating orbs */}
        <div className="pointer-events-none absolute -left-24 top-24 h-96 w-96 rounded-full bg-primary/30 blur-3xl animate-float" />
        <div className="pointer-events-none absolute -right-32 bottom-16 h-[28rem] w-[28rem] rounded-full bg-accent/20 blur-3xl animate-float" style={{ animationDelay: "-3s" }} />

        <div className="container relative z-10 mx-auto px-5 py-24 sm:px-6 md:py-32">
          <div className="max-w-3xl animate-fade-up">
            {/* Eyebrow chip */}
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium text-white backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              India's Smart AI Dairy Farming Platform
            </div>

            <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] text-white sm:text-6xl md:text-7xl lg:text-[5.5rem]">
              Your dairy farm,{" "}
              <span className="italic text-accent">reimagined</span> with AI.
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/85 sm:text-xl">
              From disease detection to live milk prices, veterinary care and government schemes —
              Smart Dairy Hub is the one platform every Indian dairy farmer needs.
            </p>

            {/* CTA row */}
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                to={user ? "/dashboard" : "/select-role"}
                className="group inline-flex items-center gap-2 rounded-full bg-primary px-7 py-4 text-base font-semibold text-primary-foreground shadow-glow transition-all hover:-translate-y-0.5 hover:shadow-lift"
              >
                Get Started
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/ai-chat"
                className="group inline-flex items-center gap-2 rounded-full bg-white/10 px-7 py-4 text-base font-semibold text-white backdrop-blur-md ring-1 ring-inset ring-white/30 transition-all hover:bg-white/20"
              >
                <Camera className="h-4 w-4" />
                AI Disease Detection
              </Link>
              <Link
                to="/ai-chat"
                className="group inline-flex items-center gap-2 rounded-full px-6 py-4 text-base font-medium text-white/90 transition-colors hover:text-white"
              >
                <Bot className="h-4 w-4" /> Talk to Jerry
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Trust row */}
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-white/70">
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-primary-glow" /> Verified vets & sellers</span>
              <span className="inline-flex items-center gap-1.5"><Zap className="h-4 w-4 text-primary-glow" /> Real-time updates</span>
              <span className="inline-flex items-center gap-1.5"><MessageCircle className="h-4 w-4 text-primary-glow" /> English, Hindi, Telugu & 9 more</span>
            </div>
          </div>

          {/* Hero search — floating glass card, only when signed in */}
          {user && (
            <div className="mt-14 max-w-2xl animate-fade-up" style={{ animationDelay: "180ms" }}>
              <SmartHeroSearch />
            </div>
          )}
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/70">
          <div className="flex h-10 w-6 items-start justify-center rounded-full border-2 border-white/40 p-1">
            <span className="block h-2 w-1 animate-float rounded-full bg-white/70" />
          </div>
        </div>
      </section>

      {/* ================= STATS ================= */}
      <section ref={statsRef} className="border-y border-border/60 bg-gradient-mint py-16 sm:py-20">
        <div className="container mx-auto grid grid-cols-2 gap-8 px-5 md:grid-cols-4">
          <Stat value={100_000} suffix="+" label="Farmers" start={statsInView} />
          <Stat value={50_000}  suffix="+" label="Healthy Cattle" start={statsInView} />
          <Stat value={10_000_000} suffix="+" label="Milk Records" start={statsInView} />
          <div className="flex flex-col items-center text-center">
            <span className="font-display text-4xl font-bold text-foreground sm:text-5xl md:text-6xl">24<span className="text-primary">/7</span></span>
            <span className="mt-2 text-xs font-medium uppercase tracking-widest text-muted-foreground sm:text-sm">AI Support</span>
          </div>
        </div>
      </section>

      {/* ================= FEATURES BENTO ================= */}
      <section className="relative py-24 sm:py-32">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-radial-glow opacity-70" />
        <div className="container mx-auto px-5">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
              <Sparkles className="h-3 w-3" /> Everything a farmer needs
            </span>
            <h2 className="mt-6 font-display text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">
              One platform.{" "}
              <span className="text-gradient">Endless possibilities.</span>
            </h2>
            <p className="mt-5 text-lg text-muted-foreground">
              Manage your entire dairy business — from a single beautifully designed app.
            </p>
          </div>

          <div className="mt-16 grid gap-5 md:grid-cols-6">
            {/* Big AI card */}
            <Link
              to={features[0].to}
              className="group relative col-span-6 flex min-h-[22rem] flex-col justify-end overflow-hidden rounded-[2rem] bg-card p-8 shadow-soft hover-lift md:col-span-4 md:min-h-[26rem]"
            >
              <img src={features[0].image} alt="" loading="lazy" width={1024} height={1024}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
              <div className="relative z-10 max-w-md text-white">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary-foreground">
                  <Sparkles className="h-3 w-3" /> {features[0].badge}
                </span>
                <h3 className="mt-4 font-display text-3xl font-bold sm:text-4xl">{features[0].title}</h3>
                <p className="mt-3 text-white/85">{features[0].desc}</p>
                <span className="mt-6 inline-flex items-center gap-1 font-semibold text-accent">
                  Try it now <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>

            {/* Side tall — Milk prices */}
            <Link
              to={features[1].to}
              className="group relative col-span-6 flex flex-col justify-between overflow-hidden rounded-[2rem] bg-gradient-primary p-8 text-primary-foreground shadow-soft hover-lift md:col-span-2 md:min-h-[26rem]"
            >
              <div>
                <TrendingUp className="h-10 w-10" />
                <h3 className="mt-6 font-display text-2xl font-bold sm:text-3xl">{features[1].title}</h3>
                <p className="mt-3 text-primary-foreground/85">{features[1].desc}</p>
              </div>
              <div className="mt-6 flex items-center gap-2 text-sm font-semibold">
                Live now <span className="ml-1 inline-block h-2 w-2 animate-pulse rounded-full bg-accent" />
              </div>
            </Link>

            {/* Vet */}
            <Link
              to={features[2].to}
              className="group relative col-span-6 overflow-hidden rounded-[2rem] bg-card p-8 shadow-soft hover-lift md:col-span-3"
            >
              <img src={features[2].image} alt="" loading="lazy" width={1024} height={1024}
                className="absolute inset-0 h-full w-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 to-white/10 dark:from-card dark:via-card/90 dark:to-card/10" />
              <div className="relative">
                <Stethoscope className="h-10 w-10 text-primary" />
                <h3 className="mt-6 font-display text-2xl font-bold">{features[2].title}</h3>
                <p className="mt-2 max-w-sm text-muted-foreground">{features[2].desc}</p>
                <span className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-primary story-link">
                  Find a doctor
                </span>
              </div>
            </Link>

            {/* Marketplace */}
            <Link
              to={features[3].to}
              className="group relative col-span-6 overflow-hidden rounded-[2rem] border border-border bg-card p-8 shadow-soft hover-lift md:col-span-3"
            >
              <Store className="h-10 w-10 text-primary" />
              <h3 className="mt-6 font-display text-2xl font-bold">{features[3].title}</h3>
              <p className="mt-2 text-muted-foreground">{features[3].desc}</p>
              <span className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-primary story-link">
                Browse listings
              </span>
            </Link>

            {/* Feed */}
            <Link
              to={features[4].to}
              className="group relative col-span-6 overflow-hidden rounded-[2rem] bg-secondary p-8 hover-lift sm:col-span-3 md:col-span-3"
            >
              <Wheat className="h-10 w-10 text-primary" />
              <h3 className="mt-6 font-display text-2xl font-bold">{features[4].title}</h3>
              <p className="mt-2 text-muted-foreground">{features[4].desc}</p>
              <span className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-primary story-link">
                Shop feed
              </span>
            </Link>

            {/* Schemes */}
            <Link
              to={features[5].to}
              className="group relative col-span-6 overflow-hidden rounded-[2rem] border border-border bg-card p-8 shadow-soft hover-lift sm:col-span-3 md:col-span-3"
            >
              <Landmark className="h-10 w-10 text-primary" />
              <h3 className="mt-6 font-display text-2xl font-bold">{features[5].title}</h3>
              <p className="mt-2 text-muted-foreground">{features[5].desc}</p>
              <span className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-primary story-link">
                Explore schemes
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section className="bg-secondary/40 py-24 sm:py-32">
        <div className="container mx-auto px-5">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
                How it works
              </span>
              <h2 className="mt-6 font-display text-4xl font-bold leading-tight sm:text-5xl">
                Three steps to a smarter dairy business.
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                No jargon. No forms. Just answers your farm can act on.
              </p>

              <ol className="mt-10 space-y-6">
                {[
                  { icon: Camera,    title: "Snap or ask",            desc: "Take a photo of your animal or ask Jerry a question in your language." },
                  { icon: Sparkles,  title: "AI does the thinking",   desc: "Our models diagnose disease, forecast prices and match you with vets." },
                  { icon: HeartPulse, title: "You act with confidence", desc: "Follow tailored recommendations, book appointments, and grow your income." },
                ].map((s, i) => (
                  <li key={s.title} className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-glow">
                      <s.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        Step 0{i + 1}
                      </div>
                      <h3 className="mt-1 font-display text-2xl font-bold">{s.title}</h3>
                      <p className="mt-1 text-muted-foreground">{s.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* Preview card */}
            <div className="relative">
              <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[3rem] bg-primary/20 blur-3xl" />
              <div className="glass overflow-hidden rounded-[2.25rem] p-2 shadow-lift">
                <div className="relative overflow-hidden rounded-[1.75rem] bg-card">
                  <img src={cowPortrait} alt="AI analysing cow health" loading="lazy" width={1024} height={1024}
                    className="h-72 w-full object-cover" />
                  <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary-foreground shadow-glow">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> Analysing…
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <h4 className="font-display text-lg font-bold">Diagnosis Ready</h4>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">96% match</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Early sign of mastitis detected. Recommended: warm compress, isolate, book vet within 24h.
                  </p>
                  <div className="mt-4 flex gap-2">
                    <button className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">
                      View full report
                    </button>
                    <button className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold">
                      <PhoneCall className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= TESTIMONIALS ================= */}
      <section className="py-24 sm:py-32">
        <div className="container mx-auto px-5">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
              <Users className="h-3 w-3" /> Loved by farmers across India
            </span>
            <h2 className="mt-6 font-display text-4xl font-bold sm:text-5xl">
              Real farmers. Real results.
            </h2>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <figure
                key={t.name}
                className="group relative overflow-hidden rounded-[2rem] border border-border bg-card p-8 shadow-soft hover-lift"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="flex items-center gap-0.5 text-accent">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <blockquote className="mt-4 text-lg leading-relaxed text-foreground">
                  "{t.quote}"
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-primary font-semibold text-primary-foreground">
                    {t.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                  </div>
                  <div>
                    <div className="font-semibold">{t.name}</div>
                    <div className="text-sm text-muted-foreground">{t.role}</div>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FINAL CTA ================= */}
      <section className="pb-24 sm:pb-32">
        <div className="container mx-auto px-5">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-primary p-10 text-primary-foreground shadow-lift sm:p-16 md:p-20">
            <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-accent/30 blur-3xl" />

            <div className="relative grid gap-10 md:grid-cols-2 md:items-center">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest backdrop-blur-md">
                  <Cloud className="h-3 w-3" /> Free to start
                </span>
                <h2 className="mt-6 font-display text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">
                  Ready to transform your dairy farm?
                </h2>
                <p className="mt-4 max-w-lg text-lg text-primary-foreground/90">
                  Join 100,000+ farmers already using Smart Dairy Hub every day.
                </p>
              </div>

              <div className="flex flex-col gap-3 md:items-end">
                <Link
                  to={user ? "/dashboard" : "/select-role"}
                  className="group inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-semibold text-primary shadow-lift transition-transform hover:-translate-y-0.5"
                >
                  Get Started Free
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  to="/ai-chat"
                  className="group inline-flex items-center gap-2 rounded-full bg-white/10 px-8 py-4 text-base font-semibold text-white ring-1 ring-inset ring-white/30 backdrop-blur-md hover:bg-white/20"
                >
                  <Bot className="h-4 w-4" /> Ask Jerry Anything
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
