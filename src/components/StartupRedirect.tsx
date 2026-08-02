import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const KEY = "sdh_home_routed";

/**
 * Returning signed-in visitors open straight into the Home Dashboard —
 * no splash, no language step. Runs once per browser session.
 */
export default function StartupRedirect() {
  const { user, loading } = useAuth();
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const done = useRef(false);

  useEffect(() => {
    if (done.current || loading || !user) return;
    if (pathname !== "/" || search) return;
    try {
      if (sessionStorage.getItem(KEY) === "1") return;
      sessionStorage.setItem(KEY, "1");
    } catch {}
    done.current = true;
    navigate("/dashboard", { replace: true });
  }, [user, loading, pathname, search, navigate]);

  return null;
}
