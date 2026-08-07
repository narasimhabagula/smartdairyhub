import { memo } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import jerryIcon from "@/assets/jerry-bot-icon.png";
import { jt } from "@/services/translation";
import type { JerryLangCode } from "@/types/jerry";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClick: () => void;
  lang: JerryLangCode;
};

/**
 * Floating launcher — the Jerry mascot itself IS the button.
 * No square container, no crop: a perfect transparent circle like WhatsApp's FAB.
 */
const JerryButton = memo(({ open, onClick, lang }: Props) => (
  <motion.button
    type="button"
    onClick={onClick}
    aria-label={open ? jt(lang, "close") : jt(lang, "open")}
    aria-expanded={open}
    initial={{ scale: 0.4, opacity: 0, y: 24 }}
    animate={
      open
        ? { scale: 1, opacity: 1, y: 0 }
        : { scale: 1, opacity: 1, y: [0, -6, 0] }
    }
    transition={
      open
        ? { type: "spring", stiffness: 320, damping: 18 }
        : {
            y: { duration: 3.2, repeat: Infinity, ease: "easeInOut" },
            scale: { type: "spring", stiffness: 260, damping: 12 },
            opacity: { duration: 0.35 },
          }
    }
    whileHover={{ scale: 1.09 }}
    whileTap={{ scale: 0.93 }}
    className={cn(
      "group fixed bottom-20 right-4 z-40 grid h-[62px] w-[62px] place-items-center rounded-full",
      "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/50 md:bottom-6 md:right-6",
      open && "bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-[0_14px_34px_-10px_hsl(var(--primary)/0.65)]",
    )}
  >
    {open ? (
      <X className="h-6 w-6" />
    ) : (
      <>
        {/* Soft glow + slow pulse ring, sitting behind the transparent mascot */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full bg-primary/30 blur-lg transition-opacity group-hover:opacity-90"
        />
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-primary/45"
          animate={{ scale: [1, 1.35, 1.35], opacity: [0.65, 0, 0] }}
          transition={{ duration: 2.8, repeat: Infinity, repeatDelay: 2.2, ease: "easeOut" }}
        />
        <img
          src={jerryIcon}
          alt=""
          width={512}
          height={512}
          loading="lazy"
          decoding="async"
          className="relative h-[62px] w-[62px] rounded-full object-contain drop-shadow-[0_10px_20px_rgba(7,26,11,0.32)]"
        />
      </>
    )}
  </motion.button>
));

JerryButton.displayName = "JerryButton";
export default JerryButton;
