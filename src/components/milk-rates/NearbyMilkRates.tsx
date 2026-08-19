import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  MapPin, Navigation, Crosshair, Info, TrendingUp, TrendingDown,
  Droplet, Clock, Loader2, ChevronRight, ShieldQuestion,
} from "lucide-react";
import {
  DEMO_AREAS, RADIUS_OPTIONS, demoNearbyDairies, timeAgo,
  type NearbyDairyRate,
} from "@/data/demo/nearbyDairies";

type Status = "idle" | "locating" | "denied" | "unavailable" | "located";

const DEFAULT_AREA = DEMO_AREAS[0];

/** Maps a coarse coordinate to the closest demo area label. Coordinates are
 *  used in-memory only: never rendered, stored, put in URLs, or sent anywhere. */
function approximateArea(lat: number, lon: number) {
  const anchors = [
    { area: DEMO_AREAS[0], lat: 17.0, lon: 81.8 },
    { area: DEMO_AREAS[1], lat: 16.99, lon: 82.24 },
    { area: DEMO_AREAS[2], lat: 16.71, lon: 81.1 },
    { area: DEMO_AREAS[3], lat: 16.51, lon: 80.65 },
    { area: DEMO_AREAS[4], lat: 17.39, lon: 78.49 },
  ];
  let best = anchors[0];
  let bestD = Infinity;
  for (const a of anchors) {
    const d = (a.lat - lat) ** 2 + (a.lon - lon) ** 2;
    if (d < bestD) { bestD = d; best = a; }
  }
  return best.area;
}

