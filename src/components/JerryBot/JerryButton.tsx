import { memo } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import jerryMascot from "@/assets/jerry.png";
import { jt } from "@/services/translation";
import type { JerryLangCode } from "@/types/jerry";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClick: () => void;
  lang: JerryLangCode;
};

/** Floating circular launcher — bottom right, glassmorphism + gradient. */
const JerryButton = memo(({ open, onClick, lang }: Props) => (
  <motion.button
    type="button"
    onClick={onClick}
    aria-label={open ? jt(lang, "close") : jt(lang, "open")}
    aria-expanded={open}
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ type: "spring", stiffness: 320, damping: 18 }}
    whileHover={{ scale: 1.06 }}
    whileTap={{ scale: 0.94 }}
    className={cn(
      "fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center overflow-hidden rounded-full",
      "bg-gradient-to-br from-primary to-primary/70 text-primary-foreground",
      "shadow-[0_12px_32px_-8px_hsl(var(--primary)/0.6)] ring-4 ring-background/70 backdrop-blur-xl",
      "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/60 md:bottom-6 md:right-6",
    )}
  >
    {open ? (
      <X className="h-6 w-6" />
    ) : (
      <>
        <img
          src={jerryMascot}
          alt=""
          width={512}
          height={512}
          loading="lazy"
          className="h-11 w-11 object-contain drop-shadow"
        />
        <span className="absolute -right-0.5 -top-0.5 rounded-full bg-amber-400 px-1.5 py-0.5 text-[9px] font-bold text-emerald-950 shadow">
          AI
        </span>
      </>
    )}
  </motion.button>
));

JerryButton.displayName = "JerryButton";
export default JerryButton;
