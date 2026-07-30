import { useEffect, useState } from "react";

const SESSION_KEY = "sdh_splash_shown";
const DURATION = 1900;

/**
 * Premium startup splash: shown once per browser session, then fades out.
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
    const fade = setTimeout(() => setLeaving(true), DURATION - 450);
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
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background transition-opacity duration-500 ${
        leaving ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,hsl(var(--primary)/0.16),transparent_65%)]" />
      <div className="relative flex flex-col items-center">
        <img
          src="/logo.png"
          alt=""
          width={168}
          height={168}
          fetchPriority="high"
          decoding="async"
          className="animate-scale-in"
          style={{ height: 168, width: 168 }}
        />
        <div className="mt-8 h-1 w-32 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-1/3 animate-[slide-in-right_1.2s_ease-in-out_infinite] rounded-full bg-primary" />
        </div>
      </div>

    </div>
  );
}
