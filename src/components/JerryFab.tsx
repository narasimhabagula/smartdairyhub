import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, ScanLine, Mic, HelpCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

const MENU = [
  { to: "/ai-chat", label: "Chat with Jerry", icon: MessageCircle, tint: "from-emerald-500 to-emerald-700" },
  { to: "/disease-detection", label: "AI Disease Scan", icon: ScanLine, tint: "from-teal-500 to-emerald-600" },
  { to: "/ai-chat?mode=voice", label: "Voice Assistant", icon: Mic, tint: "from-amber-500 to-orange-600" },
  { to: "/help", label: "Help Center", icon: HelpCircle, tint: "from-sky-500 to-blue-600" },
];

export default function JerryFab() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="fixed bottom-20 right-4 z-40 flex flex-col items-end gap-3">
      {/* Backdrop */}
      <div
        className={cn(
          "pointer-events-none fixed inset-0 -z-10 bg-black/20 backdrop-blur-[2px] transition-opacity duration-200",
          open ? "opacity-100" : "opacity-0"
        )}
      />

      {/* Menu */}
      <div
        className={cn(
          "flex flex-col items-end gap-2 transition-all duration-200 ease-out",
          open ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
        )}
      >
        {MENU.map((m, i) => {
          const Icon = m.icon;
          return (
            <Link
              key={m.label}
              to={m.to}
              onClick={() => setOpen(false)}
              style={{ transitionDelay: open ? `${i * 35}ms` : "0ms" }}
              className={cn(
                "group flex items-center gap-3 rounded-full border border-white/40 bg-white/80 py-2 pl-2 pr-4 shadow-lg shadow-black/10 backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.97] dark:border-white/10 dark:bg-card/80",
                open ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"
              )}
            >
              <span className={cn("flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br text-white shadow-md", m.tint)}>
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <span className="text-[13px] font-semibold text-foreground">{m.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Main FAB */}
      <button
        type="button"
        aria-label={open ? "Close Jerry menu" : "Open Jerry assistant"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-[0_10px_30px_-6px_rgba(16,185,129,0.55)] ring-4 ring-white/70 transition-all duration-200 ease-out active:scale-95 dark:ring-white/10",
          open && "rotate-90"
        )}
      >
        {open ? (
          <X className="h-6 w-6" />
        ) : (
          <img src="/logo.png" alt="" className="h-9 w-9 rounded-full object-contain" />
        )}
        {!open && (
          <span className="absolute -top-1 -right-1 rounded-full bg-amber-400 px-1.5 py-0.5 text-[9px] font-bold text-emerald-900 shadow">
            AI
          </span>
        )}
      </button>
    </div>
  );
}
