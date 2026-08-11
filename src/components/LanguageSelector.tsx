import { Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LANGUAGES, type LanguageCode } from "@/locales";
import { useAuth } from "@/contexts/AuthContext";
import { setAppLanguage } from "@/lib/language";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/**
 * Compact circular language selector. Switching applies instantly across the
 * whole app (no reload) and persists via the shared language layer.
 */
export default function LanguageSelector({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md";
}) {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const current = (i18n.language?.slice(0, 2) || "en") as LanguageCode;
  const dim = size === "sm" ? "h-9 w-9" : "h-10 w-10";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Change language"
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full border border-border/70 bg-muted text-foreground transition-colors hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          dim,
          className,
        )}
      >
        <Globe className={size === "sm" ? "h-[18px] w-[18px]" : "h-5 w-5"} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-96 w-56 overflow-auto">
        <DropdownMenuLabel>Choose language</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {LANGUAGES.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => void setAppLanguage(i18n, l.code, user?.id)}
            className={cn("gap-2", l.code === current && "bg-primary/10 text-primary")}
          >
            <span className="font-medium" data-no-translate>{l.native}</span>
            <span className="ml-auto text-xs text-muted-foreground">{l.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
