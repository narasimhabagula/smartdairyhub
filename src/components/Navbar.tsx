import { Link, useLocation, useNavigate } from "react-router-dom";
import { Milk, ShoppingCart, Stethoscope, Landmark, LayoutDashboard, LogIn, Menu, X, Store, LogOut, Shield, User, Package } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const navItems = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard, auth: true },
  { label: "Marketplace", to: "/marketplace", icon: Store, auth: false },
  { label: "Cattle Market", to: "/cattle-market", icon: ShoppingCart, auth: false },
  { label: "Vet Contacts", to: "/vet-contacts", icon: Stethoscope, auth: false },
  { label: "Schemes", to: "/schemes", icon: Landmark, auth: false },
];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { user, profile, signOut, hasRole } = useAuth();
  const { count } = useCart();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const visibleItems = navItems.filter(i => !i.auth || user);

  return (
    <nav className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold text-primary">
          <Milk className="h-6 w-6" />
          DairyPro
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-1 md:flex">
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

          {/* Cart */}
          <Link to="/cart" className="relative ml-1 flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-foreground/70 hover:bg-muted hover:text-foreground">
            <ShoppingCart className="h-4 w-4" />
            {count > 0 && (
              <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">{count}</Badge>
            )}
          </Link>

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
                  <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/orders")}>
                  <Package className="mr-2 h-4 w-4" /> My Orders
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/add-product")}>
                  <Store className="mr-2 h-4 w-4" /> Sell Product
                </DropdownMenuItem>
                {hasRole("admin") && (
                  <DropdownMenuItem onClick={() => navigate("/admin")}>
                    <Shield className="mr-2 h-4 w-4" /> Admin Panel
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              to="/login"
              className="ml-2 flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-colors hover:opacity-90"
            >
              <LogIn className="h-4 w-4" />
              Login
            </Link>
          )}
        </div>

        {/* Mobile toggle */}
        <button onClick={() => setOpen(!open)} className="md:hidden text-foreground">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t bg-card md:hidden">
          <div className="container flex flex-col gap-1 py-3">
            {visibleItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium ${
                  location.pathname === item.to
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground/70 hover:bg-muted"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
            <Link to="/cart" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-foreground/70 hover:bg-muted">
              <ShoppingCart className="h-4 w-4" /> Cart {count > 0 && `(${count})`}
            </Link>
            {user ? (
              <>
                <Link to="/orders" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-foreground/70 hover:bg-muted">
                  <Package className="h-4 w-4" /> My Orders
                </Link>
                {hasRole("admin") && (
                  <Link to="/admin" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-foreground/70 hover:bg-muted">
                    <Shield className="h-4 w-4" /> Admin
                  </Link>
                )}
                <button onClick={() => { handleSignOut(); setOpen(false); }} className="mt-1 flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2.5 text-sm font-semibold text-destructive">
                  <LogOut className="h-4 w-4" /> Logout
                </button>
              </>
            ) : (
              <Link to="/login" onClick={() => setOpen(false)} className="mt-1 flex items-center gap-2 rounded-md bg-accent px-3 py-2.5 text-sm font-semibold text-accent-foreground">
                <LogIn className="h-4 w-4" /> Login
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
