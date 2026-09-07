interface PageBannerProps {
  image: string;
  alt: string;
  /** Extra classes for the outer wrapper (spacing overrides). */
  className?: string;
}

/**
 * Shared page hero banner used on every breakpoint. Renders the supplied
 * artwork at its natural aspect ratio (never cropped or stretched) inside a
 * rounded, softly shadowed frame directly below the main navigation.
 */
export default function PageBanner({ image, alt, className = "" }: PageBannerProps) {
  return (
    <div className={`container pt-4 md:pt-6 ${className}`}>
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft md:rounded-3xl">
        <img
          src={image}
          alt={alt}
          className="block h-auto w-full object-contain"
          loading="eager"
          decoding="async"
        />
      </div>
    </div>
  );
}

