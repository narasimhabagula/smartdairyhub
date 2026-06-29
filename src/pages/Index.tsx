import { Link } from "react-router-dom";
import { Milk, ShoppingCart, Stethoscope, Landmark, ArrowRight, Store } from "lucide-react";
import { useTranslation } from "react-i18next";
import heroImg from "@/assets/hero-dairy.jpg";
import { useAuth } from "@/contexts/AuthContext";
import SmartHeroSearch from "@/components/SmartHeroSearch";



export default function Landing() {
  const { t } = useTranslation();
  const { user } = useAuth();


  const features = [
    { icon: Store, key: "marketplace", to: "/marketplace" },
    { icon: Milk, key: "calculator", to: "/milk-calculator" },
    { icon: ShoppingCart, key: "cattle", to: "/cattle-market" },
    { icon: Stethoscope, key: "vet", to: "/vet-contacts" },
    { icon: Landmark, key: "schemes", to: "/schemes" },
  ] as const;

  return (
    <div>
      <section
        className="relative -mt-px block h-[calc(100dvh-4rem)] min-h-[600px] w-full overflow-hidden bg-[hsl(150_30%_12%)] md:h-[85vh] md:min-h-[500px]"
      >
        <img
          src={heroImg}
          alt="Dairy farm with cows grazing on green hills"
          className="absolute inset-0 block h-full w-full scale-110 object-cover object-center transition-transform duration-700 md:scale-100"
        />
        {/* Same left-to-right overlay on all viewports for desktop-parity */}
        <div className="hero-overlay absolute inset-0" />
        {user && (
          <div className="absolute left-1/2 top-4 z-20 w-[92%] -translate-x-1/2 sm:top-6 md:top-8 md:w-[70%] lg:w-[65%]">
            <SmartHeroSearch />
          </div>
        )}
        <div className="relative z-10 container flex h-full flex-col justify-center px-5 sm:px-6 md:px-8">
          <div className="max-w-[34rem] animate-fade-in">
            <h1 className="font-display text-[2rem] font-extrabold leading-tight text-primary-foreground sm:text-5xl lg:text-6xl">
              {t("home.title")}
            </h1>
            <p className="mt-3 text-sm text-primary-foreground/85 sm:mt-4 sm:text-xl">
              {t("home.subtitle")}
            </p>
            <div className="mt-5 flex flex-row flex-wrap items-center gap-3 sm:mt-7 sm:gap-4">
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground shadow-lg shadow-black/20 transition-transform hover:scale-105 sm:px-6 sm:py-3.5 sm:text-base"
              >
                {t("home.getStarted")}
                <ArrowRight className="h-4 w-4" />
              </Link>
              {!user && (
                <Link
                  to="/select-role"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-primary-foreground/40 bg-white/5 px-4 py-3 text-sm font-semibold text-primary-foreground backdrop-blur-sm transition-colors hover:bg-primary-foreground/10 sm:flex-none sm:px-6 sm:py-3.5 sm:text-base"
                >
                  {t("home.farmerLogin")}
                </Link>
              )}
            </div>

          </div>
        </div>

        {/* Natural bottom transition: subtle green grass silhouette + soft blending */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 md:hidden">
          {/* Soft green-tinted blend that marries the hero to the next section */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[hsl(140_40%_16%)]/60 via-[hsl(140_30%_18%)]/25 to-transparent" />
          {/* Organic grass / leaves divider */}
          <svg
            viewBox="0 0 1440 120"
            preserveAspectRatio="none"
            className="relative h-16 w-full opacity-85"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="grassGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(140 40% 24%)" stopOpacity="0.35" />
                <stop offset="100%" stopColor="hsl(140 45% 16%)" stopOpacity="0.9" />
              </linearGradient>
            </defs>
            {/* Gentle curved hill */}
            <path
              d="M0,120 L0,60 C180,85 360,35 540,55 C720,75 900,25 1080,45 C1260,65 1380,55 1440,40 L1440,120 Z"
              fill="url(#grassGrad)"
            />
            {/* Grass blade silhouettes */}
            <g fill="hsl(140 35% 20%)" opacity="0.7">
              <path d="M60,120 Q65,80 50,60 Q75,85 80,120 Z" />
              <path d="M120,120 Q125,75 105,50 Q135,80 140,120 Z" />
              <path d="M220,120 Q215,85 235,65 Q240,90 250,120 Z" />
              <path d="M340,120 Q350,70 330,45 Q360,80 365,120 Z" />
              <path d="M460,120 Q455,82 475,62 Q480,95 490,120 Z" />
              <path d="M580,120 Q590,72 570,48 Q600,78 605,120 Z" />
              <path d="M700,120 Q705,86 685,66 Q720,92 725,120 Z" />
              <path d="M820,120 Q830,68 810,42 Q840,76 845,120 Z" />
              <path d="M940,120 Q935,84 955,64 Q960,94 970,120 Z" />
              <path d="M1060,120 Q1070,70 1050,46 Q1080,80 1085,120 Z" />
              <path d="M1180,120 Q1185,88 1165,68 Q1200,92 1205,120 Z" />
              <path d="M1300,120 Q1310,66 1290,40 Q1320,74 1325,120 Z" />
              <path d="M1380,120 Q1385,86 1365,66 Q1395,90 1400,120 Z" />
            </g>
          </svg>
        </div>
      </section>


      <section className="container relative z-20 border-t border-border/40 bg-background py-20 md:border-t-0">
        <h2 className="text-center font-display text-3xl font-bold sm:text-4xl">
          {t("home.everythingTitle")}
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-center text-muted-foreground">
          {t("home.everythingSubtitle")}
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {features.map((f) => (
            <Link
              key={f.key}
              to={f.to}
              className="group rounded-xl border bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3 text-primary">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-bold">{t(`home.features.${f.key}.title`)}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{t(`home.features.${f.key}.desc`)}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                {t("home.explore")} <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
