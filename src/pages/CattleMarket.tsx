import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, MapPin, IndianRupee, Plus, Search, MessageCircle, Heart, ImageOff, Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { telHref, waHref } from "@/lib/phone";

type Listing = any & { seller_name?: string };

const INDIAN_STATES = [
  "All States","Andhra Pradesh","Telangana","Karnataka","Tamil Nadu","Kerala","Maharashtra",
  "Gujarat","Madhya Pradesh","Rajasthan","Uttar Pradesh","Bihar","Punjab","Haryana","West Bengal","Odisha",
];

const ANIMALS = [
  { id: "all", label: "All Animals", emoji: "🐾" },
  { id: "cow", label: "Cow", emoji: "🐄" },
  { id: "buffalo", label: "Buffalo", emoji: "🐃" },
  { id: "hen", label: "Hen", emoji: "🐔" },
  { id: "rooster", label: "Cock", emoji: "🐓" },
];
const ALLOWED = ["cow", "buffalo", "hen", "rooster"];

const animalEmoji = (t: string) => ANIMALS.find((a) => a.id === t)?.emoji ?? "🐾";

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

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      let q = supabase.from("cattle_listings").select("*")
        .eq("status", "active").eq("listing_type", "sell")
        .in("type", ALLOWED);
      if (animal !== "all") q = q.eq("type", animal);
      if (stateFilter !== "All States") q = q.eq("state", stateFilter);
      if (districtFilter.trim()) q = q.ilike("district", `%${districtFilter.trim()}%`);
      if (breedFilter.trim()) q = q.ilike("breed", `%${breedFilter.trim()}%`);
      if (minPrice) q = q.gte("price", Number(minPrice));
      if (maxPrice) q = q.lte("price", Number(maxPrice));
      if (search.trim()) q = q.or(`name.ilike.%${search.trim()}%,breed.ilike.%${search.trim()}%`);
      const { data, error } = await q.order("created_at", { ascending: false }).limit(60);
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

  const resultLabel = useMemo(() => `${listings.length} listing${listings.length === 1 ? "" : "s"}`, [listings.length]);

  return (
    <div className="container py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Livestock Marketplace</h1>
          <p className="mt-1 text-muted-foreground">Buy and sell cows, buffaloes, hens and cocks from verified farmers.</p>
        </div>
        <div className="flex gap-2">
          {user && <Button asChild variant="outline" className="gap-2"><Link to="/my-listings"><Heart className="h-4 w-4" /> My Listings</Link></Button>}
          <Button asChild className="gap-2"><Link to={user ? "/cattle-market/new" : "/login"}><Plus className="h-4 w-4" /> Sell Animal</Link></Button>
        </div>
      </div>

      {/* Animal pill selector */}
      <div className="mt-6 flex flex-wrap gap-2">
        {ANIMALS.map((a) => (
          <button key={a.id} onClick={() => setAnimal(a.id)}
            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
              animal === a.id ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted"
            }`}>
            <span className="text-base">{a.emoji}</span> {a.label}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative sm:col-span-2 lg:col-span-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by name or breed…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={stateFilter} onValueChange={setStateFilter}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{INDIAN_STATES.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent>
        </Select>
        <Input placeholder="District" value={districtFilter} onChange={(e) => setDistrictFilter(e.target.value)} />
        <Input placeholder="Breed (e.g. HF, Murrah)" value={breedFilter} onChange={(e) => setBreedFilter(e.target.value)} />
        <Input type="number" placeholder="Min price ₹" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
        <Input type="number" placeholder="Max price ₹" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
      </div>

      <p className="mt-4 text-sm text-muted-foreground">{loading ? "Loading…" : resultLabel}</p>

      <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {!loading && listings.length === 0 && (
          <p className="col-span-full text-center text-muted-foreground py-12">No listings match your filters.</p>
        )}
        {listings.map((c) => {
          const cover = c.photos?.[0] || c.image_url;
          const photoCount = c.photos?.length || (c.image_url ? 1 : 0);
          const loc = [c.village, c.district, c.state].filter(Boolean).join(", ");
          const favd = favs.has(c.id);
          const a = c.attrs || {};

          // Animal-specific detail lines for cards
          let line2 = "";
          if (c.type === "cow") {
            const bits = [c.breed, c.age, c.milk_yield && `${c.milk_yield} L/day`, a.fat && `FAT ${a.fat}`].filter(Boolean);
            line2 = bits.join(" • ");
          } else if (c.type === "buffalo") {
            const bits = [c.breed, c.age, c.milk_yield && `${c.milk_yield} L/day`].filter(Boolean);
            line2 = bits.join(" • ");
          } else if (c.type === "hen") {
            const bits = [c.breed, a.egg_laying === "yes" && `${a.eggs_per_week || "?"} eggs/wk`, c.quantity && `Qty ${c.quantity}`].filter(Boolean);
            line2 = bits.join(" • ");
          } else if (c.type === "rooster") {
            const bits = [c.breed, c.age, c.weight && `${c.weight} kg`, c.quantity && `Qty ${c.quantity}`].filter(Boolean);
            line2 = bits.join(" • ");
          }

          return (
            <Card key={c.id} className="overflow-hidden transition-shadow hover:shadow-lg">
              <Link to={`/cattle-market/${c.id}`} className="relative block aspect-[4/3] bg-muted">
                {cover ? (
                  <img src={cover} alt={c.name} loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-6xl">{animalEmoji(c.type)}</div>
                )}
                <div className="absolute left-2 top-2 flex gap-1">
                  <Badge className="gap-1 bg-background/90 text-foreground hover:bg-background/90">
                    <span>{animalEmoji(c.type)}</span> <span className="capitalize">{c.type}</span>
                  </Badge>
                  {photoCount > 1 && <Badge variant="secondary" className="bg-background/90">+{photoCount - 1}</Badge>}
                  {c.video_url && <Badge variant="secondary" className="gap-1 bg-background/90"><Video className="h-3 w-3" /> Video</Badge>}
                </div>
                <button type="button" onClick={(e) => { e.preventDefault(); toggleFav(c.id); }}
                  aria-label={favd ? "Remove favorite" : "Save favorite"}
                  className="absolute right-2 top-2 rounded-full bg-background/90 p-2 transition hover:bg-background">
                  <Heart className={`h-4 w-4 ${favd ? "fill-primary text-primary" : "text-foreground"}`} />
                </button>
              </Link>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <Link to={`/cattle-market/${c.id}`} className="font-semibold leading-tight hover:underline">{c.name}</Link>
                  {c.negotiable && <Badge variant="outline" className="shrink-0">Negotiable</Badge>}
                </div>
                {line2 && <p className="text-sm text-muted-foreground">{line2}</p>}
                <div className="flex items-center text-lg font-bold text-primary">
                  <IndianRupee className="h-4 w-4" />{Number(c.price).toLocaleString("en-IN")}
                </div>
                {loc && <div className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3 shrink-0" /> {loc}</div>}
                {c.contact_phone && (
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Button size="sm" variant="outline" className="gap-1.5" asChild>
                      <a href={telHref(c.contact_phone)} onClick={(e) => e.stopPropagation()} aria-label={`Call seller of ${c.name}`}>
                        <Phone className="h-3.5 w-3.5" /> Call
                      </a>
                    </Button>
                    <Button size="sm" className="gap-1.5 bg-[#25D366] text-white hover:bg-[#1ebe5b]" asChild>
                      <a target="_blank" rel="noopener noreferrer"
                        href={waHref(c.whatsapp_phone || c.contact_phone, `Hello, I'm interested in your ${c.breed || c.type} (${c.name}) on Smart Dairy Hub.`)}
                        onClick={(e) => e.stopPropagation()}>
                        <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                      </a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
