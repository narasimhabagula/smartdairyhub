import { useId, useState } from "react";
import { Download, HelpCircle, Loader2, ShieldCheck, Check, X } from "lucide-react";
import { APK, apkSizeLabel, downloadApk } from "@/lib/apk";
import { useUiStrings } from "@/lib/uiStrings";
import { cn } from "@/lib/utils";

type Props = { className?: string };

/** Small inline Android robot mark (kept as an icon, not an image asset). */
function AndroidMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M6 9.5A1.5 1.5 0 0 0 4.5 11v5a1.5 1.5 0 0 0 3 0v-5A1.5 1.5 0 0 0 6 9.5Zm12 0A1.5 1.5 0 0 0 16.5 11v5a1.5 1.5 0 0 0 3 0v-5A1.5 1.5 0 0 0 18 9.5ZM8.5 9h7A1.5 1.5 0 0 1 17 10.5v7A1.5 1.5 0 0 1 15.5 19h-.6v1.6a1.4 1.4 0 1 1-2.8 0V19h-1.2v1.6a1.4 1.4 0 1 1-2.8 0V19h-.6A1.5 1.5 0 0 1 7 17.5v-7A1.5 1.5 0 0 1 8.5 9ZM12 2.6c2.7 0 4.9 1.9 5.2 4.4H6.8C7.1 4.5 9.3 2.6 12 2.6Zm-2.4 2a.65.65 0 1 0 0 1.3.65.65 0 0 0 0-1.3Zm4.8 0a.65.65 0 1 0 0 1.3.65.65 0 0 0 0-1.3Z" />
    </svg>
  );
}

/**
 * Premium Android app download band — matches the approved reference design.
 * Fully translated through the site-wide language system and wired to the real
 * uploaded APK asset (direct .apk download, never a zip).
 */
