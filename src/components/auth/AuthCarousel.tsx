import { useEffect, useState } from "react";
import heroCows from "@/assets/hero-cows.jpg";
import vetCare from "@/assets/vet-care.jpg";
import diseaseHero from "@/assets/disease-hero.jpg";
import bannerMarketplace from "@/assets/banner-marketplace.jpg";
import bannerMilk from "@/assets/banner-milk.jpg";
import bannerSchemes from "@/assets/banner-schemes.jpg";
import girCow from "@/assets/gir-cow.jpg";
import murrahBuffalo from "@/assets/murrah-buffalo.jpg";
import cardFeed from "@/assets/card-feed.jpg";

const SLIDES = [
  { img: heroCows, title: "Healthy, Verified Livestock", sub: "Holstein Friesian, Gir, Murrah and more." },
  { img: diseaseHero, title: "AI Disease Detection", sub: "Detect cattle diseases in seconds using Artificial Intelligence." },
  { img: bannerMarketplace, title: "Trusted Marketplace", sub: "Buy and sell verified cattle safely." },
  { img: vetCare, title: "Expert Veterinary Care", sub: "Reach qualified doctors near your village, anytime." },
  { img: bannerMilk, title: "Live Milk Rates", sub: "Compare FAT & SNF rates across collection centers." },
  { img: girCow, title: "Premium Indian Breeds", sub: "Gir, Sahiwal and Red Sindhi from trusted farms." },
  { img: murrahBuffalo, title: "Murrah Buffalo", sub: "High-yield buffaloes verified by our experts." },
  { img: cardFeed, title: "Dairy Feed Store", sub: "Quality feed, minerals and nutrition delivered." },
  { img: bannerSchemes, title: "Government Schemes", sub: "Subsidies and loans, explained simply." },
];

export default function AuthCarousel() {
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setI((p) => (p + 1) % SLIDES.length), 4500);
    return () => clearInterval(t);
  }, []);

  // Preload the next image so slides never flicker or shift.
  useEffect(() => {
    const next = new Image();
    next.src = SLIDES[(i + 1) % SLIDES.length].img;
  }, [i]);

  return (
    <div className="absolute inset-0 h-full w-full overflow-hidden bg-primary/10">
      {SLIDES.map((s, idx) => (
        <div
          key={s.title}
          aria-hidden={idx !== i}
          className={`absolute inset-0 transition-opacity duration-1000 ease-out ${
            idx === i ? "opacity-100" : "opacity-0"
          }`}
        >
          <img
            src={s.img}
            alt=""
            loading={idx === 0 ? "eager" : "lazy"}
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/85 via-emerald-900/25 to-transparent" />
        </div>
      ))}

      <div className="absolute inset-x-0 bottom-0 p-5 md:p-7">
        <div key={i} className="animate-fade-in">
          <h3 className="font-display text-lg font-bold leading-tight text-white drop-shadow-lg md:text-2xl">
            {SLIDES[i].title}
          </h3>
          <p className="mt-1 line-clamp-2 max-w-[90%] text-xs text-white/85 md:text-sm">{SLIDES[i].sub}</p>
        </div>
        <div className="mt-3 flex items-center gap-1.5 md:mt-5">
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
