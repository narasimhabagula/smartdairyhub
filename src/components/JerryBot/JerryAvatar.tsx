import { memo } from "react";
import { cn } from "@/lib/utils";
import jerryAvatar from "@/assets/jerry-avatar.svg";

type Props = {
  size?: number;
  speaking?: boolean;
  className?: string;
};

/** Jerry's identity mark — a friendly dairy assistant badge. */
const JerryAvatar = memo(({ size = 36, speaking = false, className }: Props) => (
  <span
    className={cn(
      "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary/90 to-primary ring-2 ring-background",
      speaking && "animate-pulse",
      className,
    )}
    style={{ width: size, height: size }}
  >
    <img src={jerryAvatar} alt="Jerry, Smart Dairy Assistant" width={size} height={size} className="h-full w-full object-cover" />
  </span>
));

JerryAvatar.displayName = "JerryAvatar";
export default JerryAvatar;
