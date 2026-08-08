import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Bell, User, ChevronRight, Bot, ShieldCheck, Sparkles, Star, MapPin, IndianRupee, Truck, Newspaper,
} from "lucide-react";
import SmartHeroSearch from "@/components/SmartHeroSearch";
import DownloadAppSection from "@/components/DownloadAppSection";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthModal } from "@/components/auth/AuthModalProvider";
import { useTranslation } from "react-i18next";
import { LANGUAGES, type LanguageCode } from "@/locales";
import { demoProducts } from "@/data/demo/products";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { QUICK_ACTIONS, BANNERS, FEATURE_CARDS } from "@/components/home/homeData";


export default function MobileHome() {
  const { user, profile } = useAuth();
  const { openAuth } = useAuthModal();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [bannerIdx, setBannerIdx] = useState(0);
  const currentLang = (i18n.language?.slice(0, 2) || "en") as LanguageCode;

  // Auto-slide banners
  useEffect(() => {
    const id = setInterval(() => setBannerIdx((i) => (i + 1) % BANNERS.length), 4200);
    return () => clearInterval(id);
  }, []);

  const switchLang = async (lng: LanguageCode) => {
    await i18n.changeLanguage(lng);
    localStorage.setItem("sdh_language_picked", "1");
    if (user) await supabase.from("profiles").update({ language: lng } as any).eq("user_id", user.id);
  };

  const firstName = (profile?.full_name || user?.email || "Farmer").split(/[\s@]/)[0];

  return (
    <div className="mx-auto max-w-md bg-gradient-to-b from-emerald-50/60 via-background to-background pb-6">
      {/* ============ TOP HEADER ============ */}
      <header className="sticky top-0 z-30 -mx-0 bg-white/95 px-4 pb-3 pt-3 shadow-sm backdrop-blur-xl dark:bg-card/90">
        <div className="flex items-center justify-between gap-2">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Smart Dairy Hub" className="h-9 w-9 rounded-full object-contain" />
            <div className="leading-tight">
              <div className="font-display text-[15px] font-bold text-primary">Smart Dairy Hub</div>
              <div className="text-[10px] font-medium text-muted-foreground">
                {user ? `Hi, ${firstName} 👋` : "India's dairy app"}
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-1">
            {/* Language */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex h-9 items-center gap-1 rounded-full bg-muted px-2.5 text-xs font-semibold text-foreground">
                🌐 {LANGUAGES.find((l) => l.code === currentLang)?.native.slice(0, 3) ?? "EN"}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="max-h-80 overflow-auto">
                <DropdownMenuLabel>Choose language</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {LANGUAGES.map((l) => (
                  <DropdownMenuItem key={l.code} onClick={() => switchLang(l.code)}>
                    <span className="font-medium">{l.native}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{l.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {/* Notifications */}
            <button
              onClick={() => (user ? navigate("/notifications") : openAuth("/notifications"))}
              aria-label="Notifications"
              className="relative flex h-9 w-9 items-center justify-center rounded-full bg-muted text-foreground"
            >
              <Bell className="h-[18px] w-[18px]" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-white dark:ring-card" />
            </button>
            {/* Profile */}
            <button
              onClick={() => (user ? navigate("/profile") : openAuth("/profile"))}
              aria-label="Profile"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground"
            >
              <User className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="mt-3">
          <SmartHeroSearch />
        </div>
      </header>

      {/* ============ QUICK ACTIONS (horizontal scroll) ============ */}
      <section className="mt-4 px-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-bold">Quick actions</h2>
          <button onClick={() => navigate("/dashboard")} className="text-xs font-semibold text-primary">
            See all <ChevronRight className="ml-0.5 inline h-3 w-3" />
          </button>
        </div>
        <div className="scrollbar-hide -mx-4 mt-3 flex gap-4 overflow-x-auto px-4 pb-3">
          {QUICK_ACTIONS.map((a) => (
            <Link
              key={a.label}
              to={a.to}
              className="group flex w-[76px] shrink-0 flex-col items-center gap-2 text-center"
            >
              <span className="relative flex h-[64px] w-[64px] items-center justify-center overflow-hidden rounded-[20px] bg-white shadow-[0_6px_16px_-6px_rgba(0,0,0,0.18),0_2px_4px_-2px_rgba(0,0,0,0.08)] ring-1 ring-black/[0.04] transition-all duration-200 ease-out will-change-transform group-hover:-translate-y-0.5 group-hover:shadow-[0_12px_24px_-8px_rgba(0,0,0,0.22)] group-active:scale-[0.94] group-active:shadow-md">
                <img
                  src={a.img}
                  alt={a.label}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              </span>
              <span className="line-clamp-2 text-[11px] font-semibold leading-tight tracking-tight text-foreground/90">{a.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ============ AUTO-SLIDING BANNERS ============ */}
      <section className="mt-5 px-4">
        <div className="relative overflow-hidden rounded-3xl shadow-lift">
          <div
            className="flex transition-transform duration-700 ease-out"
            style={{ transform: `translateX(-${bannerIdx * 100}%)` }}
          >
            {BANNERS.map((b) => (
              <Link
                key={b.title}
                to={b.to}
                className="relative flex h-44 w-full shrink-0 flex-col justify-end overflow-hidden p-5 text-white"
              >
                <img src={b.img} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                <div className="relative">
                  <div className="font-display text-lg font-bold leading-tight">{b.title}</div>
                  <div className="mt-0.5 text-xs text-white/85">{b.subtitle}</div>
                  <span className={`mt-2.5 inline-flex items-center gap-1 rounded-full ${b.accent} px-3 py-1 text-[11px] font-bold`}>
                    {b.cta} <ChevronRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
          {/* dots */}
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
            {BANNERS.map((_, i) => (
              <button
                key={i}
                onClick={() => setBannerIdx(i)}
                aria-label={`Slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${i === bannerIdx ? "w-5 bg-white" : "w-1.5 bg-white/60"}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ============ TRUST STRIP ============ */}
      <section className="mt-5 px-4">
        <div className="flex items-center justify-between gap-2 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-3 py-2.5 text-[11px] font-medium text-emerald-900 dark:border-primary/20 dark:bg-primary/10 dark:text-primary-foreground">
          <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4" /> Verified vets</span>
          <span className="flex items-center gap-1.5"><Sparkles className="h-4 w-4" /> AI powered</span>
          <span className="flex items-center gap-1.5"><Newspaper className="h-4 w-4" /> 12 languages</span>
        </div>
      </section>

      {/* ============ FEATURE IMAGE CARDS ============ */}
      <section className="mt-6 px-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-bold">Explore Smart Dairy Hub</h2>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {FEATURE_CARDS.map((f, i) => (
            <Link
              key={f.to}
              to={f.to}
              className={`group relative overflow-hidden rounded-2xl bg-card shadow-soft transition-transform active:scale-[0.98] ${
                i === 0 || i === 3 ? "col-span-2 h-40" : "h-44"
              }`}
            >
              <img
                src={f.img}
                alt={f.title}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
              {f.badge && (
                <span className="absolute right-2.5 top-2.5 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                  {f.badge}
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                <div className="font-display text-[15px] font-bold leading-tight">{f.title}</div>
                <div className="mt-0.5 text-[11px] text-white/85">{f.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ============ JERRY CTA ============ */}
      {/* ============ TRUSTED FARMERS ============ */}
      <section className="mt-6 px-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-bold">Trusted Farmers</h2>
          <Link to="/cattle-market" className="text-xs font-semibold text-primary">See all <ChevronRight className="ml-0.5 inline h-3 w-3" /></Link>
        </div>
        <div className="scrollbar-hide -mx-4 mt-3 flex gap-3 overflow-x-auto px-4 pb-2">
          {[
            { name: "Ramesh Patel", village: "Anand, GJ", cattle: 18, rating: 4.9, img: "https://images.unsplash.com/photo-1613323593608-abc90fec84ff?w=400&q=80" },
            { name: "Lakshmi Reddy", village: "Guntur, AP", cattle: 12, rating: 4.8, img: "https://images.unsplash.com/photo-1607346256330-dee7af15f7c5?w=400&q=80" },
            { name: "Suresh Kumar", village: "Karnal, HR", cattle: 24, rating: 4.9, img: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&q=80" },
            { name: "Kavya Iyer", village: "Coimbatore, TN", cattle: 9, rating: 4.7, img: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&q=80" },
            { name: "Mahesh Yadav", village: "Nashik, MH", cattle: 15, rating: 4.8, img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80" },
          ].map((f) => (
            <div key={f.name} className="w-[160px] shrink-0 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft">
              <div className="relative h-24 overflow-hidden">
                <img src={f.img} alt={f.name} loading="lazy" className="h-full w-full object-cover" />
                <span className="absolute right-1.5 top-1.5 flex items-center gap-0.5 rounded-full bg-emerald-600 px-1.5 py-0.5 text-[9px] font-bold text-white shadow">
                  <ShieldCheck className="h-2.5 w-2.5" /> Verified
                </span>
              </div>
              <div className="p-2.5">
                <div className="truncate text-[12px] font-semibold">{f.name}</div>
                <div className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                  <MapPin className="h-2.5 w-2.5" /> {f.village}
                </div>
                <div className="mt-1 flex items-center justify-between text-[10px]">
                  <span className="flex items-center gap-0.5 text-amber-600 font-semibold">
                    <Star className="h-2.5 w-2.5 fill-current" /> {f.rating}
                  </span>
                  <span className="text-muted-foreground">{f.cattle} cattle</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============ POPULAR PRODUCTS ============ */}
      <section className="mt-6 px-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-bold">Popular in Marketplace</h2>
          <Link to="/marketplace" className="text-xs font-semibold text-primary">See all <ChevronRight className="ml-0.5 inline h-3 w-3" /></Link>
        </div>
        <div className="scrollbar-hide -mx-4 mt-3 flex gap-3 overflow-x-auto px-4 pb-2">
          {demoProducts.slice(0, 8).map((p) => (
            <Link key={p.id} to="/marketplace" className="w-[150px] shrink-0 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft transition-transform active:scale-[0.97]">
              <div className="relative h-28 overflow-hidden bg-muted">
                <img src={p.image} alt={p.name} loading="lazy" className="h-full w-full object-cover" />
                {p.mrp > p.price && (
                  <span className="absolute left-1.5 top-1.5 rounded-full bg-rose-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                    {Math.round((1 - p.price / p.mrp) * 100)}% OFF
                  </span>
                )}
              </div>
              <div className="p-2">
                <div className="line-clamp-1 text-[12px] font-semibold">{p.name}</div>
                <div className="mt-0.5 flex items-baseline gap-1 text-primary">
                  <IndianRupee className="h-3 w-3" />
                  <span className="text-[13px] font-bold">{p.price.toLocaleString("en-IN")}</span>
                  <span className="text-[9px] text-muted-foreground">/{p.unit}</span>
                </div>
                <div className="mt-0.5 flex items-center gap-1 text-[9px]">
                  <span className="flex items-center gap-0.5 rounded bg-emerald-600 px-1 py-px font-bold text-white">
                    <Star className="h-2 w-2 fill-current" /> {p.rating}
                  </span>
                  <span className="text-muted-foreground">({p.reviews})</span>
                </div>
                <div className="mt-0.5 flex items-center gap-1 text-[9px] text-emerald-700">
                  <Truck className="h-2.5 w-2.5" /> {p.deliveryDays}d · {p.location}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ============ JERRY CTA ============ */}
      <section className="mt-6 px-4">
        <Link
          to="/ai-chat"
          className="flex items-center gap-3 rounded-3xl bg-gradient-to-br from-primary to-emerald-700 p-4 text-primary-foreground shadow-glow"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
            <Bot className="h-7 w-7" />
          </div>
          <div className="flex-1">
            <div className="font-display text-base font-bold">Ask Jerry, your dairy AI</div>
            <div className="text-xs text-white/85">In your language · voice or text</div>
          </div>
          <ChevronRight className="h-5 w-5" />
        </Link>
      </section>

      {/* ============ DOWNLOAD APP ============ */}
      <DownloadAppSection className="mt-8 px-0" />

      {/* AI Scan is now available via the unified Jerry floating menu */}
    </div>
  );
}
