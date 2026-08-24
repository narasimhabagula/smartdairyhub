import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";
import type { HeroContent } from "./heroContent";

interface HeroPanelProps {
  content: HeroContent;
  /** Show a mobile back button (used on inner pages). */
  showBack?: boolean;
  /** Eager-load the artwork (first hero above the fold). */
  priority?: boolean;
  /** Replace the link CTAs with custom action buttons (e.g. file upload). */
  actions?: React.ReactNode;
  className?: string;
}


/**
 * One responsive hero composition used on every screen size.
 * Text, feature cards and CTAs are real HTML so they scale with the viewport,
 * while the supplied farm artwork renders at its natural aspect ratio
 * (never stretched, never cropped).
 */
export default function HeroPanel({ content, showBack, priority, className = "" }: HeroPanelProps) {
  const navigate = useNavigate();
  const c = content;

  return (
    <section
      className={`relative w-full overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-emerald-50 via-background to-emerald-50/60 shadow-soft dark:from-primary/10 dark:via-card dark:to-primary/5 ${className}`}
    >
      {showBack && (
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="absolute left-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-background/90 text-foreground shadow-md backdrop-blur md:hidden"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
      )}

      <div className="grid items-center gap-5 p-4 pt-5 sm:gap-6 sm:p-7 lg:grid-cols-[1.02fr_0.98fr] lg:gap-9 lg:p-10">
        {/* ---------- Text side ---------- */}
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary sm:text-[11px]">
            <Sparkles className="h-3 w-3" /> {c.eyebrow}
          </span>

          <h1 className="mt-3 font-display text-[26px] font-bold leading-[1.1] tracking-tight text-foreground sm:text-4xl lg:text-5xl xl:text-[3.25rem]">
            {c.title}
            <span className="block text-primary">{c.titleAccent}</span>
          </h1>

          <p className="mt-2.5 max-w-xl text-[13px] leading-relaxed text-muted-foreground sm:text-base">
            {c.subtitle}
          </p>

          {/* Feature cards */}
          <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-5 sm:gap-3 lg:grid-cols-4">
            {c.cards.map((card) => (
              <div
                key={card.title}
                className="flex items-start gap-2 rounded-2xl border border-border/60 bg-card/85 p-2.5 shadow-sm backdrop-blur-sm sm:p-3"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:h-8 sm:w-8">
                  <card.icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[11px] font-bold leading-tight text-foreground sm:text-[13px]">{card.title}</span>
                  <span className="block text-[10px] leading-tight text-muted-foreground sm:text-[11px]">{card.sub}</span>
                </span>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="mt-4 flex flex-wrap gap-2.5 sm:mt-6 sm:gap-3">
            {c.ctas.map((cta) => (
              <Link
                key={cta.label}
                to={cta.to}
                className={
                  cta.variant === "outline"
                    ? "inline-flex h-10 items-center gap-1.5 rounded-full border border-primary/30 bg-background/80 px-4 text-[13px] font-semibold text-primary transition-colors hover:bg-primary/10 sm:h-11 sm:px-6 sm:text-sm"
                    : "inline-flex h-10 items-center gap-1.5 rounded-full bg-primary px-4 text-[13px] font-semibold text-primary-foreground shadow-md transition-transform hover:-translate-y-0.5 sm:h-11 sm:px-6 sm:text-sm"
                }
              >
                {cta.label} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ))}
          </div>
        </div>

        {/* ---------- Visual side ---------- */}
        <div className="min-w-0">
          <Link to={c.to} className="block overflow-hidden rounded-2xl ring-1 ring-border/60">
            <img
              src={c.img}
              alt={c.alt}
              loading={priority ? "eager" : "lazy"}
              decoding="async"
              className="block h-auto w-full object-contain"
            />
          </Link>

          <div className="mt-3 rounded-2xl border border-primary/15 bg-card/90 p-3 shadow-sm sm:p-4">
            <div className="text-[12px] font-bold text-primary sm:text-sm">{c.side.title}</div>
            <ul className="mt-1.5 space-y-1">
              {c.side.items.map((it) => (
                <li key={it} className="flex items-start gap-1.5 text-[11px] leading-snug text-muted-foreground sm:text-[13px]">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /> {it}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
