import { Link } from "react-router-dom";
import { Milk, ShoppingCart, Stethoscope, Landmark, ArrowRight, Store, Instagram } from "lucide-react";
import { useTranslation } from "react-i18next";
import heroImg from "@/assets/hero-dairy.jpg";

const INSTAGRAM_URL = "https://www.instagram.com/smart_dairy_hub";
const instagramGradient = "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)";

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
      <section className="relative h-[85vh] min-h-[500px] overflow-hidden">
        <img
          src={heroImg}
          alt="Dairy farm with cows grazing on green hills"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="hero-overlay absolute inset-0" />
        <div className="relative z-10 container flex h-full flex-col justify-center">
          <div className="max-w-xl animate-fade-in">
            <h1 className="font-display text-4xl font-extrabold leading-tight text-primary-foreground sm:text-5xl lg:text-6xl">
              {t("home.title")}
            </h1>
            <p className="mt-4 text-lg text-primary-foreground/80 sm:text-xl">
              {t("home.subtitle")}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 font-semibold text-accent-foreground transition-transform hover:scale-105"
              >
                {t("home.getStarted")}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/select-role"
                className="inline-flex items-center gap-2 rounded-lg border border-primary-foreground/30 px-6 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary-foreground/10"
              >
                {t("home.farmerLogin")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-20">
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

      <section className="container py-16">
        <div className="relative overflow-hidden rounded-2xl border bg-card p-8 text-center shadow-sm md:p-12">
          <div
            className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-10 blur-3xl"
            style={{ background: instagramGradient }}
          />
          <div
            className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full opacity-10 blur-3xl"
            style={{ background: instagramGradient }}
          />
          <div className="relative z-10 mx-auto max-w-2xl">
            <div
              className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition-transform hover:scale-110"
              style={{ background: instagramGradient }}
            >
              <Instagram className="h-7 w-7" />
            </div>
            <h2 className="font-display text-2xl font-bold sm:text-3xl">Follow Us on Instagram</h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground sm:text-base">
              Follow Smart Dairy Hub for dairy farming tips, milk market updates, livestock information, and product updates.
            </p>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:scale-105 hover:shadow-lg"
              style={{ background: instagramGradient }}
            >
              <Instagram className="h-4 w-4" />
              Follow @smart_dairy_hub
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
