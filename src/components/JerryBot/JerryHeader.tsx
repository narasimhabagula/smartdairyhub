import { memo } from "react";
import { motion } from "framer-motion";
import { X, Trash2, Volume2, VolumeX, RotateCcw, Square } from "lucide-react";
import JerryAvatar from "./JerryAvatar";
import { JERRY_LANGUAGES, jt } from "@/services/translation";
import type { JerryLangCode } from "@/types/jerry";
import { cn } from "@/lib/utils";

type Props = {
  lang: JerryLangCode;
  onLangChange: (code: JerryLangCode) => void;
  muted: boolean;
  onToggleMute: () => void;
  speaking: boolean;
  onStopSpeaking: () => void;
  onReplay: () => void;
  onClear: () => void;
  onClose?: () => void;
};

const IconBtn = ({
  label,
  onClick,
  active,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    onClick={onClick}
    className={cn(
      "flex h-9 w-9 items-center justify-center rounded-full border border-primary-foreground/25 text-primary-foreground/90 transition hover:bg-primary-foreground/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground/70",
      active && "bg-primary-foreground/20",
    )}
  >
    {children}
  </button>
);

const JerryHeader = memo(
  ({ lang, onLangChange, muted, onToggleMute, speaking, onStopSpeaking, onReplay, onClear, onClose }: Props) => (
    <header className="flex items-center gap-3 bg-gradient-to-r from-primary to-primary/80 px-4 py-3 text-primary-foreground">
      <JerryAvatar size={40} speaking={speaking} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h2 className="truncate font-display text-base font-bold leading-tight">{jt(lang, "title")}</h2>
          <motion.span
            animate={{ opacity: speaking ? [1, 0.4, 1] : 1 }}
            transition={{ repeat: speaking ? Infinity : 0, duration: 1.2 }}
            className="rounded-full bg-primary-foreground/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
          >
            AI
          </motion.span>
        </div>
        <p className="truncate text-[11px] text-primary-foreground/85">{jt(lang, "subtitle")}</p>
      </div>

      <label className="sr-only" htmlFor="jerry-lang">
        Language
      </label>
      <select
        id="jerry-lang"
        value={lang}
        onChange={(e) => onLangChange(e.target.value as JerryLangCode)}
        className="h-9 rounded-full border border-primary-foreground/25 bg-primary-foreground/10 px-2 text-xs font-semibold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground/70"
      >
        {JERRY_LANGUAGES.map((l) => (
          <option key={l.code} value={l.code} className="text-foreground">
            {l.label}
          </option>
        ))}
      </select>

      <div className="flex items-center gap-1">
        {speaking ? (
          <IconBtn label={jt(lang, "stopSpeaking")} onClick={onStopSpeaking} active>
            <Square className="h-4 w-4" />
          </IconBtn>
        ) : (
          <IconBtn label={jt(lang, "replay")} onClick={onReplay}>
            <RotateCcw className="h-4 w-4" />
          </IconBtn>
        )}
        <IconBtn label={muted ? jt(lang, "speakOff") : jt(lang, "speakOn")} onClick={onToggleMute} active={!muted}>
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </IconBtn>
        <IconBtn label={jt(lang, "clear")} onClick={onClear}>
          <Trash2 className="h-4 w-4" />
        </IconBtn>
        {onClose && (
          <IconBtn label={jt(lang, "close")} onClick={onClose}>
            <X className="h-4 w-4" />
          </IconBtn>
        )}
      </div>
    </header>
  ),
);

JerryHeader.displayName = "JerryHeader";
export default JerryHeader;
