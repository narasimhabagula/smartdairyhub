import { memo } from "react";
import { motion } from "framer-motion";
import { Mic, MicOff } from "lucide-react";
import { jt } from "@/services/translation";
import type { JerryLangCode } from "@/types/jerry";
import { cn } from "@/lib/utils";

type Props = {
  listening: boolean;
  supported: boolean;
  interim: string;
  lang: JerryLangCode;
  onStart: () => void;
  onStop: () => void;
};

/** Microphone control with a live voice-wave animation. */
const JerryVoice = memo(({ listening, supported, interim, lang, onStart, onStop }: Props) => {
  if (!supported) return null;
  return (
    <div className="flex items-center gap-2">
      {listening && (
        <span className="flex h-9 items-end gap-[3px] px-1" aria-hidden>
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.span
              key={i}
              className="w-[3px] rounded-full bg-primary"
              animate={{ height: [6, 20, 10, 24, 8] }}
              transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.08 }}
            />
          ))}
        </span>
      )}
      <button
        type="button"
        aria-label={listening ? jt(lang, "stopSpeaking") : jt(lang, "listening")}
        aria-pressed={listening}
        onClick={listening ? onStop : onStart}
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          listening
            ? "border-destructive/40 bg-destructive/10 text-destructive"
            : "border-border bg-background text-foreground hover:bg-muted",
        )}
      >
        {listening ? <MicOff className="h-[18px] w-[18px]" /> : <Mic className="h-[18px] w-[18px]" />}
      </button>
      {listening && interim && (
        <span className="max-w-[40%] truncate text-xs italic text-muted-foreground">{interim}</span>
      )}
    </div>
  );
});

JerryVoice.displayName = "JerryVoice";
export default JerryVoice;
