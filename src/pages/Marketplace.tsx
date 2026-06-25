import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { telHref, waHref, formatIndianPhoneDisplay } from "@/lib/phone";
import {
  Search, ShoppingCart, Heart, Share2, MapPin, ShieldCheck, Star,
  IndianRupee, SlidersHorizontal, Plus, Wheat, Pill, Mic, Truck, Sparkles,
  Phone, MessageCircle, Eye, Loader2,
} from "lucide-react";

type Product = {
  id: string;
  seller_id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  unit: string | null;
  stock: number;
  image_url: string | null;
  created_at: string;
  seller_name?: string;
};

const CATEGORIES = [
  { id: "feed", label: "Cattle Feed", icon: Wheat },
];

const CATEGORY_MAP: Record<string, string[]> = {
  feed: ["feed", "cattle_feed", "fodder"],
};
const ALLOWED_CATEGORIES = [...CATEGORY_MAP.feed];

const SORTS = [
  { id: "newest", label: "Newest first" },
  { id: "price_asc", label: "Price: Lowest first" },
  { id: "price_desc", label: "Price: Highest first" },
  { id: "rating", label: "Top Rated" },
];

const FEED_TYPES = [
  "all", "Dry", "Green", "Silage", "Concentrate", "Mineral Mixture", "Pellet", "TMR", "Supplement",
];
const matchesFeedType = (p: Product, type: string) => {
  if (type === "all") return true;
  const hay = `${p.name} ${p.description || ""} ${p.category}`.toLowerCase();
  return hay.includes(type.toLowerCase());
};

const daysAgo = (iso: string) => {
  const d = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  if (d < 30) return `${d}d ago`;
  return `${Math.floor(d / 30)}mo ago`;
};

// Deterministic mock rating until reviews table exists for products
const ratingFor = (id: string) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return { stars: 3.5 + (h % 15) / 10, count: 12 + (h % 280) };
};
const brandFor = (p: Product) => (p.name.split(/\s|[-–|]/)[0] || "Generic").trim();

