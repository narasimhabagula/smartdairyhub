import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, MapPin, Clock, Search, Factory, TrendingDown, TrendingUp, Droplet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { telHref } from "@/lib/phone";

type Company = {
  id: string;
  name: string;
  logo_url: string | null;
  district: string | null;
  state: string | null;
  phone: string | null;
  working_hours: string | null;
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
  cow?: Rate;
  buffalo?: Rate;
};

export default function MilkRates() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [rates, setRates] = useState<Rate[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [district, setDistrict] = useState<string>("all");
  const [state, setState] = useState<string>("all");
  const [sort, setSort] = useState<"high" | "low" | "recent">("recent");

  const load = async () => {
    setLoading(true);
    const [{ data: c }, { data: r }] = await Promise.all([
      supabase.from("dairy_companies").select("id,name,logo_url,district,state,phone,working_hours"),
      supabase.from("milk_rates").select("id,company_id,milk_type,fat,snf,price_per_litre,effective_date,collection_timing,updated_at").order("effective_date", { ascending: false }).order("updated_at", { ascending: false }),
    ]);
    setCompanies((c as Company[]) ?? []);
    setRates((r as Rate[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase.channel("milk-rates-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "milk_rates" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const districts = useMemo(() => Array.from(new Set(companies.map((c) => c.district).filter(Boolean))) as string[], [companies]);
  const states = useMemo(() => Array.from(new Set(companies.map((c) => c.state).filter(Boolean))) as string[], [companies]);

  const rows: Row[] = useMemo(() => {
    return companies.map((c) => {
      const latest = (type: "cow" | "buffalo") => rates.find((r) => r.company_id === c.id && r.milk_type === type);
      return { company: c, cow: latest("cow"), buffalo: latest("buffalo") };
    });
  }, [companies, rates]);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    let list = rows.filter((row) => {
      if (district !== "all" && row.company.district !== district) return false;
      if (state !== "all" && row.company.state !== state) return false;
      if (ql) {
        const blob = `${row.company.name} ${row.company.district ?? ""} ${row.company.state ?? ""}`.toLowerCase();
        if (!blob.includes(ql)) return false;
      }
      return true;
    });
    const topPrice = (r: Row) => Math.max(r.cow?.price_per_litre ?? 0, r.buffalo?.price_per_litre ?? 0);
    if (sort === "high") list = [...list].sort((a, b) => topPrice(b) - topPrice(a));
    else if (sort === "low") list = [...list].sort((a, b) => topPrice(a) - topPrice(b));
    else list = [...list].sort((a, b) => {
      const da = Math.max(new Date(a.cow?.updated_at ?? 0).getTime(), new Date(a.buffalo?.updated_at ?? 0).getTime());
      const db = Math.max(new Date(b.cow?.updated_at ?? 0).getTime(), new Date(b.buffalo?.updated_at ?? 0).getTime());
      return db - da;
    });
    return list;
  }, [rows, q, district, state, sort]);

  return (
    <div className="container py-8">
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-bold">Today's Milk Rates</h1>
          <p className="mt-1 text-sm text-muted-foreground">Compare live procurement rates from dairy companies across districts.</p>
        </div>
        <Link to="/industry">
          <Button variant="outline" className="gap-2"><Factory className="h-4 w-4" /> Industry panel</Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="grid gap-3 p-4 md:grid-cols-5">
          <div className="relative md:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search company, district…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
          </div>
          <Select value={district} onValueChange={setDistrict}>
            <SelectTrigger><SelectValue placeholder="District" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All districts</SelectItem>
              {districts.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={state} onValueChange={setState}>
            <SelectTrigger><SelectValue placeholder="State" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All states</SelectItem>
              {states.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Recently updated</SelectItem>
              <SelectItem value="high"><span className="inline-flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5" /> Highest price</span></SelectItem>
              <SelectItem value="low"><span className="inline-flex items-center gap-1"><TrendingDown className="h-3.5 w-3.5" /> Lowest price</span></SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {loading ? (
        <p className="text-center text-muted-foreground">Loading…</p>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">No dairy companies match your filters yet.</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((row) => <RateCard key={row.company.id} row={row} />)}
        </div>
      )}
    </div>
  );
}

function RateCard({ row }: { row: Row }) {
  const { company, cow, buffalo } = row;
  const updated = Math.max(new Date(cow?.updated_at ?? 0).getTime(), new Date(buffalo?.updated_at ?? 0).getTime());

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <CardHeader className="bg-muted/30 pb-3">
        <div className="flex items-start gap-3">
          {company.logo_url ? (
            <img src={company.logo_url} alt={`${company.name} logo`} className="h-12 w-12 rounded-md object-cover" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/15 text-primary">
              <Factory className="h-6 w-6" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate text-base">{company.name}</CardTitle>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {[company.district, company.state].filter(Boolean).join(", ") || "Location not set"}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        <RatePill type="cow" rate={cow} />
        <RatePill type="buffalo" rate={buffalo} />

        <div className="flex flex-wrap gap-3 pt-2 text-xs text-muted-foreground">
          {company.working_hours && <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{company.working_hours}</span>}
          {updated > 0 && <span>Updated {new Date(updated).toLocaleString()}</span>}
        </div>

        {company.phone && (
          <a href={telHref(company.phone) || "#"} className="block">
            <Button className="w-full gap-2"><Phone className="h-4 w-4" /> Call {company.phone}</Button>
          </a>
        )}
      </CardContent>
    </Card>
  );
}

function RatePill({ type, rate }: { type: "cow" | "buffalo"; rate?: Rate }) {
  const label = type === "cow" ? "Cow Milk" : "Buffalo Milk";
  const colour = type === "cow" ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30" : "bg-violet-500/10 text-violet-700 border-violet-500/30";
  if (!rate) {
    return (
      <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2.5 text-sm">
        <span className="inline-flex items-center gap-2 text-muted-foreground"><Droplet className="h-4 w-4" /> {label}</span>
        <span className="text-xs text-muted-foreground">Not published</span>
      </div>
    );
  }
  return (
    <div className={`flex items-center justify-between rounded-lg border px-3 py-2.5 ${colour}`}>
      <div>
        <p className="inline-flex items-center gap-2 text-sm font-semibold"><Droplet className="h-4 w-4" /> {label}</p>
        <p className="mt-0.5 text-[11px] opacity-80">FAT {rate.fat}% · SNF {rate.snf}%{rate.collection_timing ? ` · ${rate.collection_timing}` : ""}</p>
      </div>
      <div className="text-right">
        <p className="text-xl font-bold leading-none">₹{Number(rate.price_per_litre).toFixed(2)}</p>
        <p className="text-[10px] opacity-80">per litre</p>
      </div>
    </div>
  );
}
