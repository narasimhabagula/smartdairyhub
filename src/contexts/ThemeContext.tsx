import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";

export type ThemeMode = "light" | "dark" | "system";
const STORAGE_KEY = "sdh_theme";

type Ctx = { theme: ThemeMode; resolved: "light" | "dark"; setTheme: (t: ThemeMode) => void };
const ThemeContext = createContext<Ctx>({ theme: "light", resolved: "light", setTheme: () => {} });
export const useTheme = () => useContext(ThemeContext);

function readStored(): ThemeMode {
  try {
    const v = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {}
  // New users default to Light Mode (not system) per product policy.
  return "light";
}

function systemPref(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function apply(mode: "light" | "dark") {
  const root = document.documentElement;
  if (mode === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
  root.style.colorScheme = mode;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => readStored());
  const [resolved, setResolved] = useState<"light" | "dark">(() =>
    readStored() === "system" ? systemPref() : (readStored() as "light" | "dark")
  );

  useEffect(() => {
    const r: "light" | "dark" = theme === "system" ? systemPref() : theme;
    setResolved(r);
    apply(r);
  }, [theme]);

  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const cb = () => { const r = systemPref(); setResolved(r); apply(r); };
    mq.addEventListener?.("change", cb);
    return () => mq.removeEventListener?.("change", cb);
  }, [theme]);

  const setTheme = useCallback((t: ThemeMode) => {
    try { localStorage.setItem(STORAGE_KEY, t); } catch {}
    setThemeState(t);
  }, []);

  return <ThemeContext.Provider value={{ theme, resolved, setTheme }}>{children}</ThemeContext.Provider>;
}
