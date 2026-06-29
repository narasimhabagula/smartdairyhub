import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ShoppingCart, Stethoscope, Landmark, LayoutDashboard, LogIn, Menu, X, Store, LogOut,
  Shield, User, Package, Languages, Check, TrendingUp, Factory, Handshake, Headset,
  MoreVertical, Settings, HelpCircle, Wheat,
} from "lucide-react";
import NotificationBell from "@/components/NotificationBell";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
  DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSub, DropdownMenuSubTrigger,
  DropdownMenuSubContent, DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from "react-i18next";
import { LANGUAGES, type LanguageCode } from "@/locales";
import { supabase } from "@/integrations/supabase/client";

const SUPPORT_PATH = "/support";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { user, profile, signOut, hasRole } = useAuth();
  const { count } = useCart();
  const { t, i18n } = useTranslation();

  // Desktop nav items. `iconOnly` hides the text label on desktop while keeping the icon clickable.
  const navItems = [
    { label: t("nav.dashboard"), to: "/dashboard", icon: LayoutDashboard, auth: true, iconOnly: false },
    { label: t("nav.milkRates", { defaultValue: "Milk Rates" }), to: "/milk-rates", icon: TrendingUp, auth: false, iconOnly: false },
    { label: t("nav.marketplace"), to: "/marketplace", icon: Store, auth: false, iconOnly: true },
    { label: t("nav.cattle"), to: "/cattle-market", icon: ShoppingCart, auth: false, iconOnly: false },
    { label: t("nav.vet"), to: "/vet-contacts", icon: Stethoscope, auth: false, iconOnly: false },
    { label: t("nav.schemes"), to: "/schemes", icon: Landmark, auth: false, iconOnly: true },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const switchLang = async (lng: LanguageCode) => {
    await i18n.changeLanguage(lng);
    localStorage.setItem("sdh_language_picked", "1");
    if (user) {
      await supabase.from("profiles").update({ language: lng } as any).eq("user_id", user.id);
    }
  };

  const visibleItems = navItems.filter((i) => !i.auth || user);
  const currentLang = (i18n.language?.slice(0, 2) || "en") as LanguageCode;
  const currentLangNative = LANGUAGES.find((l) => l.code === currentLang)?.native ?? "English";

  // Languages exposed inside the three-dot menu (English / Telugu / Hindi as requested).
  const QUICK_LANGS: LanguageCode[] = ["en", "te", "hi"];

  return (
    <nav className="sticky top-0 z-50 border-b bg-white/95 shadow-sm backdrop-blur-md dark:bg-card/80">
      <div className="container flex h-16 items-center gap-3 lg:gap-5">
        {/* Brand — wider on desktop so the full name never truncates */}
        <Link
          to="/"
          className="flex shrink-0 items-center gap-2.5 font-display text-[15px] font-bold leading-none text-primary sm:text-lg lg:min-w-[260px] lg:text-xl xl:min-w-[280px]"
        >
          <img
            src="/logo.png"
            alt="Smart Dairy Hub logo"
            width={48}
            height={48}
            decoding="async"
            loading="eager"
            className="h-10 w-10 shrink-0 object-contain sm:h-9 sm:w-9 md:h-11 md:w-11"
          />
          <span className="truncate tracking-tight lg:whitespace-nowrap lg:overflow-visible">
            {t("brand")}
          </span>
        </Link>

        {/* Desktop nav — fills remaining space, equal spacing */}
        <TooltipProvider delayDuration={150}>
          <div className="hidden flex-1 items-center justify-center gap-1 lg:flex">
            {visibleItems.map((item) => {
              const active = location.pathname === item.to;
              const base = `flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 ${
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-foreground/70 hover:bg-muted hover:text-foreground hover:-translate-y-0.5"
              }`;
              if (item.iconOnly) {
                return (
                  <Tooltip key={item.to}>
                    <TooltipTrigger asChild>
                      <Link to={item.to} aria-label={item.label} className={base}>
                        <item.icon className="h-[18px] w-[18px]" />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent>{item.label}</TooltipContent>
                  </Tooltip>
                );
              }
              return (
                <Link key={item.to} to={item.to} className={base}>
                  <item.icon className="h-4 w-4" />
                  <span className="whitespace-nowrap">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </TooltipProvider>

        {/* Right cluster (desktop) */}
        <div className="hidden shrink-0 items-center gap-1 lg:flex">
          <Link
            to="/cart"
            className="relative flex items-center rounded-md p-2 text-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
            aria-label={t("nav.cart")}
          >
            <ShoppingCart className="h-[18px] w-[18px]" />
            {count > 0 && (
              <Badge className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs">
                {count}
              </Badge>
            )}
          </Link>

          {user && <NotificationBell />}

          <Link
            to={SUPPORT_PATH}
            aria-label="Customer Support"
            className="flex items-center justify-center rounded-md p-2 text-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
          >
            <Headset className="h-[18px] w-[18px]" />
          </Link>

          {user ? (
            <div className="ml-2 flex items-center gap-1 rounded-full border bg-card/60 pl-3 pr-1 py-1 shadow-sm">
              <User className="h-4 w-4 text-primary" />
              <span className="max-w-[140px] truncate text-sm font-semibold text-foreground">
                {profile?.full_name || "Account"}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full hover:bg-muted"
                    aria-label="Open user menu"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  sideOffset={10}
                  className="w-64 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200"
                >
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    {profile?.full_name || "Account"}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                    <LayoutDashboard className="mr-2 h-4 w-4" /> {t("nav.dashboard")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/milk-rates")}>
                    <TrendingUp className="mr-2 h-4 w-4" /> {t("nav.milkRates", { defaultValue: "Milk Rates" })}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/marketplace")}>
                    <Store className="mr-2 h-4 w-4" /> {t("nav.marketplace")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/cattle-market")}>
                    <ShoppingCart className="mr-2 h-4 w-4" /> {t("nav.cattle")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/vet-contacts")}>
                    <Stethoscope className="mr-2 h-4 w-4" /> {t("nav.vet")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/schemes")}>
                    <Landmark className="mr-2 h-4 w-4" /> {t("nav.schemes")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/marketplace?category=feed")}>
                    <Wheat className="mr-2 h-4 w-4" /> Feed Prices
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                    <User className="mr-2 h-4 w-4" /> My Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/orders")}>
                    <Package className="mr-2 h-4 w-4" /> {t("nav.orders")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/seller")}>
                    <Store className="mr-2 h-4 w-4" /> {t("nav.sell")}
                  </DropdownMenuItem>

                  {(hasRole("mediator") || hasRole("admin")) && (
                    <DropdownMenuItem onClick={() => navigate("/mediator")}>
                      <Handshake className="mr-2 h-4 w-4" /> Mediator panel
                    </DropdownMenuItem>
                  )}
                  {(hasRole("industry") || hasRole("admin")) && (
                    <>
                      <DropdownMenuItem onClick={() => navigate("/industry")}>
                        <Factory className="mr-2 h-4 w-4" /> Industry panel
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate("/milk-rate-management")}>
                        <TrendingUp className="mr-2 h-4 w-4" /> Milk Rate Management
                      </DropdownMenuItem>
                    </>
                  )}
                  {(hasRole("vet") || hasRole("admin")) && (
                    <DropdownMenuItem onClick={() => navigate("/vet-dashboard")}>
                      <Stethoscope className="mr-2 h-4 w-4" /> Vet dashboard
                    </DropdownMenuItem>
                  )}
                  {hasRole("admin") && (
                    <DropdownMenuItem onClick={() => navigate("/admin")}>
                      <Shield className="mr-2 h-4 w-4" /> {t("nav.admin")}
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                    <Settings className="mr-2 h-4 w-4" /> Settings
                  </DropdownMenuItem>

                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <Languages className="mr-2 h-4 w-4" />
                      <span>Language</span>
                      <span className="ml-auto text-xs text-muted-foreground">{currentLangNative}</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent className="animate-in fade-in-0 zoom-in-95 duration-150">
                        {QUICK_LANGS.map((code) => {
                          const lng = LANGUAGES.find((l) => l.code === code)!;
                          return (
                            <DropdownMenuItem
                              key={code}
                              onClick={() => switchLang(code)}
                              className="flex items-center justify-between gap-3"
                            >
                              <span>
                                <span className="font-medium">{lng.native}</span>
                                <span className="ml-2 text-xs text-muted-foreground">{lng.label}</span>
                              </span>
                              {currentLang === code && <Check className="h-4 w-4 text-primary" />}
                            </DropdownMenuItem>
                          );
                        })}
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="text-xs text-muted-foreground">More languages</DropdownMenuLabel>
                        {LANGUAGES.filter((l) => !QUICK_LANGS.includes(l.code)).map((lng) => (
                          <DropdownMenuItem
                            key={lng.code}
                            onClick={() => switchLang(lng.code)}
                            className="flex items-center justify-between gap-3"
                          >
                            <span>
                              <span className="font-medium">{lng.native}</span>
                              <span className="ml-2 text-xs text-muted-foreground">{lng.label}</span>
                            </span>
                            {currentLang === lng.code && <Check className="h-4 w-4 text-primary" />}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>

                  <DropdownMenuItem onClick={() => navigate(SUPPORT_PATH)}>
                    <HelpCircle className="mr-2 h-4 w-4" /> Help & Support
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" /> {t("nav.logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <Link
              to="/select-role"
              className="ml-2 flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-colors hover:opacity-90"
            >
              <LogIn className="h-4 w-4" />
              {t("nav.login")}
            </Link>
          )}
        </div>

        {/* Mobile toggle — unchanged */}
        <div className="ml-auto flex items-center gap-1 lg:hidden">
          <Link
            to={SUPPORT_PATH}
            aria-label="Customer Support"
            className="flex items-center justify-center rounded-md p-2 text-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
          >
            <Headset className="h-5 w-5" />
          </Link>
          <button onClick={() => setOpen(!open)} className="text-foreground" aria-label="Toggle menu">
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu — unchanged */}
      {open && (
        <div className="border-t bg-card lg:hidden">
          <div className="container flex flex-col gap-1 py-3">
            {visibleItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2 rounded-md px-3 py-3 text-base font-medium ${
                  location.pathname === item.to
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground/70 hover:bg-muted"
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
            <Link to="/cart" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-md px-3 py-3 text-base font-medium text-foreground/70 hover:bg-muted">
              <ShoppingCart className="h-5 w-5" /> {t("nav.cart")} {count > 0 && `(${count})`}
            </Link>
            <div className="flex flex-wrap gap-2 px-3 py-2">
              {LANGUAGES.map((lng) => (
                <Button
                  key={lng.code}
                  size="sm"
                  variant={currentLang === lng.code ? "default" : "outline"}
                  onClick={() => switchLang(lng.code)}
                  className="flex-1 min-w-[44%]"
                >
                  {lng.native}
                </Button>
              ))}
            </div>
            {user ? (
              <>
                <Link to="/orders" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-md px-3 py-3 text-base font-medium text-foreground/70 hover:bg-muted">
                  <Package className="h-5 w-5" /> {t("nav.orders")}
                </Link>
                {hasRole("admin") && (
                  <Link to="/admin" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-md px-3 py-3 text-base font-medium text-foreground/70 hover:bg-muted">
                    <Shield className="h-5 w-5" /> {t("nav.admin")}
                  </Link>
                )}
                <button onClick={() => { handleSignOut(); setOpen(false); }} className="mt-1 flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-3 text-base font-semibold text-destructive">
                  <LogOut className="h-5 w-5" /> {t("nav.logout")}
                </button>
              </>
            ) : (
              <Link to="/select-role" onClick={() => setOpen(false)} className="mt-1 flex items-center gap-2 rounded-md bg-accent px-3 py-3 text-base font-semibold text-accent-foreground">
                <LogIn className="h-5 w-5" /> {t("nav.login")}
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
