import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Phone, MapPin, Clock, Search, Factory, TrendingDown, TrendingUp, Droplet,
  ShieldCheck, MessageCircle, Navigation, Mic, MicOff, Heart, Sun, Moon
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { telHref, waHref } from "@/lib/phone";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import HeroPanel from "@/components/hero/HeroPanel";
import { HERO_MILK } from "@/components/hero/heroContent";
import milkBanner from "@/assets/hero-milk.jpg.asset.json";

import NearbyMilkRates from "@/components/milk-rates/NearbyMilkRates";
import heroMilk from "@/assets/card-milk.jpg";

type Company = {
  id: string;
  name: string;
  logo_url: string | null;
  district: string | null;
  state: string | null;
  phone: string | null;
  working_hours: string | null;
  verified: boolean;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
};

type Rate = {
  id: string;
  company_id: string;
  milk_type: "cow" | "buffalo";
  fat: number;
  snf: number;
  price_per_litre: number;
  effective_date: string;
  collection_timing: string | null;
  updated_at: string;
};

type Row = {
  company: Company;
  cow_morning?: Rate;
  cow_evening?: Rate;
  buf_morning?: Rate;
  buf_evening?: Rate;
};

const FAV_KEY = "sdh_fav_dairies";

const sessionOf = (r?: Rate): "morning" | "evening" | "all" => {
  const t = (r?.collection_timing || "").toLowerCase();
  if (t.includes("morn")) return "morning";
  if (t.includes("even")) return "evening";
  return "all";
};

