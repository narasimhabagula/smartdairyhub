import { Link, useLocation, useNavigate } from "react-router-dom";
import { ShoppingCart, Stethoscope, Landmark, LayoutDashboard, LogIn, Menu, X, Store, LogOut, Shield, User, Package, Languages } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useTranslation } from "react-i18next";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { user, profile, signOut, hasRole } = useAuth();
  const { count } = useCart();
  const { t, i18n } = useTranslation();

  const navItems = [
    { label: t("nav.dashboard"), to: "/dashboard", icon: LayoutDashboard, auth: true },
    { label: t("nav.marketplace"), to: "/marketplace", icon: Store, auth: false },
    { label: t("nav.cattle"), to: "/cattle-market", icon: ShoppingCart, auth: false },
    { label: t("nav.vet"), to: "/vet-contacts", icon: Stethoscope, auth: false },
    { label: t("nav.schemes"), to: "/schemes", icon: Landmark, auth: false },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const switchLang = (lng: "en" | "te") => i18n.changeLanguage(lng);
  const visibleItems = navItems.filter((i) => !i.auth || user);

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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="ml-1 gap-1.5" aria-label={t("nav.language")}>
                <Languages className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase">{i18n.language?.slice(0, 2) || "en"}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => switchLang("en")}>English</DropdownMenuItem>
              <DropdownMenuItem onClick={() => switchLang("te")}>తెలుగు</DropdownMenuItem>
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
              to="/login"
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
            <div className="flex gap-2 px-3 py-2">
              <Button size="sm" variant={i18n.language === "en" ? "default" : "outline"} onClick={() => switchLang("en")} className="flex-1">English</Button>
              <Button size="sm" variant={i18n.language === "te" ? "default" : "outline"} onClick={() => switchLang("te")} className="flex-1">తెలుగు</Button>
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
              <Link to="/login" onClick={() => setOpen(false)} className="mt-1 flex items-center gap-2 rounded-md bg-accent px-3 py-3 text-base font-semibold text-accent-foreground">
                <LogIn className="h-5 w-5" /> {t("nav.login")}
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
