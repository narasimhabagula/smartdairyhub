import { Link, NavLink, useNavigate } from "react-router-dom";
import { Bell, ChevronDown, Globe, LogOut, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import SmartHeroSearch from "@/components/SmartHeroSearch";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthModal } from "@/components/auth/AuthModalProvider";
import { LANGUAGES, type LanguageCode } from "@/locales";
import { DESKTOP_NAV } from "@/components/home/homeData";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/** Full-width header for tablet, laptop and desktop. Hidden on mobile. */
export default function DesktopHeader() {
  const { user, profile, signOut } = useAuth() as any;
  const { openAuth } = useAuthModal();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const currentLang = (i18n.language?.slice(0, 2) || "en") as LanguageCode;

  const switchLang = async (lng: LanguageCode) => {
    await i18n.changeLanguage(lng);
    localStorage.setItem("sdh_language_picked", "1");
    localStorage.setItem("i18nextLng", lng);
    if (user) await supabase.from("profiles").update({ language: lng } as any).eq("user_id", user.id);
  };

  const firstName = (profile?.full_name || user?.email || "Farmer").split(/[\s@]/)[0];

  return (
    <header className="sticky top-0 z-40 hidden w-full border-b border-border/60 bg-background/85 backdrop-blur-xl md:block">
      <div className="mx-auto flex w-full max-w-[1600px] items-center gap-4 px-6 py-3 lg:gap-8 lg:px-10 lg:py-4">
        <Link to="/" className="flex shrink-0 items-center gap-2.5">
          <img src="/logo.png" alt="Smart Dairy Hub" className="h-10 w-10 rounded-full object-contain" />
          <span className="font-display text-lg font-bold text-primary lg:text-xl">Smart Dairy Hub</span>
        </Link>

        <nav aria-label="Primary" className="hidden shrink-0 items-center gap-1 xl:flex">
          {DESKTOP_NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                cn(
                  "rounded-full px-3 py-2 text-sm font-medium transition-colors",
                  isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="min-w-[220px] flex-1 lg:max-w-2xl">
          <SmartHeroSearch />
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <LanguageSelector />


          <button
            onClick={() => (user ? navigate("/notifications") : openAuth("/notifications"))}
            aria-label="Notifications"
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-muted text-foreground transition-colors hover:bg-muted/70"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive ring-2 ring-background" />
          </button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex h-10 items-center gap-2 rounded-full bg-primary px-3 text-sm font-semibold text-primary-foreground">
                <User className="h-4 w-4" />
                <span className="hidden max-w-[120px] truncate lg:inline">{firstName}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate("/profile")}>My Profile</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/dashboard")}>Dashboard</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/orders")}>My Orders</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/settings")}>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => {
                    await signOut?.();
                    navigate("/", { replace: true });
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={() => openAuth("/")} className="h-10 rounded-full px-5">
              Sign in
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