function Delta({ value }: { value: number }) {
  if (!value) return <span className="text-xs text-muted-foreground">no change</span>;
  const up = value > 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${up ? "text-emerald-600" : "text-rose-600"}`}>
      <Icon className="h-3 w-3" />
      {up ? "+" : "-"}₹{Math.abs(value).toFixed(2)}
    </span>
  );
}

function StatusChip({ row }: { row: NearbyDairyRate }) {
  const sample = row.verificationStatus === "sample";
  return (
    <Badge variant="outline" className={sample
      ? "border-amber-500/40 bg-amber-500/10 text-amber-700"
      : "border-emerald-500/40 bg-emerald-500/10 text-emerald-700"}>
      {sample ? "Sample rate" : "Demo data"}
    </Badge>
  );
}

const directionsHref = (row: NearbyDairyRate) =>
  `https://www.google.com/maps/dir/?api=1&destination=${row.latitude},${row.longitude}`;

export default function NearbyMilkRates() {
  const [radius, setRadius] = useState(50);
  const [area, setArea] = useState(DEFAULT_AREA);
  const [status, setStatus] = useState<Status>("idle");
  const [picking, setPicking] = useState(false);
  const [detail, setDetail] = useState<string | null>(null);

  const rows = useMemo(
    () => demoNearbyDairies.filter((d) => d.distance <= radius).sort((a, b) => a.distance - b.distance),
    [radius],
  );

  const useMyLocation = () => {
    if (!("geolocation" in navigator)) { setStatus("unavailable"); return; }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) { setStatus("unavailable"); return; }
        setArea(approximateArea(latitude, longitude));
        setStatus("located");
      },
      (err) => setStatus(err.code === err.PERMISSION_DENIED ? "denied" : "unavailable"),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 },
    );
  };

  return (
    <section aria-labelledby="nearby-heading" className="mb-8">
      {/* Intelligence card */}
      <Card className="mb-4 border-emerald-100">
        <CardContent className="flex flex-col gap-2 p-5">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-base font-semibold">Smart Local Milk Intelligence</h3>
            <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700">Demo mode</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Smart Dairy Hub helps farmers discover nearby milk buyers and compare available procurement rates based on their area.
          </p>
          <p className="text-xs font-medium text-emerald-700">GPS-powered • Location-aware • Rate comparison • Future-ready</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 id="nearby-heading" className="flex items-center gap-2 font-display text-xl font-bold">
                <MapPin className="h-5 w-5 text-emerald-600" /> Milk Rates Near You
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Find nearby dairy companies and milk collection centres within {radius} KM of your location.
              </p>
            </div>
            <Badge variant="outline" className="gap-1"><ShieldQuestion className="h-3 w-3" /> Not verified live rates</Badge>
          </div>

          {/* Location controls */}
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border bg-background p-3">
              <p className="text-xs text-muted-foreground">Location</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold">
                <MapPin className="h-4 w-4 text-emerald-600" /> {area.label}
              </p>
              {picking ? (
                <Select
                  value={area.id}
                  onValueChange={(v) => {
                    const next = DEMO_AREAS.find((a) => a.id === v);
                    if (next) { setArea(next); setStatus("idle"); }
                    setPicking(false);
                  }}
                >
                  <SelectTrigger className="mt-2 h-8"><SelectValue placeholder="Select your area" /></SelectTrigger>
                  <SelectContent>
                    {DEMO_AREAS.map((a) => <SelectItem key={a.id} value={a.id}>{a.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <button onClick={() => setPicking(true)} className="mt-2 text-xs font-medium text-emerald-700 underline-offset-2 hover:underline">
                  Change location
                </button>
              )}
            </div>

            <div className="rounded-lg border bg-background p-3">
              <p className="text-xs text-muted-foreground">Radius</p>
              <Select value={String(radius)} onValueChange={(v) => setRadius(Number(v))}>
                <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RADIUS_OPTIONS.map((r) => <SelectItem key={r} value={String(r)}>{r} KM</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="mt-2 text-xs text-muted-foreground">Showing dairy centres within {radius} KM</p>
            </div>

            <div className="rounded-lg border bg-background p-3">
              <p className="text-xs text-muted-foreground">Near me</p>
              <Button onClick={useMyLocation} disabled={status === "locating"} className="mt-1 w-full gap-2">
                {status === "locating" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crosshair className="h-4 w-4" />}
                Use my location
              </Button>
              <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
                We use your location only to find dairy centres near you. Your exact coordinates are never shown or saved.
              </p>
            </div>
          </div>

          {/* Location states */}
          {status === "denied" && (
            <p className="mt-3 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-800">
              Location access was not provided. Please select your area manually.
            </p>
          )}
          {status === "unavailable" && (
            <p className="mt-3 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-800">
              Location services are currently unavailable. Please select your area manually.
            </p>
          )}
          {status === "located" && (
            <p className="mt-3 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-800">
              Showing centres near your approximate area: {area.label}.
            </p>
          )}

          {/* Table (desktop) */}
          <div className="mt-5 hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Dairy / Collection centre</th>
                  <th className="py-2 pr-3 font-medium">Distance</th>
                  <th className="py-2 pr-3 font-medium">Cow ₹/L</th>
                  <th className="py-2 pr-3 font-medium">Buffalo ₹/L</th>
                  <th className="py-2 pr-3 font-medium">Fat</th>
                  <th className="py-2 pr-3 font-medium">SNF</th>
                  <th className="py-2 pr-3 font-medium">Updated</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b last:border-0 transition-colors hover:bg-muted/40">
                    <td className="py-3 pr-3">
                      <p className="font-semibold">{row.dairyName}</p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{row.location}</p>
                    </td>
                    <td className="py-3 pr-3 whitespace-nowrap">{row.distance} KM away</td>
                    <td className="py-3 pr-3 whitespace-nowrap">
                      <p className="font-semibold">₹{row.cowRate.toFixed(2)}</p>
                      <Delta value={row.cowChange} />
                    </td>
                    <td className="py-3 pr-3 whitespace-nowrap">
                      <p className="font-semibold">₹{row.buffaloRate.toFixed(2)}</p>
                      <Delta value={row.buffaloChange} />
                    </td>
                    <td className="py-3 pr-3">{row.fat}%</td>
                    <td className="py-3 pr-3">{row.snf}%</td>
                    <td className="py-3 pr-3 whitespace-nowrap text-xs text-muted-foreground">{timeAgo(row.updatedAt)}</td>
                    <td className="py-3 pr-3"><StatusChip row={row} /></td>
                    <td className="py-3">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" className="gap-1" onClick={() => setDetail(detail === row.id ? null : row.id)}>
                          View details <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                        <a href={directionsHref(row)} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="outline" className="gap-1"><Navigation className="h-3.5 w-3.5" /> Directions</Button>
                        </a>
                      </div>
                      {detail === row.id && (
                        <p className="mt-1 text-right text-xs text-muted-foreground">
                          {row.session === "morning" ? "Morning" : "Evening"} session • FAT {row.fat}% • SNF {row.snf}% • source: {row.source}
                        </p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards (mobile) */}
          <div className="mt-5 space-y-3 md:hidden">
            {rows.map((row) => (
              <div key={row.id} className="rounded-xl border p-3 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{row.dairyName}</p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />{row.location} • {row.distance} KM away
                    </p>
                  </div>
                  <StatusChip row={row} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-lg border bg-emerald-500/5 p-2">
                    <p className="flex items-center gap-1 text-xs font-medium"><Droplet className="h-3 w-3" /> Cow</p>
                    <p className="text-base font-bold">₹{row.cowRate.toFixed(2)}<span className="text-[10px] font-normal opacity-70">/L</span></p>
                    <Delta value={row.cowChange} />
                  </div>
                  <div className="rounded-lg border bg-violet-500/5 p-2">
                    <p className="flex items-center gap-1 text-xs font-medium"><Droplet className="h-3 w-3" /> Buffalo</p>
                    <p className="text-base font-bold">₹{row.buffaloRate.toFixed(2)}<span className="text-[10px] font-normal opacity-70">/L</span></p>
                    <Delta value={row.buffaloChange} />
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span>FAT {row.fat}%</span><span>SNF {row.snf}%</span>
                  <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{timeAgo(row.updatedAt)}</span>
                </div>
                <a href={directionsHref(row)} target="_blank" rel="noopener noreferrer" className="mt-3 block">
                  <Button size="sm" variant="outline" className="w-full gap-1"><Navigation className="h-3.5 w-3.5" /> Get directions</Button>
                </a>
              </div>
            ))}
          </div>

          {rows.length === 0 && (
            <p className="mt-5 rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
              No dairy centres found within this radius. Try expanding your search.
            </p>
          )}

          <p className="mt-5 flex items-start gap-2 rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Sample milk rates shown for demonstration purposes. The production version will use verified dairy/company data.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
