interface PageBannerProps {
  image: string;
  alt: string;
  /** Extra classes for the outer wrapper (spacing overrides). */
  className?: string;
}

/**
 * Full-content-width desktop hero banner. Renders the supplied artwork at its
 * natural aspect ratio (never stretched) inside a rounded, softly shadowed
 * frame directly below the main navigation. Hidden on mobile, where each page
 * uses MobilePageHero instead.
 */
export default function PageBanner({ image, alt, className = "" }: PageBannerProps) {
  return (
    <div className={`container hidden pt-6 md:block ${className}`}>
      <div className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-soft">
        <img
          src={image}
          alt={alt}
          className="block h-auto w-full object-cover"
          loading="eager"
          decoding="async"
        />
      </div>
    </div>
  );
}
