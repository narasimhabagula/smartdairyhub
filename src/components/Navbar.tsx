import { Link, useLocation, useNavigate } from "react-router-dom";
import { ShoppingCart, Stethoscope, Landmark, LayoutDashboard, LogIn, Menu, X, Store, LogOut, Shield, User, Package, Languages, Check, TrendingUp, Factory, Handshake } from "lucide-react";
import NotificationBell from "@/components/NotificationBell";


import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { useTranslation } from "react-i18next";
import { LANGUAGES, type LanguageCode } from "@/locales";
import { supabase } from "@/integrations/supabase/client";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { user, profile, signOut, hasRole } = useAuth();
  const { count } = useCart();
  const { t, i18n } = useTranslation();

  const navItems = [
    { label: t("nav.dashboard"), to: "/dashboard", icon: LayoutDashboard, auth: true },
    { label: "Milk Rates", to: "/milk-rates", icon: TrendingUp, auth: false },
    { label: t("nav.marketplace"), to: "/marketplace", icon: Store, auth: false },
    { label: t("nav.cattle"), to: "/cattle-market", icon: ShoppingCart, auth: false },
    { label: t("nav.vet"), to: "/vet-contacts", icon: Stethoscope, auth: false },
    { label: t("nav.schemes"), to: "/schemes", icon: Landmark, auth: false },
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

  return (
    <nav className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold text-primary sm:text-xl">
          <img src="/logo.png" alt="Smart Dairy Hub logo" className="h-9 w-9 rounded-md object-contain" />
          <span className="hidden sm:inline">{t("brand")}</span>
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-1 lg:flex">
          {visibleItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                location.pathname === item.to
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground/70 hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}

          <Link to="/cart" className="relative ml-1 flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-foreground/70 hover:bg-muted hover:text-foreground">
            <ShoppingCart className="h-4 w-4" />
            {count > 0 && (
              <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">{count}</Badge>
            )}
          </Link>

          {user && <NotificationBell />}


          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="ml-1 gap-1.5" aria-label={t("nav.language")}>
                <Languages className="h-4 w-4" />
                <span className="text-xs font-semibold">{currentLangNative}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-80 overflow-y-auto">
              <DropdownMenuLabel className="text-xs">{t("nav.language")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {LANGUAGES.map((lng) => (
                <DropdownMenuItem key={lng.code} onClick={() => switchLang(lng.code)} className="flex items-center justify-between gap-3">
                  <span>
                    <span className="font-medium">{lng.native}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{lng.label}</span>
                  </span>
                  {currentLang === lng.code && <Check className="h-4 w-4 text-primary" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="ml-2 gap-1.5">
                  <User className="h-4 w-4" />
                  {profile?.full_name || "Account"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                  <LayoutDashboard className="mr-2 h-4 w-4" /> {t("nav.dashboard")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/orders")}>
                  <Package className="mr-2 h-4 w-4" /> {t("nav.orders")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/add-product")}>
                  <Store className="mr-2 h-4 w-4" /> {t("nav.sell")}
                </DropdownMenuItem>
                {(hasRole("mediator") || hasRole("admin")) && (
                  <DropdownMenuItem onClick={() => navigate("/mediator")}>
                    <Handshake className="mr-2 h-4 w-4" /> Mediator panel
                  </DropdownMenuItem>
                )}
                {(hasRole("industry") || hasRole("admin")) && (
                  <DropdownMenuItem onClick={() => navigate("/industry")}>
                    <Factory className="mr-2 h-4 w-4" /> Industry panel
                  </DropdownMenuItem>
                )}

                {hasRole("admin") && (
                  <DropdownMenuItem onClick={() => navigate("/admin")}>
                    <Shield className="mr-2 h-4 w-4" /> {t("nav.admin")}
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" /> {t("nav.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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

        {/* Mobile toggle */}
        <button onClick={() => setOpen(!open)} className="lg:hidden text-foreground" aria-label="Toggle menu">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
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
