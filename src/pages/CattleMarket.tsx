import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Phone, MapPin, IndianRupee, Plus, Search, MessageCircle, Heart, Video,
  Sparkles, SlidersHorizontal, ShieldCheck, Droplets, Calendar, X, Star, TrendingUp,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { telHref, waHref } from "@/lib/phone";

type Listing = any & { seller_name?: string };

const INDIAN_STATES = [
  "All States", "Andhra Pradesh", "Telangana", "Karnataka", "Tamil Nadu", "Kerala", "Maharashtra",
  "Gujarat", "Madhya Pradesh", "Rajasthan", "Uttar Pradesh", "Bihar", "Punjab", "Haryana", "West Bengal", "Odisha",
];

const ANIMALS = [
  { id: "all", label: "All", emoji: "🐾" },
  { id: "cow", label: "Cows", emoji: "🐄" },
  { id: "buffalo", label: "Buffalo", emoji: "🐃" },
  { id: "hen", label: "Hens", emoji: "🐔" },
  { id: "rooster", label: "Roosters", emoji: "🐓" },
];
const ALLOWED = ["cow", "buffalo", "hen", "rooster"];

// Short breed/keyword chips — must match values that actually appear in
// listing `name` or `breed` columns, since the query does an ILIKE substring
// match on the raw string.
const AI_SUGGESTIONS = [
  "Gir",
  "Murrah",
  "HF",
  "Sahiwal",
];

const animalEmoji = (t: string) => ANIMALS.find((a) => a.id === t)?.emoji ?? "🐾";

// Health scoring — a light heuristic on attrs
function healthScore(c: any): number {
  let s = 60;
  if (c.attrs?.vaccinated || c.vaccinated) s += 15;
  if (c.attrs?.dewormed) s += 5;
  if (c.milk_yield && Number(c.milk_yield) > 10) s += 10;
  if (c.attrs?.fat && Number(c.attrs.fat) > 4) s += 5;
  if (c.age && /^[0-4]/.test(String(c.age))) s += 5;
  return Math.min(99, s);
}

function parseAgeYears(age: any): number | null {
  if (!age) return null;
  const m = String(age).match(/(\d+(?:\.\d+)?)/);
  return m ? Number(m[1]) : null;
}

// ---------- Skeleton ----------
function CardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-3xl border border-border bg-card">
      <div className="aspect-[4/3] bg-muted" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-2/3 rounded bg-muted" />
        <div className="h-3 w-1/2 rounded bg-muted" />
        <div className="h-6 w-1/3 rounded bg-muted" />
      </div>
    </div>
  );
}

