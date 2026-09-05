import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import type { HeroBanner } from "./heroBanners";

interface HeroBannerSlideProps {
  banner: HeroBanner;
  priority?: boolean;
}

/**
 * One full-bleed rounded hero banner card: background image, soft dark gradient
 * for text legibility, headline, subtitle and CTA. Same composition on mobile,
 * tablet and desktop — only the height and type scale change.
 */
export default function HeroBannerSlide({ banner, priority }: HeroBannerSlideProps) {
  return (
    <Link
      to={banner.to}
      className="relative block h-[190px] w-full overflow-hidden rounded-3xl sm:h-[260px] lg:h-[340px] xl:h-[380px]"
    >
      <img
        src={banner.img}
        alt={banner.alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7 lg:p-10">
        <h2 className="font-display text-xl font-bold leading-tight text-white drop-shadow sm:text-3xl lg:text-4xl">
          {banner.title}
        </h2>
        <p className="mt-1 max-w-md text-[12px] leading-snug text-white/85 sm:text-sm lg:text-base">
          {banner.subtitle}
        </p>
        <span
          className={`mt-3 inline-flex h-9 items-center gap-1 rounded-full px-4 text-[13px] font-semibold shadow-md sm:h-11 sm:px-6 sm:text-sm ${banner.accent}`}
        >
          {banner.cta} <ChevronRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}
