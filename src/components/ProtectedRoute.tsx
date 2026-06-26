import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface Props {
  children: React.ReactNode;
  requiredRole?: AppRole;
}

export default function ProtectedRoute({ children, requiredRole }: Props) {
  const { user, loading, hasRole } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    // Preserve the destination so AuthContext can restore it after login.
    try {
      const dest = window.location.pathname + window.location.search;
      if (dest && dest !== "/login") sessionStorage.setItem("postLoginRedirect", dest);
    } catch {}
    return <Navigate to="/login" replace />;
  }
  if (requiredRole && !hasRole(requiredRole) && !hasRole("admin")) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