// ---------- Page ----------
export default function CattleMarket() {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [favs, setFavs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [animal, setAnimal] = useState("all");
  const [stateFilter, setStateFilter] = useState("All States");
  const [districtFilter, setDistrictFilter] = useState("");
  const [breedFilter, setBreedFilter] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [ageRange, setAgeRange] = useState("any"); // any | young | prime | mature
  const [minYield, setMinYield] = useState("any"); // any | 8 | 12 | 18
  const [vaccinatedOnly, setVaccinatedOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState("recent"); // recent | price-asc | price-desc | yield-desc | health-desc

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      let q = supabase.from("cattle_listings_public" as any).select("*")
        .eq("status", "active").eq("listing_type", "sell")
        .in("type", ALLOWED);
      if (animal !== "all") q = q.eq("type", animal);
      if (stateFilter !== "All States") q = q.eq("state", stateFilter);
      if (districtFilter.trim()) q = q.ilike("district", `%${districtFilter.trim()}%`);
      if (breedFilter.trim()) q = q.ilike("breed", `%${breedFilter.trim()}%`);
      if (minPrice) q = q.gte("price", Number(minPrice));
      if (maxPrice) q = q.lte("price", Number(maxPrice));
      if (search.trim()) q = q.or(`name.ilike.%${search.trim()}%,breed.ilike.%${search.trim()}%`);
      const { data, error } = await q.order("created_at", { ascending: false }).limit(80);
      if (error) { toast.error(error.message); setListings([]); setLoading(false); return; }
      const rows = (data as any[]) || [];
      const ids = Array.from(new Set(rows.map((r) => r.seller_id)));
      if (ids.length) {
        const { data: profs } = await supabase.rpc("get_display_names", { _ids: ids } as any);
        const map = new Map((profs || []).map((p: any) => [p.user_id, p.full_name]));
        rows.forEach((r) => { r.seller_name = map.get(r.seller_id) || "Verified Seller"; });
      }
      setListings(rows);
      setLoading(false);
    };
    fetchListings();
  }, [animal, stateFilter, districtFilter, breedFilter, minPrice, maxPrice, search]);

  useEffect(() => {
    if (!user) { setFavs(new Set()); return; }
    supabase.from("cattle_favorites" as any).select("listing_id").eq("user_id", user.id)
      .then(({ data }) => setFavs(new Set(((data as any[]) || []).map((r) => r.listing_id))));
  }, [user]);

  const toggleFav = async (listingId: string) => {
    if (!user) { toast.error("Please log in to save favorites"); return; }
    if (favs.has(listingId)) {
      await supabase.from("cattle_favorites" as any).delete().eq("user_id", user.id).eq("listing_id", listingId);
      const n = new Set(favs); n.delete(listingId); setFavs(n);
    } else {
      const { error } = await supabase.from("cattle_favorites" as any).insert({ user_id: user.id, listing_id: listingId });
      if (error) toast.error(error.message); else setFavs(new Set(favs).add(listingId));
    }
  };

  // Client-side refinement (age/yield/vaccinated/verified + sort)
  const filtered = useMemo(() => {
    let rows = [...listings];
    if (ageRange !== "any") {
      rows = rows.filter((r) => {
        const yrs = parseAgeYears(r.age);
        if (yrs == null) return true;
        if (ageRange === "young") return yrs < 3;
        if (ageRange === "prime") return yrs >= 3 && yrs <= 6;
        return yrs > 6;
      });
    }
    if (minYield !== "any") {
      const n = Number(minYield);
      rows = rows.filter((r) => Number(r.milk_yield || 0) >= n);
    }
    if (vaccinatedOnly) rows = rows.filter((r) => r.attrs?.vaccinated || r.vaccinated);
    if (verifiedOnly) rows = rows.filter((r) => r.attrs?.verified || r.verified);
    if (sortBy === "price-asc") rows.sort((a, b) => Number(a.price) - Number(b.price));
    else if (sortBy === "price-desc") rows.sort((a, b) => Number(b.price) - Number(a.price));
    else if (sortBy === "yield-desc") rows.sort((a, b) => Number(b.milk_yield || 0) - Number(a.milk_yield || 0));
    else if (sortBy === "health-desc") rows.sort((a, b) => healthScore(b) - healthScore(a));
    return rows;
  }, [listings, ageRange, minYield, vaccinatedOnly, verifiedOnly, sortBy]);

  const activeCount =
    (stateFilter !== "All States" ? 1 : 0) + (districtFilter ? 1 : 0) + (breedFilter ? 1 : 0) +
    (minPrice ? 1 : 0) + (maxPrice ? 1 : 0) + (ageRange !== "any" ? 1 : 0) +
    (minYield !== "any" ? 1 : 0) + (vaccinatedOnly ? 1 : 0) + (verifiedOnly ? 1 : 0);

  const clearAll = () => {
    setStateFilter("All States"); setDistrictFilter(""); setBreedFilter("");
    setMinPrice(""); setMaxPrice(""); setAgeRange("any"); setMinYield("any");
    setVaccinatedOnly(false); setVerifiedOnly(false);
  };

  // Filter panel shared by desktop sidebar and mobile sheet
  const FilterPanel = (
    <div className="space-y-6">
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">Location</label>
        <Select value={stateFilter} onValueChange={setStateFilter}>
          <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
          <SelectContent>{INDIAN_STATES.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent>
        </Select>
        <Input placeholder="District" value={districtFilter} onChange={(e) => setDistrictFilter(e.target.value)} className="mt-2 rounded-xl" />
      </div>

      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">Breed</label>
        <Input placeholder="e.g. Gir, Murrah, HF" value={breedFilter} onChange={(e) => setBreedFilter(e.target.value)} className="rounded-xl" />
      </div>

      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">Age</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: "any", label: "Any" },
            { id: "young", label: "Under 3y" },
            { id: "prime", label: "3–6y" },
            { id: "mature", label: "6y+" },
          ].map((o) => (
            <button key={o.id} onClick={() => setAgeRange(o.id)}
              className={`rounded-xl border px-3 py-2 text-sm transition ${
                ageRange === o.id ? "border-primary bg-primary/10 text-primary font-semibold" : "border-border hover:bg-muted"
              }`}>{o.label}</button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">Min Milk Yield</label>
        <div className="grid grid-cols-4 gap-2">
          {[
            { id: "any", label: "Any" },
            { id: "8", label: "8L+" },
            { id: "12", label: "12L+" },
            { id: "18", label: "18L+" },
          ].map((o) => (
            <button key={o.id} onClick={() => setMinYield(o.id)}
              className={`rounded-xl border px-2 py-2 text-sm transition ${
                minYield === o.id ? "border-primary bg-primary/10 text-primary font-semibold" : "border-border hover:bg-muted"
              }`}>{o.label}</button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">Price (₹)</label>
        <div className="grid grid-cols-2 gap-2">
          <Input type="number" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="rounded-xl" />
          <Input type="number" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="rounded-xl" />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">Health & Trust</label>
        <div className="space-y-2">
          <button onClick={() => setVaccinatedOnly(!vaccinatedOnly)}
            className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-sm transition ${
              vaccinatedOnly ? "border-primary bg-primary/10 text-primary font-semibold" : "border-border hover:bg-muted"
            }`}>
            <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Vaccinated only</span>
            <span className={`h-4 w-4 rounded-full ${vaccinatedOnly ? "bg-primary" : "bg-muted"}`} />
          </button>
          <button onClick={() => setVerifiedOnly(!verifiedOnly)}
            className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-sm transition ${
              verifiedOnly ? "border-primary bg-primary/10 text-primary font-semibold" : "border-border hover:bg-muted"
            }`}>
            <span className="flex items-center gap-2"><Star className="h-4 w-4" /> Verified sellers</span>
            <span className={`h-4 w-4 rounded-full ${verifiedOnly ? "bg-primary" : "bg-muted"}`} />
          </button>
        </div>
      </div>

      {activeCount > 0 && (
        <Button variant="outline" className="w-full rounded-xl" onClick={clearAll}>
          <X className="mr-2 h-4 w-4" /> Clear {activeCount} filter{activeCount === 1 ? "" : "s"}
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-mint">
      {/* ============= HERO / AI SEARCH ============= */}
      <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-accent/15 blur-3xl" />

        <div className="container relative mx-auto px-5 py-12 sm:py-16">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
                <Sparkles className="h-3 w-3" /> AI-powered marketplace
              </span>
              <h1 className="mt-4 font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl">
                India's smartest <span className="text-gradient">livestock marketplace</span>
              </h1>
              <p className="mt-3 max-w-xl text-base text-muted-foreground sm:text-lg">
                Discover verified cows, buffaloes and poultry with AI health scores, real seller data, and instant contact.
              </p>
            </div>
            <div className="flex gap-2">
              {user && (
                <Button asChild variant="outline" className="rounded-full">
                  <Link to="/my-listings"><Heart className="mr-2 h-4 w-4" /> My Listings</Link>
                </Button>
              )}
              <Button asChild className="rounded-full shadow-glow">
                <Link to={user ? "/cattle-market/new" : "/login"}><Plus className="mr-2 h-4 w-4" /> Sell Animal</Link>
              </Button>
            </div>
          </div>

          {/* AI Search bar */}
          <div className="mt-8 rounded-2xl border border-border/60 bg-card/80 p-2 shadow-lift backdrop-blur-md">
            <div className="flex items-center gap-2">
              <div className="pl-3 text-primary"><Sparkles className="h-5 w-5" /></div>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Ask AI: 'Show me high-yield Gir cows under ₹1.5L near Anand'"
                className="h-12 border-0 bg-transparent text-base shadow-none focus-visible:ring-0"
              />
              <Button className="h-10 rounded-xl px-5">
                <Search className="mr-2 h-4 w-4" /> Search
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 px-2 pb-1 pt-2">
              {AI_SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => setSearch(s)}
                  className="rounded-full border border-border bg-background/60 px-3 py-1 text-xs text-muted-foreground transition hover:border-primary hover:text-primary">
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Animal pills */}
          <div className="mt-6 flex flex-wrap gap-2">
            {ANIMALS.map((a) => (
              <button key={a.id} onClick={() => setAnimal(a.id)}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                  animal === a.id
                    ? "border-primary bg-primary text-primary-foreground shadow-glow"
                    : "border-border bg-card hover:border-primary/40 hover:bg-muted"
                }`}>
                <span className="text-base">{a.emoji}</span> {a.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ============= MAIN GRID ============= */}
      <section className="container mx-auto px-5 py-8 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-3xl border border-border bg-card p-6 shadow-soft">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="font-display text-lg font-bold">Filters</h2>
                {activeCount > 0 && <Badge variant="secondary">{activeCount} active</Badge>}
              </div>
              {FilterPanel}
            </div>
          </aside>

          {/* Results column */}
          <div>
            {/* Results toolbar */}
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground">
                {loading ? "Searching…" : (
                  <>
                    <span className="font-semibold text-foreground">{filtered.length}</span> listing{filtered.length === 1 ? "" : "s"}
                    {search && <> for "<span className="font-medium text-foreground">{search}</span>"</>}
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="rounded-full lg:hidden">
                      <SlidersHorizontal className="mr-2 h-4 w-4" /> Filters
                      {activeCount > 0 && <Badge className="ml-2 h-5 min-w-5 rounded-full px-1.5 text-xs">{activeCount}</Badge>}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-full overflow-y-auto sm:max-w-md">
                    <SheetHeader><SheetTitle>Refine your search</SheetTitle></SheetHeader>
                    <div className="mt-6">{FilterPanel}</div>
                  </SheetContent>
                </Sheet>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-9 w-[180px] rounded-full text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Newest first</SelectItem>
                    <SelectItem value="price-asc">Price: Low to High</SelectItem>
                    <SelectItem value="price-desc">Price: High to Low</SelectItem>
                    <SelectItem value="yield-desc">Highest milk yield</SelectItem>
                    <SelectItem value="health-desc">Best health score</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Grid */}
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {loading && Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}

              {!loading && filtered.length === 0 && (
                <div className="col-span-full rounded-3xl border border-dashed border-border bg-card/50 py-16 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Search className="h-6 w-6" />
                  </div>
                  <p className="font-semibold">No listings match your filters</p>
                  <p className="mt-1 text-sm text-muted-foreground">Try clearing filters or broadening your search.</p>
                  {activeCount > 0 && (
                    <Button variant="outline" className="mt-4 rounded-full" onClick={clearAll}>Clear filters</Button>
                  )}
                </div>
              )}

              {!loading && filtered.map((c) => {
                const cover = c.photos?.[0] || c.image_url;
                const photoCount = c.photos?.length || (c.image_url ? 1 : 0);
                const loc = [c.district, c.state].filter(Boolean).join(", ");
                const favd = favs.has(c.id);
                const a = c.attrs || {};
                const health = healthScore(c);
                const isVaccinated = a.vaccinated || c.vaccinated;

                // Type-specific detail line
                let line2 = "";
                if (c.type === "cow" || c.type === "buffalo") {
                  line2 = [c.breed, c.age, c.milk_yield && `${c.milk_yield} L/day`].filter(Boolean).join(" • ");
                } else if (c.type === "hen") {
                  line2 = [c.breed, a.egg_laying === "yes" && `${a.eggs_per_week || "?"} eggs/wk`, c.quantity && `Qty ${c.quantity}`].filter(Boolean).join(" • ");
                } else if (c.type === "rooster") {
                  line2 = [c.breed, c.age, c.weight && `${c.weight} kg`].filter(Boolean).join(" • ");
                }

                return (
                  <article key={c.id}
                    className="group relative overflow-hidden rounded-3xl border border-border bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lift">
                    <Link to={`/cattle-market/${c.id}`} className="relative block aspect-[4/3] overflow-hidden bg-muted">
                      {cover ? (
                        <img src={cover} alt={c.name} loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-7xl">{animalEmoji(c.type)}</div>
                      )}
                      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/50 to-transparent" />
                      {/* Top-left badges */}
                      <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                        <Badge className="border-0 bg-white/95 text-xs font-semibold text-foreground shadow-soft backdrop-blur">
                          {animalEmoji(c.type)} <span className="ml-1 capitalize">{c.type}</span>
                        </Badge>
                        {isVaccinated && (
                          <Badge className="gap-1 border-0 bg-primary text-primary-foreground shadow-soft">
                            <ShieldCheck className="h-3 w-3" /> Vaccinated
                          </Badge>
                        )}
                      </div>
                      {/* Top-right favorite */}
                      <button type="button" onClick={(e) => { e.preventDefault(); toggleFav(c.id); }}
                        aria-label={favd ? "Remove favorite" : "Save favorite"}
                        className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-soft backdrop-blur transition hover:scale-110">
                        <Heart className={`h-4 w-4 ${favd ? "fill-destructive text-destructive" : "text-foreground"}`} />
                      </button>
                      {/* Bottom badges */}
                      <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
                        {photoCount > 1 && (
                          <Badge variant="secondary" className="border-0 bg-black/60 text-xs text-white backdrop-blur">
                            +{photoCount - 1} photos
                          </Badge>
                        )}
                        {c.video_url && (
                          <Badge variant="secondary" className="gap-1 border-0 bg-black/60 text-xs text-white backdrop-blur">
                            <Video className="h-3 w-3" /> Video
                          </Badge>
                        )}
                      </div>
                      {/* Health score chip */}
                      <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold shadow-soft backdrop-blur">
                        <span className={`h-2 w-2 rounded-full ${health >= 85 ? "bg-primary" : health >= 70 ? "bg-warning" : "bg-muted-foreground"}`} />
                        <span>{health}</span>
                        <span className="text-muted-foreground">health</span>
                      </div>
                    </Link>

                    <div className="space-y-3 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <Link to={`/cattle-market/${c.id}`} className="font-display text-lg font-bold leading-tight hover:text-primary">
                          {c.name || c.breed || "Livestock"}
                        </Link>
                        {c.negotiable && (
                          <Badge variant="outline" className="shrink-0 border-accent/30 text-accent">Negotiable</Badge>
                        )}
                      </div>

                      {line2 && <p className="text-sm text-muted-foreground">{line2}</p>}

                      {/* Meta chips */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {c.milk_yield && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                            <Droplets className="h-3 w-3" /> {c.milk_yield}L
                          </span>
                        )}
                        {c.age && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                            <Calendar className="h-3 w-3" /> {c.age}
                          </span>
                        )}
                        {a.pregnant && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                            <TrendingUp className="h-3 w-3" /> Pregnant
                          </span>
                        )}
                      </div>

                      <div className="flex items-end justify-between pt-1">
                        <div>
                          <div className="flex items-center font-display text-2xl font-bold text-foreground">
                            <IndianRupee className="h-5 w-5" />
                            {Number(c.price).toLocaleString("en-IN")}
                          </div>
                          {loc && (
                            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3 shrink-0" /> {loc}
                            </div>
                          )}
                        </div>
                      </div>

                      {c.contact_phone && (
                        <div className="grid grid-cols-2 gap-2 pt-2">
                          <Button size="sm" variant="outline" className="gap-1.5 rounded-full" asChild>
                            <a href={telHref(c.contact_phone)} onClick={(e) => e.stopPropagation()} aria-label={`Call seller of ${c.name}`}>
                              <Phone className="h-3.5 w-3.5" /> Call
                            </a>
                          </Button>
                          <Button size="sm" className="gap-1.5 rounded-full bg-[#25D366] text-white hover:bg-[#1ebe5b]" asChild>
                            <a target="_blank" rel="noopener noreferrer"
                              href={waHref(c.whatsapp_phone || c.contact_phone, `Hello, I'm interested in your ${c.breed || c.type} (${c.name}) on Smart Dairy Hub.`)}
                              onClick={(e) => e.stopPropagation()}>
                              <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                            </a>
                          </Button>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
