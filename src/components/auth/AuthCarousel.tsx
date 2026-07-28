import { useEffect, useRef, useState } from "react";
import farmerPro from "@/assets/auth/farmer-pro-portrait.jpg";
import vetPortrait from "@/assets/auth/vet-portrait.jpg";
import smartFarm from "@/assets/auth/smart-farm-portrait.jpg";
import heroCows from "@/assets/hero-cows.jpg";

const SLIDES = [
  { img: farmerPro, title: "Welcome to Smart Dairy Hub", sub: "Trusted by dairy farmers across India." },
  { img: heroCows, title: "Healthy, Productive Herds", sub: "Holstein Friesian, Gir, Murrah and more." },
  { img: vetPortrait, title: "Vets Near Your Village", sub: "Qualified doctors, available when you need them." },
  { img: smartFarm, title: "Modern Smart Dairy Farms", sub: "Data-driven farming for higher yield." },
];

const INTERVAL = 5000;

export default function AuthCarousel() {
  const [i, setI] = useState(0);
  const touchX = useRef<number | null>(null);

  const go = (n: number) => setI((n + SLIDES.length) % SLIDES.length);

  useEffect(() => {
    const t = setInterval(() => setI((p) => (p + 1) % SLIDES.length), INTERVAL);
    return () => clearInterval(t);
  }, [i]);

  // Preload the next image so slides never flicker or shift.
  useEffect(() => {
    const next = new Image();
    next.src = SLIDES[(i + 1) % SLIDES.length].img;
  }, [i]);

  return (
    <div
      className="absolute inset-0 h-full w-full overflow-hidden bg-emerald-950"
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 45) go(dx < 0 ? i + 1 : i - 1);
        touchX.current = null;
      }}
    >
      {SLIDES.map((s, idx) => (
        <div
          key={s.title}
          aria-hidden={idx !== i}
          className={`absolute inset-0 transition-opacity duration-[900ms] ease-out ${
            idx === i ? "opacity-100" : "opacity-0"
          }`}
        >
          {/* Blurred backdrop fills the panel so the main image is never cropped */}
          <img
            src={s.img}
            alt=""
            aria-hidden
            loading={idx === 0 ? "eager" : "lazy"}
            decoding="async"
            className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl brightness-75 saturate-150"
          />
          {/* Main image — fully visible, gentle Ken Burns */}
          <img
            src={s.img}
            alt={s.title}
            loading={idx === 0 ? "eager" : "lazy"}
            {...(idx === 0 ? { fetchpriority: "high" } as any : {})}
            decoding="async"
            className={`absolute inset-0 h-full w-full object-contain object-center transition-transform duration-[6000ms] ease-out ${
              idx === i ? "scale-[1.04]" : "scale-100"
            }`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/90 via-emerald-950/20 to-emerald-950/10" />
        </div>
      ))}

      <div className="absolute inset-x-0 bottom-0 p-4 md:p-7">
        <div key={i} className="animate-fade-in">
          <h3 className="font-display text-base font-bold leading-tight text-white drop-shadow-lg md:text-2xl">
            {SLIDES[i].title}
          </h3>
          <p className="mt-1 line-clamp-2 max-w-[92%] text-[11px] text-white/85 md:text-sm">{SLIDES[i].sub}</p>
        </div>
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 md:mt-5">
          {SLIDES.map((s, idx) => (
            <button
              key={s.title}
              type="button"
              aria-label={`Show slide ${idx + 1}: ${s.title}`}
              onClick={() => go(idx)}
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
