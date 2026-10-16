import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  User, ChevronRight, Bot, ShieldCheck, Sparkles, Star, MapPin, IndianRupee, Truck, Newspaper,
  Menu, X, ArrowRight, Stethoscope, Store, TrendingUp, Landmark,
} from "lucide-react";
import SmartHeroSearch from "@/components/SmartHeroSearch";
import LanguageSelector from "@/components/LanguageSelector";
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
import { Button } from "@/components/ui/button";

import { QUICK_ACTIONS, BANNERS, FEATURE_CARDS, IMG } from "@/components/home/homeData";


export default function MobileHome() {
  const { user, profile } = useAuth();
  const { openAuth } = useAuthModal();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [bannerIdx, setBannerIdx] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
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
    <div className="mx-auto w-full max-w-md overflow-x-hidden bg-gradient-to-b from-emerald-50/60 via-background to-background pb-6">
      {/* ============ TOP HEADER ============ */}
      <header className="sticky top-0 z-30 bg-background/95 px-4 pb-3 pt-3 shadow-sm backdrop-blur-xl">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <Link to="/" className="flex min-w-0 items-center gap-2">
            <img src="/logo.png" alt="Smart Dairy Hub" className="h-8 w-8 shrink-0 rounded-full object-contain min-[360px]:h-9 min-[360px]:w-9" />
            <div className="min-w-0 leading-tight">
              <div className="whitespace-nowrap font-display text-[13px] font-bold text-primary min-[360px]:text-[15px]">Smart Dairy Hub</div>
              <div className="text-[10px] font-medium text-muted-foreground">
                {user ? `Hi, ${firstName} 👋` : "India's dairy app"}
              </div>
            </div>
          </Link>
          <div className="flex shrink-0 items-center gap-1">
            <LanguageSelector size="sm" />
            {!user && (
              <Button size="sm" className="h-9 px-3 text-xs" onClick={() => openAuth("/")}>Sign in</Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              className="h-9 w-9 shrink-0"
              onClick={() => setMenuOpen((value) => !value)}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Search bar */}
        <div className="mt-3">
          <SmartHeroSearch />
        </div>

        {menuOpen && (
          <nav aria-label="Home menu" className="mt-3 grid grid-cols-2 gap-1 border-t border-border/70 pt-3">
            {[
              { to: "/marketplace", label: "Marketplace", icon: Store },
              { to: "/cattle-market", label: "Cattle", icon: User },
              { to: "/milk-rates", label: "Milk rates", icon: TrendingUp },
              { to: "/vet-contacts", label: "Vets", icon: Stethoscope },
              { to: "/schemes", label: "Schemes", icon: Landmark },
              { to: "/disease-detection", label: "AI scan", icon: Sparkles },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMenuOpen(false)}
                className="flex min-h-11 items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted"
              >
                <item.icon className="h-4 w-4 text-primary" /> {item.label}
              </Link>
            ))}
            {user && (
              <Link
                to="/profile"
                onClick={() => setMenuOpen(false)}
                className="col-span-2 flex min-h-11 items-center gap-2 rounded-md bg-primary/10 px-3 py-2 text-sm font-semibold text-primary"
              >
                <User className="h-4 w-4" /> My profile
              </Link>
            )}
          </nav>
        )}
      </header>

      {/* ============ MOBILE HERO ============ */}
      <section className="relative overflow-hidden px-4 pb-6 pt-7 text-primary-foreground">
        <img
          src={IMG.banner1}
          alt="Indian dairy farm with healthy cattle"
          className="absolute inset-0 h-full w-full object-cover object-center"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/90 via-emerald-950/85 to-emerald-950/95" />
        <div className="relative min-w-0">
          <span className="inline-flex max-w-full items-center gap-2 rounded-full bg-background/15 px-3 py-1.5 text-[11px] font-semibold uppercase ring-1 ring-inset ring-background/25 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 shrink-0" /> AI-powered dairy platform
          </span>
          <h1 className="mt-5 max-w-full break-words font-display text-[clamp(2rem,10vw,3rem)] font-bold leading-[1.08]">
            Everything your dairy farm needs, in one place
          </h1>
          <p className="mt-4 text-sm leading-6 text-primary-foreground/85 sm:text-base">
            Live milk rates, AI disease detection, verified veterinarians, cattle trading and government schemes — built for Indian dairy farmers, in 11 languages.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Button asChild size="lg" className="h-12 w-full justify-center">
              <Link to="/marketplace">Explore marketplace <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            {user ? (
              <Button asChild size="lg" variant="secondary" className="h-12 w-full justify-center">
                <Link to="/dashboard">Go to dashboard</Link>
              </Button>
            ) : (
              <Button size="lg" variant="secondary" className="h-12 w-full" onClick={() => openAuth("/dashboard")}>
                Farmer sign in
              </Button>
            )}
          </div>
          <div className="mt-6 grid gap-2 text-xs text-primary-foreground/80">
            <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 shrink-0" /> Verified vets & sellers</span>
            <span className="inline-flex items-center gap-2"><Sparkles className="h-4 w-4 shrink-0" /> AI diagnosis in seconds</span>
            <span className="inline-flex items-center gap-2"><Newspaper className="h-4 w-4 shrink-0" /> 11 Indian languages</span>
          </div>

          <div className="relative mt-6 aspect-[4/3] min-h-[220px] w-full overflow-hidden rounded-3xl shadow-lift ring-1 ring-background/20">
            {BANNERS.map((banner, index) => (
              <Link
                key={banner.title}
                to={banner.to}
                aria-hidden={index !== bannerIdx}
                tabIndex={index === bannerIdx ? 0 : -1}
                className={`absolute inset-0 flex flex-col justify-end p-5 pb-10 transition-opacity duration-700 ${index === bannerIdx ? "opacity-100" : "pointer-events-none opacity-0"}`}
              >
                <img src={banner.img} alt="" className="absolute inset-0 h-full w-full object-cover object-center" loading={index === 0 ? "eager" : "lazy"} />
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-950/35 to-transparent" />
                <div className="relative pr-2">
                  <div className="font-display text-xl font-bold leading-tight">{banner.title}</div>
                  <div className="mt-1 text-xs leading-5 text-primary-foreground/85">{banner.subtitle}</div>
                  <span className={`mt-3 inline-flex items-center gap-1 rounded-full ${banner.accent} px-3 py-1.5 text-[11px] font-bold`}>
                    {banner.cta} <ChevronRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            ))}
            <div className="absolute bottom-4 right-4 z-10 flex gap-2">
              {BANNERS.map((_, index) => (
                <Button
                  key={index}
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setBannerIdx(index)}
                  aria-label={`Show promotion ${index + 1}`}
                  className="h-6 w-6 rounded-full p-0 hover:bg-background/20"
                >
                  <span className={`block h-1.5 rounded-full bg-primary-foreground transition-all ${index === bannerIdx ? "w-4" : "w-1.5 opacity-60"}`} />
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

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

      {/* ============ TRUST STRIP ============ */}
      <section className="mt-4 px-4">
        <div className="flex items-center justify-between gap-2 rounded-2xl border border-emerald-200/70 bg-emerald-50/80 px-3 py-2.5 text-[11px] font-semibold text-emerald-800">
          <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 shrink-0" /> Verified vets</span>
          <span className="inline-flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 shrink-0" /> AI powered</span>
          <span className="inline-flex items-center gap-1.5"><Newspaper className="h-3.5 w-3.5 shrink-0" /> 11 languages</span>
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
