import { memo } from "react";
import { motion } from "framer-motion";
import { jt } from "@/services/translation";
import { JERRY_SUGGESTIONS } from "@/utils/helper";
import type { JerryLangCode } from "@/types/jerry";

type Props = {
  lang: JerryLangCode;
  onPick: (prompt: string) => void;
  disabled?: boolean;
};

const JerrySuggestions = memo(({ lang, onPick, disabled }: Props) => (
  <div className="border-t border-border/60 px-3 py-2">
    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
      {jt(lang, "quick")}
    </p>
    <div className="flex snap-x gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {JERRY_SUGGESTIONS.map((s, i) => (
        <motion.button
          key={s.id}
          type="button"
          disabled={disabled}
          onClick={() => onPick(s.prompt)}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.03 }}
          whileTap={{ scale: 0.95 }}
          className="shrink-0 snap-start rounded-full border border-primary/25 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-primary/10 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {s.label}
        </motion.button>
      ))}
    </div>
  </div>
));

JerrySuggestions.displayName = "JerrySuggestions";
export default JerrySuggestions;
