import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AuthModal from "./AuthModal";
import { useAuth } from "@/contexts/AuthContext";

interface AuthModalCtx {
  openAuth: (redirectTo?: string) => void;
  closeAuth: () => void;
  isAuthOpen: boolean;
}

const Ctx = createContext<AuthModalCtx>({ openAuth: () => {}, closeAuth: () => {}, isAuthOpen: false });

export const useAuthModal = () => useContext(Ctx);

const GATE_KEY = "sdh_auth_gate_seen";
const SPLASH_MS = 2000; // hands off right as the startup splash fades

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [redirectTo, setRedirectTo] = useState<string | undefined>();
  const isGate = useRef(false);

  const openAuth = useCallback((dest?: string) => {
    isGate.current = false;
    setRedirectTo(dest);
    setOpen(true);
  }, []);
  const closeAuth = useCallback(() => setOpen(false), []);

  // Onboarding gate: splash → language selection → login.
  // Only fires once the visitor has picked a language.
  useEffect(() => {
    if (loading || user) return;
    if (location.pathname.startsWith("/welcome/language")) return;
    let seen = true;
    let langPicked = false;
    try {
      seen = sessionStorage.getItem(GATE_KEY) === "1";
      langPicked = localStorage.getItem("sdh_language_picked") === "1";
    } catch {}
    if (seen || !langPicked) return;
    const t = setTimeout(() => {
      isGate.current = true;
      setRedirectTo("/");
      setOpen(true);
    }, SPLASH_MS);
    return () => clearTimeout(t);
  }, [loading, user, location.pathname]);

  const handleOpenChange = useCallback(
    (v: boolean) => {
      setOpen(v);
      if (!v) {
        try {
          sessionStorage.setItem(GATE_KEY, "1");
        } catch {}
        if (isGate.current) {
          isGate.current = false;
          if (location.pathname !== "/") navigate("/", { replace: true });
        }
      }
    },
    [location.pathname, navigate]
  );

  // Close automatically once the session is established
  useEffect(() => {
    if (user) {
      setOpen(false);
      try {
        sessionStorage.setItem(GATE_KEY, "1");
      } catch {}
    }
  }, [user]);

  return (
    <Ctx.Provider value={{ openAuth, closeAuth, isAuthOpen: open }}>
      {children}
      <AuthModal open={open} onOpenChange={handleOpenChange} redirectTo={redirectTo} />
    </Ctx.Provider>
  );
}
