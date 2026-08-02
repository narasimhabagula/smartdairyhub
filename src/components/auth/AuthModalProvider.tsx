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

  // No forced login gate: guests land on the animated landing page after the
  // language step and sign in only when they choose Login / Get Started.


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