export default function MilkRates() {
  const { hasRole } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [rates, setRates] = useState<Rate[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [district, setDistrict] = useState("all");
  const [state, setState] = useState("all");
  const [milkType, setMilkType] = useState<"all" | "cow" | "buffalo">("all");
  const [session, setSession] = useState<"all" | "morning" | "evening">("all");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sort, setSort] = useState<"recent" | "high" | "low">("recent");
  const [favs, setFavs] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(FAV_KEY) || "[]"); } catch { return []; }
  });
  const [listening, setListening] = useState(false);
  const recogRef = useRef<any>(null);

  const isIndustry = hasRole?.("industry");
  const isAdmin = hasRole?.("admin");
  // Only owners/admins can read dairy_companies under RLS — subscribing as
  // anon/authenticated non-owners triggers "permission denied" errors from Realtime.
  const canSubscribeCompanies = Boolean(isIndustry || isAdmin);

  const load = async () => {
    setLoading(true);
    const [{ data: c }, { data: r }] = await Promise.all([
      supabase.from("dairy_companies_public").select("id,name,logo_url,district,state,phone,working_hours,verified,address,latitude,longitude"),
      supabase.from("milk_rates").select("id,company_id,milk_type,fat,snf,price_per_litre,effective_date,collection_timing,updated_at").order("effective_date", { ascending: false }).order("updated_at", { ascending: false }),
    ]);
    setCompanies((c as Company[]) ?? []);
    setRates((r as Rate[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    let ch = supabase.channel("milk-rates-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "milk_rates" }, load);
    if (canSubscribeCompanies) {
      ch = ch.on("postgres_changes", { event: "*", schema: "public", table: "dairy_companies" }, load);
    }
    const sub = ch.subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [canSubscribeCompanies]);


  const districts = useMemo(() => Array.from(new Set(companies.map((c) => c.district).filter(Boolean))).sort() as string[], [companies]);
  const states = useMemo(() => Array.from(new Set(companies.map((c) => c.state).filter(Boolean))).sort() as string[], [companies]);

  const rows: Row[] = useMemo(() => {
    return companies.map((c) => {
      const pick = (type: "cow" | "buffalo", sess: "morning" | "evening") =>
        rates.find((r) => r.company_id === c.id && r.milk_type === type && sessionOf(r) === sess);
      const any = (type: "cow" | "buffalo") => rates.find((r) => r.company_id === c.id && r.milk_type === type);
      return {
        company: c,
        cow_morning: pick("cow", "morning") || any("cow"),
        cow_evening: pick("cow", "evening"),
        buf_morning: pick("buffalo", "morning") || any("buffalo"),
        buf_evening: pick("buffalo", "evening"),
      };
    });
  }, [companies, rates]);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    let list = rows.filter((row) => {
      if (verifiedOnly && !row.company.verified) return false;
      if (district !== "all" && row.company.district !== district) return false;
      if (state !== "all" && row.company.state !== state) return false;
      if (ql) {
        const blob = `${row.company.name} ${row.company.district ?? ""} ${row.company.state ?? ""}`.toLowerCase();
        if (!blob.includes(ql)) return false;
      }
      const has = (r?: Rate) => !!r && (milkType === "all" || r.milk_type === milkType) && (session === "all" || sessionOf(r) === session);
      if (milkType !== "all" || session !== "all") {
        if (!has(row.cow_morning) && !has(row.cow_evening) && !has(row.buf_morning) && !has(row.buf_evening)) return false;
      }
      return true;
    });

    const priceFor = (r: Row) => {
      const pool = [r.cow_morning, r.cow_evening, r.buf_morning, r.buf_evening].filter((x): x is Rate => !!x)
        .filter((x) => milkType === "all" || x.milk_type === milkType)
        .filter((x) => session === "all" || sessionOf(x) === session);
      return pool.length ? Math.max(...pool.map((p) => Number(p.price_per_litre))) : 0;
    };

    if (sort === "high") list = [...list].sort((a, b) => priceFor(b) - priceFor(a));
    else if (sort === "low") list = [...list].sort((a, b) => (priceFor(a) || Infinity) - (priceFor(b) || Infinity));
    else list = [...list].sort((a, b) => {
      const t = (r: Row) => Math.max(
        new Date(r.cow_morning?.updated_at ?? 0).getTime(),
        new Date(r.cow_evening?.updated_at ?? 0).getTime(),
        new Date(r.buf_morning?.updated_at ?? 0).getTime(),
        new Date(r.buf_evening?.updated_at ?? 0).getTime(),
      );
      return t(b) - t(a);
    });

    // favourites first within current sort
    list.sort((a, b) => Number(favs.includes(b.company.id)) - Number(favs.includes(a.company.id)));
    return list;
  }, [rows, q, district, state, milkType, session, verifiedOnly, sort, favs]);

  const toggleFav = (id: string) => {
    setFavs((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem(FAV_KEY, JSON.stringify(next));
      return next;
    });
  };

  // Voice search (Web Speech API)
  const startVoice = () => {
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { toast.error("Voice search not supported in this browser"); return; }
    const rec = new SR();
    rec.lang = "en-IN";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e: any) => {
      const said: string = e.results[0][0].transcript || "";
      applyVoiceCommand(said);
    };
    rec.onerror = () => { setListening(false); toast.error("Could not capture voice"); };
    rec.onend = () => setListening(false);
    recogRef.current = rec;
    setListening(true);
    rec.start();
  };
  const stopVoice = () => { try { recogRef.current?.stop(); } catch {} setListening(false); };

  const applyVoiceCommand = (text: string) => {
    const t = text.toLowerCase();
    let didStructural = false;
    if (t.includes("buffalo")) { setMilkType("buffalo"); didStructural = true; }
    else if (t.includes("cow")) { setMilkType("cow"); didStructural = true; }
    if (t.includes("morning")) { setSession("morning"); didStructural = true; }
    else if (t.includes("evening")) { setSession("evening"); didStructural = true; }
    if (t.includes("verified")) { setVerifiedOnly(true); didStructural = true; }
    if (t.includes("highest")) { setSort("high"); didStructural = true; }
    else if (t.includes("lowest")) { setSort("low"); didStructural = true; }
    else if (t.includes("recent") || t.includes("latest")) { setSort("recent"); didStructural = true; }

    // try to match a district
    const d = districts.find((x) => t.includes(x.toLowerCase()));
    if (d) { setDistrict(d); didStructural = true; }
    const s = states.find((x) => t.includes(x.toLowerCase()));
    if (s) { setState(s); didStructural = true; }

    // Fallback: use as plain search query
    if (!didStructural) setQ(text);
    toast.success(`Heard: "${text}"`);
  };

  return (
    <>
      <div className="container px-4 pt-4 sm:px-6 md:pt-6">
        <HeroPanel content={HERO_MILK} priority showBack />
      </div>
    <div className="container py-8 md:py-8">

      <div className="mb-6 hidden md:flex flex-wrap items-start justify-between gap-4">
        <div />
        {isIndustry && (
          <Link to="/industry">
            <Button variant="outline" className="gap-2"><Factory className="h-4 w-4" /> Industry panel</Button>
          </Link>
        )}
      </div>

      <NearbyMilkRates />

      {/* Search + filters */}
      <Card className="mb-6">
        <CardContent className="space-y-3 p-4">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder='Search dairy or location — e.g. "Heritage", "East Godavari"…'
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-9 pr-12"
              />
              <Button
                type="button"
                size="icon"
                variant={listening ? "destructive" : "ghost"}
                onClick={listening ? stopVoice : startVoice}
                className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
                aria-label="Voice search"
                title='Try: "Highest buffalo milk rate"'
              >
                {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
            </div>
            <Select value={sort} onValueChange={(v) => setSort(v as any)}>
              <SelectTrigger className="md:w-56"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Recently updated</SelectItem>
                <SelectItem value="high"><span className="inline-flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5" /> Highest rate</span></SelectItem>
                <SelectItem value="low"><span className="inline-flex items-center gap-1"><TrendingDown className="h-3.5 w-3.5" /> Lowest rate</span></SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-3 md:grid-cols-5">
            <Select value={state} onValueChange={setState}>
              <SelectTrigger><SelectValue placeholder="State" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All states</SelectItem>
                {states.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={district} onValueChange={setDistrict}>
              <SelectTrigger><SelectValue placeholder="District" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All districts</SelectItem>
                {districts.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={milkType} onValueChange={(v) => setMilkType(v as any)}>
              <SelectTrigger><SelectValue placeholder="Milk type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Cow & Buffalo</SelectItem>
                <SelectItem value="cow">Cow only</SelectItem>
                <SelectItem value="buffalo">Buffalo only</SelectItem>
              </SelectContent>
            </Select>
            <Select value={session} onValueChange={(v) => setSession(v as any)}>
              <SelectTrigger><SelectValue placeholder="Session" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sessions</SelectItem>
                <SelectItem value="morning">Morning</SelectItem>
                <SelectItem value="evening">Evening</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center justify-between rounded-md border bg-background px-3">
              <Label htmlFor="vonly" className="flex items-center gap-2 text-sm"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Verified only</Label>
              <Switch id="vonly" checked={verifiedOnly} onCheckedChange={setVerifiedOnly} />
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}><CardContent className="h-56 animate-pulse bg-muted/40" /></Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">No dairy companies match your filters.</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((row) => (
            <RateCard
              key={row.company.id}
              row={row}
              fav={favs.includes(row.company.id)}
              onToggleFav={() => toggleFav(row.company.id)}
            />
          ))}
        </div>
      )}
    </div>
    </>
  );
}

