import { createContext, useContext, type ReactNode } from "react";
import { useJerryBot, type JerryBotApi } from "@/hooks/useJerryBot";

const JerryContext = createContext<JerryBotApi | null>(null);

export function JerryProvider({ children }: { children: ReactNode }) {
  const api = useJerryBot();
  return <JerryContext.Provider value={api}>{children}</JerryContext.Provider>;
}

export function useJerry(): JerryBotApi {
  const ctx = useContext(JerryContext);
  if (!ctx) throw new Error("useJerry must be used inside <JerryProvider>");
  return ctx;
}
