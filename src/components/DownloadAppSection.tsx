import { useState } from "react";
import { Check, Download, Loader2, Smartphone, ShieldCheck } from "lucide-react";
import { APK, apkSizeLabel, downloadApk } from "@/lib/apk";
import { useUiStrings } from "@/lib/uiStrings";
import { cn } from "@/lib/utils";

type Props = { className?: string };

/**
 * Premium "Download the app" band. Fully translated, responsive
 * (phone mockup beside the copy on desktop, stacked on mobile) and wired to the
 * real uploaded APK asset — never a hard-coded URL.
 */
export default function DownloadAppSection({ className }: Props) {
  const s = useUiStrings();
  const [state, setState] = useState<"idle" | "working" | "done">("idle");

  const start = () => {
    if (state === "working") return;
    setState("working");
    window.setTimeout(() => {
      downloadApk();
      setState("done");
      window.setTimeout(() => setState("idle"), 4000);
    }, 350);
  };

  const label =
    state === "working" ? s.dlPreparing : state === "done" ? s.dlStarted : s.dlButton;

  return (
    <section className={cn("px-4 py-10 sm:px-6 lg:py-16", className)} aria-labelledby="sdh-download-title">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-8 overflow-hidden rounded-[32px] border border-border/60 bg-gradient-to-br from-primary to-emerald-700 p-6 text-primary-foreground shadow-glow sm:p-9 lg:flex-row lg:gap-14 lg:p-12">
        {/* Copy */}
        <div className="w-full flex-1 text-center lg:text-left">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] backdrop-blur">
            <Smartphone className="h-3 w-3" aria-hidden /> Android
          </span>
          <h2
            id="sdh-download-title"
            className="mt-3 font-display text-2xl font-bold leading-tight sm:text-3xl lg:text-4xl"
          >
            {s.dlTitle}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/85 lg:mx-0 lg:text-base">
            {s.dlLead}
          </p>

          <ul className="mx-auto mt-5 grid max-w-xl gap-2 text-left text-[13px] text-white/90 sm:grid-cols-2 lg:mx-0">
            {[s.dlPoint1, s.dlPoint2, s.dlPoint3].map((p) => (
              <li key={p} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span>{p}</span>
              </li>
            ))}
          </ul>

          <div className="mt-7 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center lg:justify-start">
            <button
              type="button"
              onClick={start}
              aria-live="polite"
              className="inline-flex h-14 items-center justify-center gap-2.5 rounded-2xl bg-white px-7 text-[15px] font-bold text-emerald-800 shadow-lg transition-all hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/50 disabled:opacity-80"
              disabled={state === "working"}
            >
              {state === "working" ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              ) : state === "done" ? (
                <Check className="h-5 w-5" aria-hidden />
              ) : (
                <Download className="h-5 w-5" aria-hidden />
              )}
              {label}
            </button>

            <a
              href={APK.url}
              download={APK.filename}
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-white/35 bg-white/10 px-6 text-[15px] font-semibold backdrop-blur transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
            >
              <Download className="h-4 w-4" aria-hidden /> {s.dlApk}
            </a>
          </div>

          <p className="mt-3 flex items-center justify-center gap-1.5 text-[12px] text-white/75 lg:justify-start">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
            <span>
              {s.dlNote}
              {apkSizeLabel() ? ` · ${apkSizeLabel()}` : ""}
            </span>
          </p>
        </div>

        {/* Phone mockup — decorative, hidden on the smallest screens */}
        <div aria-hidden className="hidden w-[250px] shrink-0 sm:block">
          <div className="mx-auto h-[430px] w-[215px] rounded-[38px] border-[7px] border-white/25 bg-white/95 p-2.5 shadow-2xl">
            <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[28px] bg-gradient-to-b from-emerald-50 to-white">
              <div className="mx-auto mt-2 h-1.5 w-14 rounded-full bg-slate-300" />
              <div className="flex flex-col items-center px-4 pt-6">
                <img
                  src="/logo.png"
                  alt=""
                  width={64}
                  height={64}
                  loading="lazy"
                  decoding="async"
                  className="h-16 w-16 object-contain"
                />
                <div className="mt-2 text-[13px] font-extrabold text-slate-900">{s.brand}</div>
                <div className="text-[10px] font-medium text-emerald-700">{s.tagline}</div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 px-3">
                {["₹ 42.5", "FAT 6.2", "SNF 8.8", "24×7"].map((v) => (
                  <div key={v} className="rounded-xl bg-white p-2 text-center shadow-sm ring-1 ring-black/[0.04]">
                    <div className="text-[12px] font-bold text-slate-900">{v}</div>
                    <div className="h-1 w-full rounded bg-emerald-100" />
                  </div>
                ))}
              </div>
              <div className="mt-3 space-y-2 px-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-2 rounded-xl bg-white p-2 shadow-sm ring-1 ring-black/[0.04]">
                    <span className="h-7 w-7 rounded-lg bg-emerald-100" />
                    <span className="flex-1 space-y-1">
                      <span className="block h-1.5 w-3/4 rounded bg-slate-200" />
                      <span className="block h-1.5 w-1/2 rounded bg-slate-100" />
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-auto flex items-center justify-around border-t border-slate-100 py-2.5">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={`h-5 w-5 rounded-lg ${i === 0 ? "bg-emerald-600" : "bg-slate-200"}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
