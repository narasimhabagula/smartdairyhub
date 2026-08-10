import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * Native Android behaviour for the packaged APK:
 *  - hardware back button walks the in-app history and only exits at the root
 *  - status bar / splash handled by Capacitor plugins when running natively
 *  - offline + back-online toasts are handled by NetworkStatus
 *
 * Everything is loaded dynamically and guarded, so the web build is untouched
 * when Capacitor is not present.
 */
export default function NativeShell() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (!Capacitor?.isNativePlatform?.()) return;

        const { App } = await import("@capacitor/app");
        const handle = await App.addListener("backButton", ({ canGoBack }) => {
          const atRoot =
            window.location.pathname === "/" || window.location.pathname === "/login";
          if (atRoot || !canGoBack) {
            App.exitApp();
          } else {
            window.history.back();
          }
        });
        if (cancelled) {
          handle.remove();
          return;
        }
        cleanup = () => handle.remove();

        try {
          const { SplashScreen } = await import("@capacitor/splash-screen");
          await SplashScreen.hide();
        } catch {
          /* plugin unavailable */
        }
        try {
          const { StatusBar, Style } = await import("@capacitor/status-bar");
          await StatusBar.setStyle({ style: Style.Light });
        } catch {
          /* plugin unavailable */
        }
      } catch {
        /* not a native build — nothing to do */
      }
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [navigate, location.pathname]);

  return null;
}
