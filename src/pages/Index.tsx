import { Link } from "react-router-dom";
import { Milk, ShoppingCart, Stethoscope, Landmark, ArrowRight, Store } from "lucide-react";
import { useTranslation } from "react-i18next";
import heroImg from "@/assets/hero-dairy.jpg";


export default function Landing() {
  const { t } = useTranslation();

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
        className="relative -mt-px block h-[calc(100dvh-4rem)] min-h-[600px] w-full overflow-hidden bg-[hsl(150_30%_12%)] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-20 after:content-[''] after:bg-gradient-to-t after:from-background after:to-transparent after:md:hidden md:h-[85vh] md:min-h-[500px]"
      >
        <img
          src={heroImg}
          alt="Dairy farm with cows grazing on green hills"
          className="absolute inset-0 block h-full w-full scale-110 object-cover object-center transition-transform duration-700 md:scale-100"
        />
        {/* Same left-to-right overlay on all viewports for desktop-parity */}
        <div className="hero-overlay absolute inset-0" />
        <div className="relative z-10 container flex h-full flex-col justify-center px-5 sm:px-6 md:px-8">
          <div className="max-w-[34rem] animate-fade-in">
            <h1 className="font-display text-[2rem] font-extrabold leading-tight text-primary-foreground sm:text-5xl lg:text-6xl">
              {t("home.title")}
            </h1>
            <p className="mt-3 text-sm text-primary-foreground/85 sm:mt-4 sm:text-xl">
              {t("home.subtitle")}
            </p>
            <div className="mt-5 flex flex-row flex-wrap gap-3 sm:mt-7 sm:gap-4">
              <Link
                to="/dashboard"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground shadow-lg shadow-black/20 transition-transform hover:scale-105 sm:flex-none sm:px-6 sm:py-3.5 sm:text-base"
              >
                {t("home.getStarted")}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/select-role"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-primary-foreground/40 bg-white/5 px-4 py-3 text-sm font-semibold text-primary-foreground backdrop-blur-sm transition-colors hover:bg-primary-foreground/10 sm:flex-none sm:px-6 sm:py-3.5 sm:text-base"
              >
                {t("home.farmerLogin")}
              </Link>
            </div>
          </div>
        </div>
      </section>


      <section className="relative z-20 border-t border-border/40 bg-background py-20">
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