export default function DownloadAppSection({ className }: Props) {
  const s = useUiStrings();
  const titleId = useId();
  const [state, setState] = useState<"idle" | "working" | "done">("idle");
  const [guide, setGuide] = useState(false);

  const start = async () => {
    if (state === "working") return;
    setState("working");
    try {
      await downloadApk();
    } finally {
      setState("done");
      window.setTimeout(() => setState("idle"), 4000);
    }
  };


  const steps = [s.dlStep1, s.dlStep2, s.dlStep3, s.dlStep4];

  return (
    <section
      className={cn("relative overflow-hidden px-4 py-12 sm:px-6 lg:py-20", className)}
      aria-labelledby={titleId}
    >
      {/* soft agricultural curves */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -right-24 -top-24 h-[26rem] w-[26rem] rounded-full bg-primary/[0.07] blur-2xl" />
        <div className="absolute -bottom-40 -left-20 h-[24rem] w-[24rem] rounded-full bg-primary/[0.06] blur-2xl" />
      </div>

      <div className="relative mx-auto w-full max-w-6xl">
        <div className="grid items-center gap-10 rounded-[32px] border border-border/60 bg-card p-6 shadow-soft sm:p-9 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:p-12">
          {/* ── Copy ── */}
          <div className="text-center lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/[0.06] px-3.5 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-primary">
              <AndroidMark className="h-3.5 w-3.5" /> {s.dlBadge}
            </span>

            <h2
              id={titleId}
              className="mt-4 font-display text-3xl font-extrabold leading-[1.08] tracking-tight text-foreground sm:text-4xl lg:text-5xl"
            >
              {s.dlHeadA}
              <span className="mt-1 block text-primary">{s.dlHeadB}</span>
            </h2>

            <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-muted-foreground lg:mx-0">
              {s.dlDesc}
            </p>

            {/* Buttons */}
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center lg:justify-start">
              <button
                type="button"
                onClick={start}
                disabled={state === "working"}
                aria-live="polite"
                className="inline-flex h-14 items-center justify-center gap-2.5 rounded-2xl bg-primary px-7 text-[15px] font-bold text-primary-foreground shadow-lg transition-all hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25 disabled:opacity-80"
              >
                {state === "working" ? (
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                ) : state === "done" ? (
                  <Check className="h-5 w-5" aria-hidden />
                ) : (
                  <AndroidMark className="h-5 w-5" />
                )}
                {state === "working" ? s.dlPreparing : state === "done" ? s.dlStarted : s.dlButton}
                {state === "idle" && <Download className="h-4 w-4" aria-hidden />}
              </button>

              <button
                type="button"
                onClick={() => setGuide((v) => !v)}
                aria-expanded={guide}
                className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-border bg-background px-6 text-[15px] font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
              >
                {s.dlHowTo}
                <HelpCircle className="h-4 w-4 text-primary" aria-hidden />
              </button>
            </div>

            {/* APK card */}
            <div className="mt-6 flex items-center gap-4 rounded-2xl border border-border/70 bg-background p-4 text-left shadow-sm">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <AndroidMark className="h-6 w-6" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[15px] font-bold text-foreground" data-no-translate>
                  {APK.filename}
                </span>
                <span className="mt-0.5 block text-[13px] text-muted-foreground">
                  {s.dlApkLabel}
                  {apkSizeLabel() ? ` • ${apkSizeLabel()}` : ""} • {s.dlAndroidVersion}
                </span>
              </span>
            </div>

            <p className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[12.5px] font-medium text-muted-foreground lg:justify-start">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-primary" aria-hidden /> {s.dlSafe}
              </span>
              <span aria-hidden>•</span>
              <span>{s.dlVerified}</span>
            </p>

            {/* Install guide — expandable panel */}
            {guide && (
              <div className="mt-5 rounded-2xl border border-primary/20 bg-primary/[0.04] p-5 text-left">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-display text-[15px] font-bold text-foreground">{s.dlInstallTitle}</h3>
                  <button
                    type="button"
                    onClick={() => setGuide(false)}
                    aria-label={s.dlGotIt}
                    className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted"
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                </div>
                <ol className="mt-3 space-y-2.5">
                  {steps.map((step, i) => (
                    <li key={step} className="flex items-start gap-3 text-[13.5px] text-foreground/85">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-[12px] font-bold text-primary-foreground">
                        {i + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>

          {/* ── Phone mockup ── */}
          <div className="relative mx-auto w-full max-w-[300px] lg:max-w-none">
            <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-primary/[0.07] blur-3xl" />
            <div className="mx-auto w-[250px] rounded-[42px] border-[9px] border-slate-900 bg-slate-900 p-1 shadow-2xl sm:w-[268px]">
              <div className="relative overflow-hidden rounded-[34px] bg-gradient-to-b from-sky-50 via-emerald-50 to-white">
                <span className="absolute left-1/2 top-2 h-1.5 w-16 -translate-x-1/2 rounded-full bg-slate-800/80" />
                <div className="flex h-[440px] flex-col items-center px-5 pt-12">
                  <img
                    src="/logo.png"
                    alt=""
                    width={92}
                    height={92}
                    loading="lazy"
                    decoding="async"
                    className="h-[92px] w-[92px] object-contain drop-shadow"
                  />
                  <div className="mt-3 text-center">
                    <div className="text-[16px] font-extrabold tracking-tight text-emerald-900" data-no-translate>
                      Smart Dairy Hub
                    </div>
                    <div className="mt-0.5 text-[11.5px] font-medium text-emerald-700">{s.tagline}</div>
                  </div>

                  {/* stylised farm curves */}
                  <div className="relative mt-auto h-[150px] w-full">
                    <div className="absolute bottom-0 left-[-12%] h-[86px] w-[70%] rounded-t-[100%] bg-emerald-300/70" />
                    <div className="absolute bottom-0 right-[-14%] h-[110px] w-[78%] rounded-t-[100%] bg-emerald-500/70" />
                    <div className="absolute bottom-0 left-[10%] h-[62px] w-[85%] rounded-t-[100%] bg-emerald-700/80" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Google Play — coming soon ── */}
        <div className="mt-6 grid items-center gap-6 rounded-[28px] border border-border/60 bg-gradient-to-r from-primary/[0.06] to-background p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:gap-10">
          <div className="text-center lg:text-left">
            <h3 className="font-display text-2xl font-extrabold leading-tight tracking-tight text-foreground sm:text-3xl">
              {s.dlPlayA} <span className="text-primary">{s.dlPlayB}</span>
            </h3>
            <p className="mx-auto mt-2 max-w-md text-[14.5px] text-muted-foreground lg:mx-0">{s.dlPlayLead}</p>
            <p className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[12.5px] font-medium text-muted-foreground lg:justify-start">
              <span className="inline-flex items-center gap-1.5">
                <AndroidMark className="h-4 w-4 text-primary" /> {s.dlAndroidApp}
              </span>
              <span aria-hidden>•</span>
              <span>{s.dlPlayNote}</span>
            </p>
          </div>

          <div className="flex flex-col items-center gap-3">
            <div className="flex w-full max-w-[240px] items-center justify-center gap-3 rounded-2xl bg-slate-900 px-5 py-3 text-white">
              <svg viewBox="0 0 24 24" aria-hidden className="h-6 w-6 shrink-0">
                <path fill="#00D2FF" d="M3.6 2.2 13.9 12 3.6 21.8A1.7 1.7 0 0 1 3 20.5V3.5c0-.5.2-1 .6-1.3Z" />
                <path fill="#FFCE00" d="M17.6 8.4 20.9 10.4c1 .6 1 2 0 2.6l-3.3 2-3.1-3 3.1-3.6Z" />
                <path fill="#00F076" d="M3.6 2.2c.4-.3 1-.3 1.5 0l12.5 6.2-3.7 3.6L3.6 2.2Z" />
                <path fill="#FF3A44" d="M13.9 12l3.7 3.6L5.1 21.8c-.5.3-1.1.3-1.5 0L13.9 12Z" />
              </svg>
              <span className="text-left leading-tight">
                <span className="block text-[9.5px] font-semibold uppercase tracking-widest text-white/80">
                  {s.dlGetItOn}
                </span>
                <span className="block text-[17px] font-bold" data-no-translate>
                  Google Play
                </span>
              </span>
            </div>
            <span className="inline-flex h-11 w-full max-w-[240px] items-center justify-center rounded-full bg-primary px-6 text-[14px] font-bold text-primary-foreground">
              {s.dlComingSoon}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
