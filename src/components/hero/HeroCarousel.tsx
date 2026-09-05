import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import HeroBannerSlide from "./HeroBannerSlide";
import { HERO_BANNERS, type HeroBanner } from "./heroBanners";

const INTERVAL = 5500;

interface HeroCarouselProps {
  banners?: HeroBanner[];
  className?: string;
}

/**
 * The single main hero carousel of the homepage. Same composition on mobile,
 * tablet, laptop and desktop — slides are stacked in one grid cell so the
 * container keeps a constant height (no layout jump) while cross-fading.
 */
export default function HeroCarousel({ banners = HERO_BANNERS, className = "" }: HeroCarouselProps) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);
  const n = banners.length;

  const go = (next: number) => setI((next + n) % n);

  useEffect(() => {
    if (paused || n < 2) return;
    const id = setInterval(() => setI((p) => (p + 1) % n), INTERVAL);
    return () => clearInterval(id);
  }, [paused, n, i]);

  return (
    <div
      className={`relative w-full ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 45) go(dx < 0 ? i + 1 : i - 1);
        touchX.current = null;
      }}
      role="region"
      aria-roledescription="carousel"
      aria-label="Smart Dairy Hub highlights"
    >
      <div className="grid">
        {banners.map((b, idx) => (
          <div
            key={b.key}
            aria-hidden={idx !== i}
            className={`col-start-1 row-start-1 transition-opacity duration-700 ease-out ${
              idx === i ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <HeroBannerSlide banner={b} priority={idx === 0} />
          </div>
        ))}
      </div>

      {/* Arrows */}
      <button
        onClick={() => go(i - 1)}
        aria-label="Previous slide"
        className="absolute left-1.5 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 text-foreground shadow-lg ring-1 ring-border/60 backdrop-blur transition-colors hover:bg-background sm:flex lg:-left-4"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={() => go(i + 1)}
        aria-label="Next slide"
        className="absolute right-1.5 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 text-foreground shadow-lg ring-1 ring-border/60 backdrop-blur transition-colors hover:bg-background sm:flex lg:-right-4"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Dots */}
      <div className="mt-3 flex items-center justify-center gap-1.5">
        {banners.map((b, idx) => (
          <button
            key={b.key}
            onClick={() => go(idx)}
            aria-label={`Show ${b.title}`}
            aria-current={idx === i}
            className={`h-1.5 rounded-full transition-all ${idx === i ? "w-6 bg-primary" : "w-1.5 bg-primary/30 hover:bg-primary/60"}`}
          />
        ))}
      </div>
    </div>
  );
}