export default function Marketplace() {
  const { user } = useAuth();
  const { addItem, items: cartItems } = useCart();

  const [tab, setTab] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<string>("newest");
  const [location, setLocation] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [deliveryOnly, setDeliveryOnly] = useState(false);
  const [brand, setBrand] = useState<string>("all");
  const [feedType, setFeedType] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 20000]);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [listening, setListening] = useState(false);
  const recogRef = useRef<any>(null);
  const [detail, setDetail] = useState<Product | null>(null);
  const [contact, setContact] = useState<{ full_name: string | null; phone: string | null } | null>(null);
  const [contactLoading, setContactLoading] = useState(false);

  const openDetails = async (p: Product) => {
    setDetail(p);
    setContact(null);
    if (!user) return;
    setContactLoading(true);
    try {
      const { data } = await supabase.rpc("get_seller_contact", { _seller_id: p.seller_id } as any);
      const row = Array.isArray(data) ? data[0] : null;
      setContact(row ? { full_name: row.full_name ?? null, phone: row.phone ?? null } : { full_name: null, phone: null });
    } catch {
      setContact({ full_name: null, phone: null });
    } finally {
      setContactLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("products")
        .select("id,seller_id,name,description,category,price,unit,stock,image_url,created_at")
        .eq("approved", true)
        .in("category", ALLOWED_CATEGORIES)
        .gt("stock", 0)
        .order("created_at", { ascending: false })
        .limit(200);
      if (cancelled) return;
      const rows = (data || []) as Product[];
      const ids = Array.from(new Set(rows.map((r) => r.seller_id)));
      if (ids.length) {
        const { data: profs } = await supabase.rpc("get_display_names", { _ids: ids } as any);
        const map = new Map((profs || []).map((p: any) => [p.user_id, p.full_name]));
        rows.forEach((r) => (r.seller_name = map.get(r.seller_id) || ""));
      }
      setProducts(rows);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Local wishlist (products)
  useEffect(() => {
    try {
      const raw = localStorage.getItem("sdh_wishlist_products");
      if (raw) setWishlist(new Set(JSON.parse(raw)));
    } catch {}
  }, []);
  const persistWishlist = (next: Set<string>) => {
    setWishlist(new Set(next));
    localStorage.setItem("sdh_wishlist_products", JSON.stringify([...next]));
  };
  const toggleWishlist = (id: string) => {
    const next = new Set(wishlist);
    next.has(id) ? next.delete(id) : next.add(id);
    persistWishlist(next);
    toast.success(next.has(id) ? "Saved to wishlist" : "Removed from wishlist");
  };

  const brands = useMemo(() => {
    const s = new Set<string>();
    products.forEach((p) => s.add(brandFor(p)));
    return ["all", ...Array.from(s).sort()];
  }, [products]);

  const filtered = useMemo(() => {
    let list = products.slice();
    if (tab !== "all") {
      const cats = CATEGORY_MAP[tab] || [];
      list = list.filter((p) => cats.includes(p.category));
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((p) =>
        [p.name, p.description || "", p.category, p.seller_name || "", brandFor(p)]
          .join(" ").toLowerCase().includes(q)
      );
    }
    if (location.trim()) {
      // soft filter via seller name fallback; no per-product location column today
      const q = location.trim().toLowerCase();
      list = list.filter((p) => (p.description || "").toLowerCase().includes(q));
    }
    if (verifiedOnly) list = list.filter((p) => !!p.seller_name);
    if (deliveryOnly) list = list.filter((p) => (p.description || "").toLowerCase().includes("delivery"));
    if (brand !== "all") list = list.filter((p) => brandFor(p) === brand);
    if (feedType !== "all") list = list.filter((p) => matchesFeedType(p, feedType));
    list = list.filter((p) => Number(p.price) >= priceRange[0] && Number(p.price) <= priceRange[1]);

    if (sort === "price_asc") list.sort((a, b) => Number(a.price) - Number(b.price));
    else if (sort === "price_desc") list.sort((a, b) => Number(b.price) - Number(a.price));
    else if (sort === "rating") list.sort((a, b) => ratingFor(b.id).stars - ratingFor(a.id).stars);
    else list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return list;
  }, [products, tab, search, location, verifiedOnly, deliveryOnly, brand, feedType, priceRange, sort]);

  const cartCount = useMemo(() => cartItems.reduce((s, i) => s + i.quantity, 0), [cartItems]);

  const startVoiceSearch = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return toast.error("Voice search not supported on this browser");
    const r = new SR();
    r.lang = "en-IN";
    r.continuous = false;
    r.interimResults = false;
    r.onstart = () => setListening(true);
    r.onend = () => setListening(false);
    r.onerror = () => { setListening(false); toast.error("Could not hear you"); };
    r.onresult = (e: any) => {
      const t = e.results?.[0]?.[0]?.transcript || "";
      setSearch(t);
    };
    recogRef.current = r;
    r.start();
  };

  const shareProduct = async (p: Product) => {
    const url = `${window.location.origin}/marketplace#${p.id}`;
    try {
      if (navigator.share) await navigator.share({ title: p.name, url });
      else { await navigator.clipboard.writeText(url); toast.success("Link copied"); }
    } catch {}
  };

  const buyNow = (p: Product) => {
    addItem({
      id: p.id, name: p.name, price: Number(p.price), unit: p.unit || "unit",
      image_url: p.image_url || undefined, seller_id: p.seller_id,
    });
    window.location.href = "/cart";
  };

  const resetFilters = () => {
    setSearch(""); setLocation(""); setVerifiedOnly(false); setDeliveryOnly(false);
    setBrand("all"); setFeedType("all"); setPriceRange([0, 20000]); setSort("newest");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <section className="border-b bg-card">
        <div className="container py-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl font-bold md:text-4xl">Dairy Supplies Marketplace</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Cattle feed and veterinary medicines from verified sellers across India.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="outline">
                <Link to={user ? "/seller" : "/login"}><Plus className="mr-1.5 h-4 w-4" /> Add Product</Link>
              </Button>
              <Button asChild className="relative">
                <Link to="/cart">
                  <ShoppingCart className="mr-1.5 h-4 w-4" /> Cart
                  {cartCount > 0 && <Badge className="ml-2 h-5 min-w-5 rounded-full px-1.5 text-xs">{cartCount}</Badge>}
                </Link>
              </Button>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search feed, medicines, brands…" className="h-11 pl-9 pr-12" />
              <Button type="button" size="icon" variant={listening ? "default" : "ghost"}
                onClick={startVoiceSearch} aria-label="Voice search"
                className="absolute right-1 top-1/2 h-9 w-9 -translate-y-1/2">
                <Mic className={`h-4 w-4 ${listening ? "animate-pulse" : ""}`} />
              </Button>
            </div>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="h-11 w-[170px]"><SelectValue /></SelectTrigger>
              <SelectContent>{SORTS.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="h-11"><SlidersHorizontal className="mr-1.5 h-4 w-4" /> Filters</Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader><SheetTitle>Filters</SheetTitle></SheetHeader>
                <div className="mt-6 space-y-6">
                  <div>
                    <label className="text-sm font-medium">Location</label>
                    <Input className="mt-1.5" placeholder="District or state" value={location} onChange={(e) => setLocation(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Feed type</label>
                    <Select value={feedType} onValueChange={setFeedType}>
                      <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {FEED_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>{t === "all" ? "All feed types" : t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Brand</label>
                    <Select value={brand} onValueChange={setBrand}>
                      <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {brands.map((b) => <SelectItem key={b} value={b}>{b === "all" ? "All brands" : b}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm">
                      <label className="font-medium">Price range</label>
                      <span className="text-muted-foreground">₹{priceRange[0].toLocaleString()} – ₹{priceRange[1].toLocaleString()}</span>
                    </div>
                    <Slider className="mt-3" value={priceRange}
                      onValueChange={(v) => setPriceRange([v[0], v[1]] as [number, number])}
                      min={0} max={20000} step={100} />
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} className="h-4 w-4 rounded border-input" />
                    Verified sellers only
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={deliveryOnly} onChange={(e) => setDeliveryOnly(e.target.checked)} className="h-4 w-4 rounded border-input" />
                    Delivery available
                  </label>
                  <Button variant="outline" className="w-full" onClick={resetFilters}>Reset filters</Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </section>

      <div className="container py-8">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0">
            {CATEGORIES.map((c) => {
              const Icon = c.icon;
              return (
                <TabsTrigger key={c.id} value={c.id}
                  className="gap-2 rounded-full border bg-card px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Icon className="h-4 w-4" /> {c.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>

        <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
          <span>{loading ? "Loading…" : `${filtered.length} product${filtered.length === 1 ? "" : "s"}`}</span>
        </div>

        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <CardContent className="space-y-3 p-4">
                    <Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-1/2" /><Skeleton className="h-9 w-full" />
                  </CardContent>
                </Card>
              ))
            : filtered.map((p) => (
                <ProductCard key={p.id} p={p}
                  isFav={wishlist.has(p.id)}
                  onFav={() => toggleWishlist(p.id)}
                  onShare={() => shareProduct(p)}
                  onAdd={() => {
                    addItem({
                      id: p.id, name: p.name, price: Number(p.price), unit: p.unit || "unit",
                      image_url: p.image_url || undefined, seller_id: p.seller_id,
                    });
                    toast.success(`${p.name} added to cart`);
                  }}
                  onBuy={() => buyNow(p)}
                  onDetails={() => openDetails(p)}
                />
              ))}
        </div>

        {!loading && filtered.length === 0 && (
          <div className="mt-10 rounded-xl border bg-card p-8 text-center">
            <Sparkles className="mx-auto h-10 w-10 text-primary" />
            <h3 className="mt-3 font-serif text-2xl font-semibold">No products match your filters</h3>
            <p className="mt-1 text-sm text-muted-foreground">Try a different category or reset filters.</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Button onClick={resetFilters} variant="outline">Reset filters</Button>
              <Button asChild><Link to={user ? "/seller" : "/login"}><Plus className="mr-1.5 h-4 w-4" /> Add a product</Link></Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ProductCard({
  p, isFav, onFav, onShare, onAdd, onBuy,
}: {
  p: Product; isFav: boolean; onFav: () => void; onShare: () => void; onAdd: () => void; onBuy: () => void;
}) {
  const { stars, count } = ratingFor(p.id);
  const hasDelivery = (p.description || "").toLowerCase().includes("delivery");
  return (
    <Card className="group flex flex-col overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-xl">
      <div className="relative block aspect-[4/3] overflow-hidden bg-muted">
        {p.image_url ? (
          <img src={p.image_url} alt={p.name} loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <Sparkles className="h-10 w-10 opacity-40" />
          </div>
        )}
        <div className="absolute left-2 top-2 flex gap-1.5">
          <Badge variant="secondary" className="bg-background/90 capitalize">{p.category.replace(/_/g, " ")}</Badge>
          {p.seller_name && (
            <Badge className="gap-1 bg-emerald-600 text-white hover:bg-emerald-600">
              <ShieldCheck className="h-3 w-3" /> Verified
            </Badge>
          )}
        </div>
        <button type="button" onClick={onFav} aria-label="Save to wishlist"
          className="absolute right-2 top-2 rounded-full bg-background/90 p-2 backdrop-blur transition hover:bg-background">
          <Heart className={`h-4 w-4 ${isFav ? "fill-red-500 text-red-500" : "text-foreground"}`} />
        </button>
      </div>

      <CardContent className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="line-clamp-1 font-medium">{p.name}</p>
          <button type="button" onClick={onShare} aria-label="Share"
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
            <Share2 className="h-4 w-4" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground">Brand · {brandFor(p)}</p>

        <div className="flex items-baseline gap-1 text-primary">
          <IndianRupee className="h-4 w-4" />
          <span className="text-xl font-bold">{Number(p.price).toLocaleString("en-IN")}</span>
          {p.unit && <span className="text-xs text-muted-foreground">/ {p.unit}</span>}
        </div>

        <div className="flex items-center gap-1 text-amber-500 text-xs">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={`h-3.5 w-3.5 ${i < Math.round(stars) ? "fill-amber-500" : ""}`} />
          ))}
          <span className="ml-1 text-muted-foreground">{stars.toFixed(1)} ({count})</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Across India</span>
          {hasDelivery && (
            <span className="flex items-center gap-1 text-emerald-700">
              <Truck className="h-3 w-3" /> Delivery
            </span>
          )}
        </div>

        <div className="mt-auto grid grid-cols-2 gap-2 pt-2">
          <Button size="sm" variant="outline" className="gap-1.5" onClick={onAdd}>
            <ShoppingCart className="h-3.5 w-3.5" /> Add
          </Button>
          <Button size="sm" className="gap-1.5" onClick={onBuy}>Buy Now</Button>
        </div>
        <p className="text-[10px] text-muted-foreground">{daysAgo(p.created_at)} · {p.seller_name || "Seller"}</p>
      </CardContent>
    </Card>
  );
}
