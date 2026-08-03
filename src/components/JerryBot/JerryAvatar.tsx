import { memo } from "react";
import { cn } from "@/lib/utils";
import jerryAvatar from "@/assets/jerry-avatar.png";

type Props = {
  size?: number;
  speaking?: boolean;
  className?: string;
};

/** Jerry's identity mark — premium circular glass avatar with soft glow. */
const JerryAvatar = memo(({ size = 36, speaking = false, className }: Props) => (
  <span
    className={cn(
      "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full",
      "bg-white/70 backdrop-blur-md ring-2 ring-primary/40",
      "shadow-[0_6px_20px_-6px_hsl(var(--primary)/0.55)]",
      speaking && "animate-pulse",
      className,
    )}
    style={{ width: size, height: size }}
  >
    <img
      src={jerryAvatar}
      alt="Jerry, Smart Dairy Assistant"
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      className="h-full w-full object-contain p-0.5"
    />
  </span>
));

JerryAvatar.displayName = "JerryAvatar";
export default JerryAvatar;
