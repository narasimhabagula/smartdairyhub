import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import AuthModal from "./AuthModal";
import { useAuth } from "@/contexts/AuthContext";

interface AuthModalCtx {
  openAuth: (redirectTo?: string) => void;
  closeAuth: () => void;
}

const Ctx = createContext<AuthModalCtx>({ openAuth: () => {}, closeAuth: () => {} });

export const useAuthModal = () => useContext(Ctx);

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [redirectTo, setRedirectTo] = useState<string | undefined>();

  const openAuth = useCallback((dest?: string) => {
    setRedirectTo(dest);
    setOpen(true);
  }, []);
  const closeAuth = useCallback(() => setOpen(false), []);

  // Close automatically once the session is established
  useEffect(() => {
    if (user) setOpen(false);
  }, [user]);

  return (
    <Ctx.Provider value={{ openAuth, closeAuth }}>
      {children}
      <AuthModal open={open} onOpenChange={setOpen} redirectTo={redirectTo} />
    </Ctx.Provider>
  );
}
