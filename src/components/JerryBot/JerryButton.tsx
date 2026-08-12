import { memo, useCallback, useEffect, useRef, useState } from "react";
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

const SIZE = 62;
const MARGIN = 8;
const POS_KEY = "sdh_jerry_fab_pos";
const DRAG_THRESHOLD = 6;

type Pos = { x: number; y: number };

function clampToViewport(p: Pos): Pos {
  const maxX = Math.max(MARGIN, window.innerWidth - SIZE - MARGIN);
  const maxY = Math.max(MARGIN, window.innerHeight - SIZE - MARGIN);
  return {
    x: Math.min(Math.max(p.x, MARGIN), maxX),
    y: Math.min(Math.max(p.y, MARGIN), maxY),
  };
}

function readStoredPos(): Pos | null {
  try {
    const raw = localStorage.getItem(POS_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (typeof p?.x === "number" && typeof p?.y === "number") return p;
  } catch {}
  return null;
}

/**
 * Floating launcher — the Jerry mascot itself IS the button.
 * Draggable with mouse + touch, position persisted and always kept in-viewport.
 */
const JerryButton = memo(({ open, onClick, lang }: Props) => {
  const [pos, setPos] = useState<Pos | null>(null);
  const [dragging, setDragging] = useState(false);
  const start = useRef<{ px: number; py: number; ox: number; oy: number; moved: boolean } | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const stored = readStoredPos();
    if (stored) setPos(clampToViewport(stored));
    const onResize = () => setPos((p) => (p ? clampToViewport(p) : p));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== undefined && e.button !== 0) return;
    const rect = btnRef.current?.getBoundingClientRect();
    if (!rect) return;
    start.current = { px: e.clientX, py: e.clientY, ox: rect.left, oy: rect.top, moved: false };
    btnRef.current?.setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    const s = start.current;
    if (!s) return;
    const dx = e.clientX - s.px;
    const dy = e.clientY - s.py;
    if (!s.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    s.moved = true;
    setDragging(true);
    setPos(clampToViewport({ x: s.ox + dx, y: s.oy + dy }));
  }, []);

  const endDrag = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    const s = start.current;
    start.current = null;
    try {
      btnRef.current?.releasePointerCapture(e.pointerId);
    } catch {}
    if (s?.moved) {
      setDragging(false);
      setPos((p) => {
        if (p) {
          try {
            localStorage.setItem(POS_KEY, JSON.stringify(p));
          } catch {}
        }
        return p;
      });
      return;
    }
    onClick();
  }, [onClick]);

  return (
    <motion.button
      ref={btnRef}
      type="button"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={() => {
        start.current = null;
        setDragging(false);
      }}
      aria-label={open ? jt(lang, "close") : jt(lang, "open")}
      aria-expanded={open}
      initial={{ scale: 0.4, opacity: 0, y: 24 }}
      animate={
        open || dragging
          ? { scale: dragging ? 1.06 : 1, opacity: 1, y: 0 }
          : { scale: 1, opacity: 1, y: [0, -6, 0] }
      }
      transition={
        open || dragging
          ? { type: "spring", stiffness: 320, damping: 18 }
          : {
              y: { duration: 3.2, repeat: Infinity, ease: "easeInOut" },
              scale: { type: "spring", stiffness: 260, damping: 12 },
              opacity: { duration: 0.35 },
            }
      }
      whileHover={{ scale: 1.09 }}
      whileTap={{ scale: 0.95 }}
      style={
        pos
          ? { left: pos.x, top: pos.y, right: "auto", bottom: "auto", touchAction: "none" }
          : { touchAction: "none" }
      }
      className={cn(
        "group fixed z-40 grid h-[62px] w-[62px] place-items-center rounded-full",
        !pos && "bottom-20 right-4 md:bottom-6 md:right-6",
        dragging ? "cursor-grabbing" : "cursor-grab",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/50",
        open && "bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-[0_14px_34px_-10px_hsl(var(--primary)/0.65)]",
      )}
    >
      {open ? (
        <X className="h-6 w-6" />
      ) : (
        <>
          {/* Premium soft glow — gentle breathing, never flashing */}
          <motion.span
            aria-hidden
            className="pointer-events-none absolute -inset-1 rounded-full bg-primary/35 blur-xl"
            animate={{ opacity: [0.45, 0.8, 0.45], scale: [1, 1.08, 1] }}
            transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-primary/50"
          />
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-primary/45"
            animate={{ scale: [1, 1.4, 1.4], opacity: [0.55, 0, 0] }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 1.8, ease: "easeOut" }}
          />
          <img
            src={jerryIcon}
            alt=""
            width={512}
            height={512}
            draggable={false}
            loading="lazy"
            decoding="async"
            className="relative h-[62px] w-[62px] select-none rounded-full object-contain drop-shadow-[0_10px_22px_rgba(7,26,11,0.36)]"
          />
        </>
      )}
    </motion.button>
  );
});

JerryButton.displayName = "JerryButton";
export default JerryButton;
