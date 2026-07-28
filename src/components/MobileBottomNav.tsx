import { NavLink, useLocation } from "react-router-dom";
import { Home, Store, Stethoscope, User, Landmark } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/", label: "Home", icon: Home, match: (p: string) => p === "/" },
  { to: "/marketplace", label: "Market", icon: Store, match: (p: string) => p.startsWith("/marketplace") || p.startsWith("/cattle-market") },
  { to: "/vet-contacts", label: "Doctors", icon: Stethoscope, match: (p: string) => p.startsWith("/vet-contacts") },
  { to: "/schemes", label: "Subsidies", icon: Landmark, match: (p: string) => p.startsWith("/schemes") },
  { to: "/profile", label: "Profile", icon: User, match: (p: string) => p.startsWith("/profile") || p.startsWith("/settings") || p.startsWith("/dashboard") },
];


export default function MobileBottomNav() {
  const location = useLocation();

  return (
    <>
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.15)] backdrop-blur-xl md:hidden"
      >
        <ul className="mx-auto grid max-w-md grid-cols-5">
          {TABS.map((t) => {
            const active = t.match(location.pathname);
            const Icon = t.icon;
            return (
              <li key={t.to}>
                <NavLink
                  to={t.to}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                    active ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-9 w-12 items-center justify-center rounded-2xl transition-all",
                      active && "bg-primary/12"
                    )}
                  >
                    <Icon className={cn("h-[22px] w-[22px]", active && "scale-110")} strokeWidth={active ? 2.4 : 2} />
                  </span>
                  <span className="leading-none">{t.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
      {/* Spacer so page content isn't hidden behind fixed nav on mobile */}
      <div aria-hidden className="h-16" />
    </>
  );
}
