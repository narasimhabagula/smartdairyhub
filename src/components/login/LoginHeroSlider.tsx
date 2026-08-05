import { useEffect, useRef, useState } from "react";
import slideFarmer from "@/assets/login/slide-farmer.jpg";
import slideVet from "@/assets/login/slide-vet.jpg";
import slideAi from "@/assets/login/slide-ai.jpg";
import slideFarm from "@/assets/login/slide-farm.jpg";
import slideSubsidy from "@/assets/login/slide-subsidy.jpg";
import slideWomen from "@/assets/login/slide-women.jpg";
import slidePhone from "@/assets/login/slide-phone.jpg";
import slideCollection from "@/assets/login/slide-collection.jpg";

const SLIDES = [
  { img: slideFarmer, alt: "Indian dairy farmer standing proudly beside his cows and buffaloes" },
  { img: slideWomen, alt: "Women dairy farmers smiling beside a healthy buffalo herd" },
  { img: slideCollection, alt: "Fresh milk being poured at a village milk collection centre at sunrise" },
  { img: slideVet, alt: "Veterinarian examining a cow while the farmer watches" },
  { img: slidePhone, alt: "Farmer using the Smart Dairy Hub app on a smartphone inside a modern dairy shed" },
  { img: slideAi, alt: "Farmer scanning a cow with Smart Dairy Hub AI disease detection" },
  { img: slideFarm, alt: "Indian dairy farm at sunrise with milk collection" },
  { img: slideSubsidy, alt: "Farmer receiving digital government subsidy support" },
];

const INTERVAL = 5000;

/**
 * Premium auto-fading hero carousel.
 * Images are never cropped: each photo is fitted with `object-contain` over a
 * blurred, dimmed copy of itself so the frame is filled without cutting a
 * farmer, cow or buffalo in half at any aspect ratio.
 */
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
      className="absolute inset-0 bg-[#0E2A12]"
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
        <div
          key={s.img}
          aria-hidden={idx !== i}
          className={`absolute inset-0 transition-opacity duration-1000 ease-out ${
            idx === i ? "opacity-100" : "opacity-0"
          }`}
        >
          {/* Blurred fill so the frame is never empty, full photo on top. */}
          <img
            src={s.img}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl brightness-[0.55]"
          />
          <img
            src={s.img}
            alt={s.alt}
            width={1280}
            height={960}
            loading={idx === 0 ? "eager" : "lazy"}
            fetchPriority={idx === 0 ? "high" : "low"}
            decoding="async"
            className="absolute inset-0 h-full w-full object-contain object-center"
          />
        </div>
      ))}

      <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5">
        {SLIDES.map((s, idx) => (
          <button
            key={s.img}
            type="button"
            aria-label={`Show slide ${idx + 1}`}
            aria-current={idx === i}
            onClick={() => go(idx)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              idx === i ? "w-6 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
