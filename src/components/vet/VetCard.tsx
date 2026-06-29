import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Phone, MapPin, MessageCircle, Navigation, Star, Clock, Stethoscope, ShieldCheck, AlertCircle, Radar, Info } from "lucide-react";
import { telHref, waHref } from "@/lib/phone";
import { useTranslation } from "react-i18next";


export type VetCardData = {
  id: string;
  name: string;
  hospital?: string | null;
  subtitle?: string | null;
  phone?: string | null;
  address?: string | null;
  rating?: number | null;
  total_ratings?: number | null;
  open_now?: boolean | null;
  distance_km?: number | null;
  maps_url?: string | null;
  lat?: number | null;
  lng?: number | null;
  hours?: string[] | null;
  is_government?: boolean;
  description?: string | null;
};

export type VetCardProps = {
  vet: VetCardData;
  isLoading?: boolean;
  contactError?: string | null;
  retryIn?: number;
  onRetry?: () => void;
};


function directionsHref(v: VetCardData) {
  if (v.maps_url) return v.maps_url;
  if (v.lat != null && v.lng != null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${v.lat},${v.lng}`;
  }
  const q = [v.hospital, v.address, v.name].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

function isWhatsAppPhone(phone?: string | null) {
  if (!phone) return false;
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10;
}

export function VetCard({ vet, isLoading, contactError, retryIn, onRetry }: VetCardProps) {
  const { t } = useTranslation();
  const initials = vet.name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
  const waOk = isWhatsAppPhone(vet.phone);
  const todayHours = vet.hours?.find((h) => h.toLowerCase().startsWith(new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase()));
  const showLoading = isLoading && !vet.phone; // only show contact-loading skeleton until we have a phone number

  // Availability flags
  const hasPhone = !!vet.phone;
  const hasHours = !!todayHours || (vet.hours && vet.hours.length > 0);
  const hasAddress = !!vet.address;

  return (
    <Card className="group flex h-full flex-col overflow-hidden rounded-2xl border-border/60 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg">
      {/* Header */}
      <div className="flex items-start gap-3 p-5 pb-3">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 font-display text-lg font-bold text-primary ring-1 ring-primary/10">
          {initials || <Stethoscope className="h-6 w-6" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate font-display text-base font-semibold leading-tight">{vet.name}</h3>
          </div>
          {vet.hospital && (
            <p className="mt-0.5 truncate text-sm text-muted-foreground">{vet.hospital}</p>
          )}
          {vet.subtitle && !vet.hospital && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{vet.subtitle}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {vet.rating != null && (
              <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-50 px-1.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                <Star className="h-3 w-3 fill-current" />
                {vet.rating.toFixed(1)}
                {vet.total_ratings ? <span className="font-normal opacity-70">·{vet.total_ratings}</span> : null}
              </span>
            )}
            {vet.open_now === true && (
              <Badge className="border-0 bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300">Open now</Badge>
            )}
            {vet.open_now === false && (
              <Badge variant="secondary" className="bg-rose-100 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300">Closed</Badge>
            )}
            {vet.open_now == null && hasHours && (
              <Badge variant="outline" className="font-normal gap-1 text-muted-foreground"><Info className="h-3 w-3" /> Hours unknown</Badge>
            )}
            {vet.distance_km != null && Number.isFinite(vet.distance_km) && (
              <Badge variant="outline" className="font-normal">{vet.distance_km.toFixed(1)} km</Badge>
            )}
            {vet.is_government && (
              <Badge variant="outline" className="gap-1 border-primary/30 text-primary"><ShieldCheck className="h-3 w-3" /> Govt</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 space-y-1.5 px-5 pb-4 text-sm">
        {hasAddress ? (
          <div className="flex items-start gap-2 text-muted-foreground">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span className="line-clamp-2">{vet.address}</span>
          </div>
        ) : (
          <div className="flex items-start gap-2 text-muted-foreground/70">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span className="line-clamp-2 italic">{t("vet.addressNotAvailable", "Address not available")}</span>
          </div>
        )}

        {showLoading ? (
          <div className="flex items-center gap-2 py-0.5">
            <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
            <Skeleton className="h-3.5 w-28 rounded" />
            <span className="ml-auto text-xs text-muted-foreground">{t("vet.loadingContact", "Loading contact…")}</span>
          </div>
        ) : hasPhone ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{vet.phone}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground/70">
            <Phone className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate italic">{t("vet.phoneNotAvailable", "Phone not available from Google")}</span>
          </div>
        )}

        {contactError && (
          <div className="flex items-start gap-2 rounded-md bg-amber-50/60 p-2 text-xs text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <div className="flex-1">
              <p className="line-clamp-2">{contactError}</p>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  disabled={retryIn !== undefined && retryIn > 0}
                  className="mt-1 inline-flex items-center gap-1 font-medium underline underline-offset-2 disabled:opacity-50"
                >
                  <Radar className="h-3 w-3" />
                  {retryIn !== undefined && retryIn > 0 ? `Retry in ${retryIn}s` : "Retry now"}
                </button>
              )}
            </div>
          </div>
        )}

        {hasHours ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{todayHours || t("vet.hoursAvailable", "Opening hours available")}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground/70">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate italic">{t("vet.hoursNotAvailable", "Opening hours not available from Google")}</span>
          </div>
        )}

        {vet.description && (
          <p className="pt-1 text-xs text-muted-foreground line-clamp-2">{vet.description}</p>
        )}
      </div>

      {/* Actions */}
      <div className="border-t bg-muted/30 p-3">
        {showLoading ? (
          <div className="grid grid-cols-3 gap-2">
            <Skeleton className="h-9 w-full rounded" />
            <Skeleton className="h-9 w-full rounded" />
            <Skeleton className="h-9 w-full rounded" />
          </div>
        ) : (
          <TooltipProvider delayDuration={200}>
            <div className="grid grid-cols-3 gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 w-full gap-1.5 font-medium"
                    disabled={!hasPhone}
                    asChild={hasPhone}
                  >
                    {hasPhone ? (
                      <a href={telHref(vet.phone!)} aria-label={`Call ${vet.name}`}>
                        <Phone className="h-3.5 w-3.5" /> Call
                      </a>
                    ) : (
                      <span><Phone className="h-3.5 w-3.5" /> Call</span>
                    )}
                  </Button>
                </TooltipTrigger>
                {!hasPhone && (
                  <TooltipContent side="bottom">
                    <p className="max-w-[200px] text-xs">{t("vet.phoneNotAvailableTooltip", "Google has no phone number for this place.")}</p>
                  </TooltipContent>
                )}
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    className="h-9 w-full gap-1.5 bg-[#25D366] font-medium text-white shadow-none hover:bg-[#1ebe5b] disabled:bg-muted disabled:text-muted-foreground"
                    disabled={!waOk}
                    asChild={waOk}
                  >
                    {waOk ? (
                      <a href={waHref(vet.phone!)} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp ${vet.name}`}>
                        <MessageCircle className="h-3.5 w-3.5" /> Chat
                      </a>
                    ) : (
                      <span><MessageCircle className="h-3.5 w-3.5" /> Chat</span>
                    )}
                  </Button>
                </TooltipTrigger>
                {!waOk && (
                  <TooltipContent side="bottom">
                    <p className="max-w-[200px] text-xs">
                      {hasPhone
                        ? t("vet.whatsappNotValidTooltip", "Phone number is not valid for WhatsApp.")
                        : t("vet.whatsappNoPhoneTooltip", "No phone number available from Google.")}
                    </p>
                  </TooltipContent>
                )}
              </Tooltip>

              <Button size="sm" variant="outline" className="h-9 w-full gap-1.5 font-medium" asChild>
                <a href={directionsHref(vet)} target="_blank" rel="noopener noreferrer" aria-label={`Directions to ${vet.name}`}>
                  <Navigation className="h-3.5 w-3.5" /> Route
                </a>
              </Button>
            </div>
          </TooltipProvider>
        )}
      </div>
    </Card>
  );
}


export function VetCardSkeleton() {
  return (
    <Card className="overflow-hidden rounded-2xl border-border/60">
      <div className="flex items-start gap-3 p-5 pb-3">
        <div className="h-14 w-14 shrink-0 animate-pulse rounded-xl bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
          <div className="flex gap-1.5">
            <div className="h-5 w-12 animate-pulse rounded bg-muted" />
            <div className="h-5 w-16 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>
      <div className="space-y-2 px-5 pb-4">
        <div className="h-3 w-full animate-pulse rounded bg-muted" />
        <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
      </div>
      <div className="border-t bg-muted/30 p-3">
        <div className="grid grid-cols-3 gap-2">
          <div className="h-9 animate-pulse rounded bg-muted" />
          <div className="h-9 animate-pulse rounded bg-muted" />
          <div className="h-9 animate-pulse rounded bg-muted" />
        </div>
      </div>
    </Card>
  );
}
