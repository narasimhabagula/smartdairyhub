import { memo, useCallback, useRef } from "react";
import { Send, Square } from "lucide-react";
import JerryVoice from "./JerryVoice";
import { jt } from "@/services/translation";
import { MAX_INPUT_CHARS } from "@/utils/helper";
import type { JerryLangCode, JerryStatus } from "@/types/jerry";

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  onStop: () => void;
  status: JerryStatus;
  lang: JerryLangCode;
  listening: boolean;
  voiceSupported: boolean;
  interim: string;
  onStartListening: () => void;
  onStopListening: () => void;
};

const JerryInput = memo(
  ({
    value,
    onChange,
    onSend,
    onStop,
    status,
    lang,
    listening,
    voiceSupported,
    interim,
    onStartListening,
    onStopListening,
  }: Props) => {
    const ref = useRef<HTMLTextAreaElement>(null);
    const busy = status === "thinking" || status === "streaming";

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          onSend();
        }
      },
      [onSend],
    );

    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSend();
        }}
        className="flex items-end gap-2 border-t border-border/60 bg-background/80 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl"
      >
        <JerryVoice
          listening={listening}
          supported={voiceSupported}
          interim={interim}
          lang={lang}
          onStart={onStartListening}
          onStop={onStopListening}
        />
        <label className="sr-only" htmlFor="jerry-input">
          {jt(lang, "placeholder")}
        </label>
        <textarea
          id="jerry-input"
          ref={ref}
          rows={1}
          value={value}
          maxLength={MAX_INPUT_CHARS}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={listening ? jt(lang, "listening") : jt(lang, "placeholder")}
          className="max-h-28 min-h-10 flex-1 resize-none rounded-2xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
        <button
          type={busy ? "button" : "submit"}
          onClick={busy ? onStop : undefined}
          aria-label={busy ? jt(lang, "stopSpeaking") : jt(lang, "send")}
          disabled={!busy && !value.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition hover:brightness-105 active:scale-95 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          {busy ? <Square className="h-4 w-4" /> : <Send className="h-[18px] w-[18px]" />}
        </button>
      </form>
    );
  },
);

JerryInput.displayName = "JerryInput";
export default JerryInput;
