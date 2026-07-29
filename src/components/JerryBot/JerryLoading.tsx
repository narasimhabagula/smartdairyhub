import { memo } from "react";
import { motion } from "framer-motion";
import { jt } from "@/services/translation";
import type { JerryLangCode } from "@/types/jerry";
import JerryAvatar from "./JerryAvatar";

/** Thinking / typing animation shown while Jerry prepares an answer. */
const JerryLoading = memo(({ lang }: { lang: JerryLangCode }) => (
  <div className="flex items-end gap-2" role="status" aria-live="polite">
    <JerryAvatar size={28} />
    <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm bg-muted px-3 py-2">
      <span className="flex items-center gap-1" aria-hidden>
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-primary"
            animate={{ y: [0, -4, 0], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </span>
      <span className="text-xs text-muted-foreground">{jt(lang, "thinking")}</span>
    </div>
  </div>
));

JerryLoading.displayName = "JerryLoading";
export default JerryLoading;