function RateCard({ row, fav, onToggleFav }: { row: Row; fav: boolean; onToggleFav: () => void }) {
  const { company, cow_morning, cow_evening, buf_morning, buf_evening } = row;
  const updated = Math.max(
    new Date(cow_morning?.updated_at ?? 0).getTime(),
    new Date(cow_evening?.updated_at ?? 0).getTime(),
    new Date(buf_morning?.updated_at ?? 0).getTime(),
    new Date(buf_evening?.updated_at ?? 0).getTime(),
  );

  const mapsHref = company.latitude && company.longitude
    ? `https://www.google.com/maps/dir/?api=1&destination=${company.latitude},${company.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([company.name, company.address, company.district, company.state].filter(Boolean).join(", "))}`;

  return (
    <Card className="overflow-hidden border-emerald-100 transition-shadow hover:shadow-md">
      <div className="flex items-start gap-3 border-b bg-gradient-to-br from-emerald-50/60 to-transparent p-4">
        {company.logo_url ? (
          <img src={company.logo_url} alt={`${company.name} logo`} className="h-12 w-12 rounded-md object-cover ring-1 ring-border" />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-emerald-600/10 text-emerald-700">
            <Factory className="h-6 w-6" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold">{company.name}</h3>
            {company.verified && (
              <Badge className="gap-1 bg-emerald-600 hover:bg-emerald-600"><ShieldCheck className="h-3 w-3" /> Verified</Badge>
            )}
          </div>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {[company.district, company.state].filter(Boolean).join(", ") || "Location not set"}
          </p>
        </div>
        <button
          onClick={onToggleFav}
          aria-label={fav ? "Remove favourite" : "Save favourite"}
          className={`rounded-md p-1.5 transition ${fav ? "text-rose-500" : "text-muted-foreground hover:text-rose-500"}`}
        >
          <Heart className={`h-4 w-4 ${fav ? "fill-current" : ""}`} />
        </button>
      </div>

      <CardContent className="space-y-3 pt-4">
        <div className="grid grid-cols-2 gap-2">
          <RatePill type="cow" session="morning" rate={cow_morning} />
          <RatePill type="cow" session="evening" rate={cow_evening} />
          <RatePill type="buffalo" session="morning" rate={buf_morning} />
          <RatePill type="buffalo" session="evening" rate={buf_evening} />
        </div>

        <div className="flex flex-wrap gap-3 pt-1 text-xs text-muted-foreground">
          {company.working_hours && <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{company.working_hours}</span>}
          {updated > 0 && <span>Updated {new Date(updated).toLocaleString()}</span>}
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1">
          <a href={telHref(company.phone || "") || "#"} className={company.phone ? "" : "pointer-events-none opacity-50"}>
            <Button size="sm" variant="outline" className="w-full gap-1"><Phone className="h-4 w-4" /> Call</Button>
          </a>
          <a href={waHref(company.phone || "", `Hi, I saw your milk rates on Smart Dairy Hub.`) || "#"} target="_blank" rel="noopener" className={company.phone ? "" : "pointer-events-none opacity-50"}>
            <Button size="sm" variant="outline" className="w-full gap-1 border-emerald-500/40 text-emerald-700 hover:bg-emerald-50"><MessageCircle className="h-4 w-4" /> WhatsApp</Button>
          </a>
          <a href={mapsHref} target="_blank" rel="noopener">
            <Button size="sm" variant="outline" className="w-full gap-1"><Navigation className="h-4 w-4" /> Directions</Button>
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

function RatePill({ type, session, rate }: { type: "cow" | "buffalo"; session: "morning" | "evening"; rate?: Rate }) {
  const label = type === "cow" ? "Cow" : "Buffalo";
  const SessIcon = session === "morning" ? Sun : Moon;
  const colour = type === "cow"
    ? "bg-emerald-500/10 text-emerald-800 border-emerald-500/30"
    : "bg-violet-500/10 text-violet-800 border-violet-500/30";

  if (!rate) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/20 px-2.5 py-2 text-xs text-muted-foreground">
        <p className="flex items-center gap-1 font-medium"><Droplet className="h-3 w-3" /> {label} <SessIcon className="ml-auto h-3 w-3" /></p>
        <p className="mt-1 text-[10px]">No rate published</p>
      </div>
    );
  }
  return (
    <div className={`rounded-lg border px-2.5 py-2 ${colour}`}>
      <p className="flex items-center gap-1 text-xs font-medium">
        <Droplet className="h-3 w-3" /> {label}
        <SessIcon className="ml-auto h-3 w-3 opacity-70" />
      </p>
      <p className="mt-0.5 text-lg font-bold leading-tight">₹{Number(rate.price_per_litre).toFixed(2)}<span className="text-[10px] font-normal opacity-70">/L</span></p>
      <p className="text-[10px] opacity-80">FAT {rate.fat} · SNF {rate.snf}</p>
    </div>
  );
}
