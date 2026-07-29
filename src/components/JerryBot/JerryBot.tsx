import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import JerryButton from "./JerryButton";
import JerryHeader from "./JerryHeader";
import JerryMessages from "./JerryMessages";
import JerryInput from "./JerryInput";
import JerrySuggestions from "./JerrySuggestions";
import { useJerry } from "@/context/JerryContext";
import { cn } from "@/lib/utils";

type Props = {
  /** `panel` = floating widget (default), `page` = embedded full-height chat. */
  variant?: "panel" | "page";
  className?: string;
};

export default function JerryBot({ variant = "panel", className }: Props) {
  const j = useJerry();
  const busy = j.status === "thinking" || j.status === "streaming";

  const body = (
    <div className={cn("flex h-full min-h-0 flex-col overflow-hidden", className)}>
      <JerryHeader
        lang={j.lang}
        onLangChange={j.changeLanguage}
        muted={j.muted}
        onToggleMute={j.toggleMute}
        speaking={j.speaking}
        onStopSpeaking={j.stopSpeaking}
        onReplay={j.replayLast}
        onClear={j.clearChat}
        onClose={variant === "panel" ? () => j.setOpen(false) : undefined}
      />

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <JerryMessages messages={j.messages} status={j.status} lang={j.lang} speaking={j.speaking} />
      </div>

      {j.error && (
        <div
          role="alert"
          className="mx-3 mb-2 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
        >
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{j.error}</span>
        </div>
      )}

      <JerrySuggestions lang={j.lang} onPick={(p) => j.send(p)} disabled={busy} />
      <JerryInput
        value={j.input}
        onChange={j.setInput}
        onSend={() => j.send()}
        onStop={j.stopGenerating}
        status={j.status}
        lang={j.lang}
        listening={j.listening}
        voiceSupported={j.voiceSupported}
        interim={j.interim}
        onStartListening={j.startListening}
        onStopListening={j.stopListening}
      />
    </div>
  );

  if (variant === "page") {
    return (
      <div className="mx-auto flex h-[calc(100dvh-8rem)] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-border/60 bg-background/80 shadow-xl backdrop-blur-xl">
        {body}
      </div>
    );
  }

  return (
    <>
      <JerryButton open={j.open} onClick={() => j.setOpen(!j.open)} lang={j.lang} />
      <AnimatePresence>
        {j.open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => j.setOpen(false)}
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] md:bg-black/20"
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Jerry — Smart Dairy Assistant"
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 280, damping: 26 }}
              className={cn(
                "fixed inset-x-2 bottom-2 top-14 z-50 flex flex-col overflow-hidden rounded-3xl border border-border/60 bg-background/95 shadow-2xl backdrop-blur-2xl",
                "sm:inset-x-auto sm:right-4 sm:top-auto sm:h-[600px] sm:w-[420px] md:right-6 md:bottom-6",
              )}
            >
              {body}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
