import { useEffect, useState } from "react";
import farmerWoman from "@/assets/auth/farmer-woman-app.jpg";
import heroCows from "@/assets/hero-cows.jpg";
import vetCare from "@/assets/vet-care.jpg";
import diseaseHero from "@/assets/disease-hero.jpg";
import bannerMarketplace from "@/assets/banner-marketplace.jpg";
import bannerMilk from "@/assets/banner-milk.jpg";
import bannerSchemes from "@/assets/banner-schemes.jpg";

const SLIDES = [
  { img: farmerWoman, title: "Built for Every Farmer", sub: "Manage your herd, milk income and orders from one app." },
  { img: diseaseHero, title: "AI Disease Detection", sub: "Detect cattle diseases in seconds using Artificial Intelligence." },
  { img: bannerMarketplace, title: "Trusted Marketplace", sub: "Buy and sell verified cattle safely." },
  { img: vetCare, title: "Expert Veterinary Care", sub: "Reach qualified doctors near your village, anytime." },
  { img: bannerMilk, title: "Live Milk Rates", sub: "Compare FAT & SNF rates across collection centers." },
  { img: heroCows, title: "Healthy, Verified Livestock", sub: "Holstein Friesian, Gir, Murrah and more." },
  { img: bannerSchemes, title: "Government Schemes", sub: "Subsidies and loans, explained simply." },
];

export default function AuthCarousel() {
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setI((p) => (p + 1) % SLIDES.length), 4500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden bg-primary/10">
      {SLIDES.map((s, idx) => (
        <div
          key={s.title}
          aria-hidden={idx !== i}
          className={`absolute inset-0 transition-all duration-1000 ease-out ${
            idx === i ? "scale-100 opacity-100" : "scale-105 opacity-0"
          }`}
        >
          <img
            src={s.img}
            alt=""
            loading={idx === 0 ? "eager" : "lazy"}
            className={`h-full w-full object-cover transition-transform duration-[6000ms] ease-out ${
              idx === i ? "scale-110" : "scale-100"
            }`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/85 via-emerald-900/25 to-transparent" />
          <div className="absolute inset-0 shadow-[inset_0_0_120px_40px_rgba(0,0,0,0.35)]" />
        </div>
      ))}

      <div className="absolute inset-x-0 bottom-0 p-7">
        <div key={i} className="animate-fade-in">
          <h3 className="font-display text-2xl font-bold leading-tight text-white drop-shadow-lg">
            {SLIDES[i].title}
          </h3>
          <p className="mt-1.5 max-w-[85%] text-sm text-white/85">{SLIDES[i].sub}</p>
        </div>
        <div className="mt-5 flex items-center gap-1.5">
          {SLIDES.map((s, idx) => (
            <button
              key={s.title}
              type="button"
              aria-label={`Show slide ${idx + 1}: ${s.title}`}
              onClick={() => setI(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === i ? "w-6 bg-white" : "w-1.5 bg-white/45 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
