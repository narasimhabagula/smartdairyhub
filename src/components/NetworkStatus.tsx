import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

/**
 * Friendly, non-crashing offline notice for both web and the Android APK.
 * Recovers automatically as soon as the connection returns.
 */
export default function NetworkStatus() {
  const [offline, setOffline] = useState(() => typeof navigator !== "undefined" && !navigator.onLine);
  const [recovered, setRecovered] = useState(false);

  useEffect(() => {
    const down = () => {
      setOffline(true);
      setRecovered(false);
    };
    const up = () => {
      setOffline(false);
      setRecovered(true);
      window.setTimeout(() => setRecovered(false), 2500);
    };
    window.addEventListener("offline", down);
    window.addEventListener("online", up);
    return () => {
      window.removeEventListener("offline", down);
      window.removeEventListener("online", up);
    };
  }, []);

  if (!offline && !recovered) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-0 top-0 z-[95] flex justify-center px-3 pt-[max(0.5rem,env(safe-area-inset-top))]"
    >
      <div
        className={`flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-semibold shadow-lg ${
          offline ? "bg-slate-900 text-white" : "bg-emerald-600 text-white"
        }`}
      >
        <WifiOff className="h-4 w-4 shrink-0" aria-hidden />
        {offline
          ? "Internet connection is unavailable. Please check your connection and try again."
          : "Back online."}
      </div>
    </div>
  );
}
