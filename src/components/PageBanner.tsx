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
    <div className={`container pt-3 md:pt-6 ${className}`}>
      <div className="flex min-h-[120px] items-center overflow-hidden rounded-2xl border border-border/60 bg-muted/40 shadow-soft sm:min-h-[160px] md:min-h-[200px] md:rounded-3xl">
        <img
          src={image}
          alt={alt}
          className="block h-auto w-full object-contain text-xs text-muted-foreground"
          loading="eager"
          decoding="async"
        />
      </div>
    </div>
  );
}

