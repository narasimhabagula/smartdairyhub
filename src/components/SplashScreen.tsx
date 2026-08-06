import { useEffect, useState } from "react";

const SESSION_KEY = "sdh_splash_shown";
const DURATION = 2400;
const FADE = 500;

/**
 * Premium startup splash: soft green gradient, logo fade + zoom with tagline.
 * Shown once per browser session for every visitor (guest or signed in).
 * Purely presentational — never blocks routing or data fetching.
 */
export default function SplashScreen() {
  const [show, setShow] = useState(() => {
    try {
      return sessionStorage.getItem(SESSION_KEY) !== "1";
    } catch {
      return true;
    }
  });

  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!show) return;
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* ignore */
    }
    const fade = setTimeout(() => setLeaving(true), DURATION - FADE);
    const done = setTimeout(() => setShow(false), DURATION);
    return () => {
      clearTimeout(fade);
      clearTimeout(done);
    };
  }, [show]);

  if (!show) return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white transition-opacity duration-500 ${
        leaving ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_-10%,#F0F9FF_0%,#FFFFFF_50%,#F5FBF6_100%)]" />
      <div className="pointer-events-none absolute -left-32 top-1/4 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(22,163,74,0.14),transparent_65%)] blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-1/4 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.14),transparent_65%)] blur-3xl" />

      <div className="relative flex flex-col items-center px-6 text-center">
        <div className="relative">
          <span className="absolute inset-0 -z-10 animate-[pulse_2.4s_cubic-bezier(0.4,0,0.6,1)_infinite] rounded-full bg-emerald-500/12 blur-2xl" />
          <img
            src="/logo.png"
            alt=""
            width={176}
            height={176}
            fetchPriority="high"
            decoding="async"
            className="animate-scale-in will-change-transform"
            style={{ height: 176, width: 176, animationDuration: "900ms" }}
          />
        </div>
        <p
          data-no-translate
          className="animate-fade-in mt-7 max-w-xs text-[17px] font-extrabold leading-snug tracking-tight text-slate-900 sm:max-w-sm sm:text-xl"
          style={{ animationDelay: "220ms", animationFillMode: "both" }}
        >
          Smart Dairy Hub
        </p>
        <p
          data-no-translate
          className="animate-fade-in mt-1.5 max-w-xs text-[13px] font-medium text-slate-500"
          style={{ animationDelay: "380ms", animationFillMode: "both" }}
        >
          Empowering Farmers with AI
        </p>
        <div className="mt-9 h-1 w-32 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full w-1/3 animate-[slide-in-right_1.1s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400" />
        </div>
      </div>
    </div>
  );
}

