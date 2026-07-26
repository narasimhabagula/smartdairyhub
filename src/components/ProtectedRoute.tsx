import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthModal } from "@/components/auth/AuthModalProvider";
import { Button } from "@/components/ui/button";
import { Navigate } from "react-router-dom";
import { Lock } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface Props {
  children: React.ReactNode;
  requiredRole?: AppRole;
}

export default function ProtectedRoute({ children, requiredRole }: Props) {
  const { user, loading, hasRole } = useAuth();
  const { openAuth } = useAuthModal();

  useEffect(() => {
    if (!loading && !user) {
      openAuth(window.location.pathname + window.location.search);
    }
  }, [loading, user, openAuth]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[60svh] flex-col items-center justify-center px-6 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Lock className="h-6 w-6" />
        </div>
        <h1 className="font-display text-xl font-bold">Sign in to continue</h1>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          This part of Smart Dairy Hub is protected. Sign in securely to access it.
        </p>
        <Button
          className="mt-5 h-11 rounded-2xl px-6"
          onClick={() => openAuth(window.location.pathname + window.location.search)}
        >
          Sign In
        </Button>
      </div>
    );
  }

  if (requiredRole && !hasRole(requiredRole) && !hasRole("admin")) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
