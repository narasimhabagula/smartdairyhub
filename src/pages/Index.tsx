import { Link } from "react-router-dom";
import { Milk, ShoppingCart, Stethoscope, Landmark, ArrowRight } from "lucide-react";
import heroImg from "@/assets/hero-dairy.jpg";

const features = [
  {
    icon: Milk,
    title: "Milk Rate Calculator",
    desc: "Calculate milk price instantly based on FAT & SNF values.",
    to: "/milk-calculator",
  },
  {
    icon: ShoppingCart,
    title: "Buy & Sell Cattle",
    desc: "Browse cows and buffaloes for sale or list your own.",
    to: "/cattle-market",
  },
  {
    icon: Stethoscope,
    title: "Vet Contacts",
    desc: "Find veterinary doctors near you for emergency care.",
    to: "/vet-contacts",
  },
  {
    icon: Landmark,
    title: "Govt. Schemes",
    desc: "Explore subsidies, loans, and government programs for farmers.",
    to: "/schemes",
  },
];

export default function Landing() {
  return (
    <div>
      {/* Hero */}
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
              Smart Dairy Management
            </h1>
            <p className="mt-4 text-lg text-primary-foreground/80 sm:text-xl">
              Manage your dairy business effortlessly — calculate milk rates, trade cattle, find vets, and access government schemes all in one place.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 font-semibold text-accent-foreground transition-transform hover:scale-105"
              >
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-lg border border-primary-foreground/30 px-6 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary-foreground/10"
              >
                Farmer Login
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container py-20">
        <h2 className="text-center font-display text-3xl font-bold sm:text-4xl">
          Everything You Need
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-center text-muted-foreground">
          A complete dairy management platform designed for Indian dairy farmers.
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <Link
              key={f.title}
              to={f.to}
              className="group rounded-xl border bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-lg"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3 text-primary">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-bold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                Explore <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
