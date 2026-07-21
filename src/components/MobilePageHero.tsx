import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface MobilePageHeroProps {
  image: string;
  title: string;
  subtitle?: string;
  eyebrow?: string;
  height?: string;
}

/**
 * Premium mobile-app style page hero with a full-bleed image, gradient overlay,
 * back button and title. Matches the reference mobile-app UI style.
 */
export default function MobilePageHero({
  image,
  title,
  subtitle,
  eyebrow,
  height = "h-56",
}: MobilePageHeroProps) {
  const navigate = useNavigate();
  return (
    <div className={`relative ${height} w-full overflow-hidden md:hidden`}>
      <img
        src={image}
        alt={title}
        className="absolute inset-0 h-full w-full object-cover"
        loading="eager"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20" />
      <button
        onClick={() => navigate(-1)}
        aria-label="Back"
        className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-foreground shadow-lg backdrop-blur"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
      <div className="absolute inset-x-0 bottom-0 p-5 text-white">
        {eyebrow && (
          <div className="mb-1 inline-block rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur">
            {eyebrow}
          </div>
        )}
        <h1 className="font-display text-2xl font-bold leading-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-white/85">{subtitle}</p>}
      </div>
    </div>
  );
}
