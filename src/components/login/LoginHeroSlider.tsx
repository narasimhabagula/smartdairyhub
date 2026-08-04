import { useEffect, useRef, useState } from "react";
import slideFarmer from "@/assets/login/slide-farmer.jpg";
import slideVet from "@/assets/login/slide-vet.jpg";
import slideAi from "@/assets/login/slide-ai.jpg";
import slideFarm from "@/assets/login/slide-farm.jpg";
import slideSubsidy from "@/assets/login/slide-subsidy.jpg";

const SLIDES = [
  { img: slideFarmer, alt: "Indian dairy farmer standing proudly beside his cows and buffaloes" },
  { img: slideVet, alt: "Veterinarian examining a cow while the farmer watches" },
  { img: slideAi, alt: "Farmer scanning a cow with Smart Dairy Hub AI disease detection" },
  { img: slideFarm, alt: "Indian dairy farm at sunrise with milk collection" },
  { img: slideSubsidy, alt: "Farmer receiving digital government subsidy support" },
];

const INTERVAL = 4500;

/** Auto-playing Ken Burns hero slider that fills the login hero container. */
export default function LoginHeroSlider() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);

  const go = (n: number) => setI((n + SLIDES.length) % SLIDES.length);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setI((p) => (p + 1) % SLIDES.length), INTERVAL);
    return () => clearInterval(t);
  }, [paused, i]);

  useEffect(() => {
    const next = new Image();
    next.src = SLIDES[(i + 1) % SLIDES.length].img;
  }, [i]);

  return (
    <div
      className="absolute inset-0"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 45) go(dx < 0 ? i + 1 : i - 1);
        touchX.current = null;
      }}
    >
      {SLIDES.map((s, idx) => (
        <img
          key={s.img}
          src={s.img}
          alt={s.alt}
          width={1200}
          height={800}
          loading={idx === 0 ? "eager" : "lazy"}
          decoding="async"
          aria-hidden={idx !== i}
          className={`absolute inset-0 h-full w-full object-cover object-center transition-[opacity,transform] duration-[1200ms] ease-out ${
            idx === i ? "scale-[1.08] opacity-100" : "scale-100 opacity-0"
          }`}
        />
      ))}

      <div className="absolute bottom-2.5 right-3 z-20 flex items-center gap-1.5">
        {SLIDES.map((s, idx) => (
          <button
            key={s.img}
            type="button"
            aria-label={`Show slide ${idx + 1}`}
            onClick={() => go(idx)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              idx === i ? "w-5 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
