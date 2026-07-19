import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Home, ScanLine, Store, Menu, Stethoscope, Wheat, Landmark, Settings as SettingsIcon, Languages, HelpCircle, X, Bot } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/", label: "Home", icon: Home, match: (p: string) => p === "/" },
  { to: "/disease-detection", label: "AI Scan", icon: ScanLine, match: (p: string) => p.startsWith("/disease-detection") },
  { to: "/cattle-market", label: "Market", icon: Store, match: (p: string) => p.startsWith("/cattle-market") || p.startsWith("/marketplace") },
];

const MORE_ITEMS = [
  { to: "/vet-contacts", label: "Veterinary", icon: Stethoscope },
  { to: "/marketplace?category=feed", label: "Feed Store", icon: Wheat },
  { to: "/schemes", label: "Government Schemes", icon: Landmark },
  { to: "/ai-chat", label: "Ask Jerry AI", icon: Bot },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
  { to: "/welcome/language", label: "Language", icon: Languages },
  { to: "/support", label: "Help & Support", icon: HelpCircle },
];

export default function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = ["/vet-contacts", "/schemes", "/settings", "/support", "/ai-chat"].some((p) => location.pathname.startsWith(p));

  return (
    <>
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.15)] backdrop-blur-xl md:hidden"
      >
        <ul className="mx-auto grid max-w-md grid-cols-4">
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
          <li>
            <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
              <SheetTrigger asChild>
                <button
                  className={cn(
                    "flex w-full flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                    moreActive ? "text-primary" : "text-muted-foreground"
                  )}
                  aria-label="More"
                >
                  <span className={cn("flex h-9 w-12 items-center justify-center rounded-2xl", moreActive && "bg-primary/12")}>
                    <Menu className="h-[22px] w-[22px]" />
                  </span>
                  <span className="leading-none">More</span>
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-3xl border-t-0 p-0">
                <SheetHeader className="px-5 pt-5 pb-2 text-left">
                  <SheetTitle className="font-display text-xl">More</SheetTitle>
                </SheetHeader>
                <div className="grid grid-cols-3 gap-3 px-5 pb-8 pt-3">
                  {MORE_ITEMS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.to}
                        onClick={() => {
                          setMoreOpen(false);
                          navigate(item.to);
                        }}
                        className="group flex flex-col items-center gap-2 rounded-2xl border border-border/60 bg-card p-4 text-center text-xs font-semibold text-foreground shadow-soft transition-all active:scale-95"
                      >
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          <Icon className="h-5 w-5" />
                        </span>
                        <span className="leading-tight">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </SheetContent>
            </Sheet>
          </li>
        </ul>
      </nav>
      {/* Spacer so page content isn't hidden behind fixed nav on mobile */}
      <div aria-hidden className="h-16 md:hidden" />
    </>
  );
}
