import { useEffect, useMemo, useState } from "react";
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
import { toast } from "sonner";
import {
  Search, ShoppingCart, Heart, Share2, MapPin, ShieldCheck, Star,
  IndianRupee, SlidersHorizontal, Plus, Beef, Wheat, Pill, Milk, Tractor, FlaskConical, Sparkles,
} from "lucide-react";

type ProductRow = {
  kind: "product";
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
};

type CattleRow = {
  kind: "cattle";
  id: string;
  seller_id: string;
  name: string;
  breed: string | null;
  type: string | null;
  price: number;
  location: string | null;
  district: string | null;
  state: string | null;
  photos: string[] | null;
  image_url: string | null;
  status: string | null;
  created_at: string;
  description?: string | null;
};

type Item = (ProductRow | CattleRow) & { seller_name?: string };

const CATEGORIES = [
  { id: "all", label: "All", icon: Sparkles },
  { id: "cattle", label: "Cattle", icon: Beef },
  { id: "feed", label: "Cattle Feed", icon: Wheat },
  { id: "medicine", label: "Vet Medicines", icon: Pill },
  { id: "dairy_equipment", label: "Dairy Equipment", icon: Milk },
  { id: "farm_equipment", label: "Farm Equipment", icon: Tractor },
  { id: "supplements", label: "Supplements", icon: FlaskConical },
];

// Map UI category -> products.category values that may exist in DB
const PRODUCT_CATEGORY_MAP: Record<string, string[]> = {
  feed: ["feed", "cattle_feed", "fodder"],
  medicine: ["medicine", "veterinary", "vet_medicine"],
  dairy_equipment: ["dairy_equipment", "equipment"],
  farm_equipment: ["farm_equipment", "machinery"],
  supplements: ["supplements", "minerals", "supplement"],
};

const SORTS = [
  { id: "newest", label: "Newest" },
  { id: "price_asc", label: "Price: Low to High" },
  { id: "price_desc", label: "Price: High to Low" },
];

const daysAgo = (iso: string) => {
  const d = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  if (d < 30) return `${d}d ago`;
  if (d < 365) return `${Math.floor(d / 30)}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
};

const itemHref = (it: Item) => (it.kind === "cattle" ? `/cattle-market/${it.id}` : `/marketplace#${it.id}`);

const itemImage = (it: Item) => {
  if (it.kind === "cattle") return it.photos?.[0] || it.image_url || null;
  return it.image_url;
};

const itemLocation = (it: Item) => {
  if (it.kind === "cattle") {
    return [it.district, it.state].filter(Boolean).join(", ") || it.location || "Location not set";
  }
  return null;
};

export default function Marketplace() {
  const { user } = useAuth();
  const { addItem, items: cartItems } = useCart();

  const [tab, setTab] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<string>("newest");
  const [district, setDistrict] = useState("");
  const [state, setStateName] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200000]);

  const [products, setProducts] = useState<ProductRow[]>([]);
  const [cattle, setCattle] = useState<CattleRow[]>([]);
  const [sellerNames, setSellerNames] = useState<Record<string, string>>({});
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Load both data sources
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [pRes, cRes] = await Promise.all([
        supabase
          .from("products")
          .select("id,seller_id,name,description,category,price,unit,stock,image_url,created_at")
          .eq("approved", true)
          .gt("stock", 0)
          .order("created_at", { ascending: false })
          .limit(200),
        supabase
          .from("cattle_listings")
          .select(
            "id,seller_id,name,breed,type,price,location,district,state,photos,image_url,status,created_at,description"
          )
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(200),
      ]);
      if (cancelled) return;
      const p = (pRes.data || []).map((r) => ({ ...r, kind: "product" as const })) as ProductRow[];
      const c = (cRes.data || []).map((r) => ({ ...r, kind: "cattle" as const })) as CattleRow[];
      setProducts(p);
      setCattle(c);

      const sellerIds = Array.from(new Set([...p, ...c].map((r) => r.seller_id)));
      if (sellerIds.length) {
        const { data: profs } = await supabase.rpc("get_display_names", { _ids: sellerIds } as any);
        const map: Record<string, string> = {};
        (profs || []).forEach((row: any) => (map[row.user_id] = row.full_name || "Verified Seller"));
        setSellerNames(map);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Wishlist
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("cattle_favorites").select("listing_id").eq("user_id", user.id);
      setFavorites(new Set((data || []).map((r: any) => r.listing_id)));
    })();
  }, [user?.id]);

  // Realtime: new approved products / new cattle listings
  useEffect(() => {
    const ch = supabase
      .channel("marketplace-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "cattle_listings" },
        (payload) => {
          const r = payload.new as any;
          if (r.status === "active") setCattle((prev) => [{ ...r, kind: "cattle" }, ...prev]);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "products" },
        (payload) => {
          const r = payload.new as any;
          if (r.approved && r.stock > 0) {
            setProducts((prev) => {
              const without = prev.filter((x) => x.id !== r.id);
              return [{ ...r, kind: "product" }, ...without];
            });
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const allItems: Item[] = useMemo(() => {
    return [...cattle, ...products].map((it) => ({ ...it, seller_name: sellerNames[it.seller_id] }));
  }, [cattle, products, sellerNames]);

  const filtered = useMemo(() => {
    let list = allItems.slice();

    // Category tab
    if (tab === "cattle") list = list.filter((i) => i.kind === "cattle");
    else if (tab !== "all") {
      const cats = PRODUCT_CATEGORY_MAP[tab] || [tab];
      list = list.filter((i) => i.kind === "product" && cats.includes(i.category));
    }

    // Search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((i) => {
        const hay = [
          i.name,
          i.kind === "cattle" ? i.breed : (i as ProductRow).category,
          i.kind === "cattle" ? `${i.district} ${i.state} ${i.location}` : "",
          i.seller_name || "",
          (i.description || ""),
        ]
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }

    // Location
    if (district.trim()) {
      const q = district.trim().toLowerCase();
      list = list.filter((i) => i.kind === "cattle" && (i.district || "").toLowerCase().includes(q));
    }
    if (state.trim()) {
      const q = state.trim().toLowerCase();
      list = list.filter((i) => i.kind === "cattle" && (i.state || "").toLowerCase().includes(q));
    }

    // Price range
    list = list.filter((i) => Number(i.price) >= priceRange[0] && Number(i.price) <= priceRange[1]);

    // Verified-only: items with a known seller name
    if (verifiedOnly) list = list.filter((i) => !!i.seller_name);

    // Sort
    if (sort === "price_asc") list.sort((a, b) => Number(a.price) - Number(b.price));
    else if (sort === "price_desc") list.sort((a, b) => Number(b.price) - Number(a.price));
    else list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return list;
  }, [allItems, tab, search, district, state, priceRange, verifiedOnly, sort]);

  const featured = useMemo(() => allItems.slice(0, 8), [allItems]);
  const counts = useMemo(() => ({ cart: cartItems.reduce((s, i) => s + i.quantity, 0) }), [cartItems]);

  const toggleFavorite = async (it: Item) => {
    if (!user) {
      toast.error("Sign in to save listings");
      return;
    }
    if (it.kind !== "cattle") {
      toast.message("Wishlist for products coming soon");
      return;
    }
    const next = new Set(favorites);
    if (favorites.has(it.id)) {
      next.delete(it.id);
      setFavorites(next);
      await supabase.from("cattle_favorites").delete().eq("user_id", user.id).eq("listing_id", it.id);
    } else {
      next.add(it.id);
      setFavorites(next);
      await supabase.from("cattle_favorites").insert({ user_id: user.id, listing_id: it.id });
      toast.success("Saved to wishlist");
    }
  };

  const shareItem = async (it: Item) => {
    const url = `${window.location.origin}${itemHref(it)}`;
    try {
      if (navigator.share) await navigator.share({ title: it.name, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied");
      }
    } catch {
      /* user cancelled */
    }
  };

  const resetFilters = () => {
    setSearch("");
    setDistrict("");
    setStateName("");
    setVerifiedOnly(false);
    setPriceRange([0, 200000]);
    setSort("newest");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Hero header */}
      <section className="border-b bg-card">
        <div className="container py-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl font-bold md:text-4xl">Dairy Marketplace</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Cattle, feed, medicines & equipment from verified sellers across India.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="outline">
                <Link to="/cattle-market/new">
                  <Plus className="mr-1.5 h-4 w-4" /> Sell on Marketplace
                </Link>
              </Button>
              <Button asChild className="relative">
                <Link to="/cart">
                  <ShoppingCart className="mr-1.5 h-4 w-4" /> Cart
                  {counts.cart > 0 && (
                    <Badge className="ml-2 h-5 min-w-5 rounded-full px-1.5 text-xs">{counts.cart}</Badge>
                  )}
                </Link>
              </Button>
            </div>
          </div>

          {/* Search + filter button */}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, breed, location or seller"
                className="h-11 pl-9"
              />
            </div>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="h-11 w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORTS.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="h-11">
                  <SlidersHorizontal className="mr-1.5 h-4 w-4" /> Filters
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-6">
                  <div>
                    <label className="text-sm font-medium">District</label>
                    <Input
                      className="mt-1.5"
                      placeholder="e.g. Guntur"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">State</label>
                    <Input
                      className="mt-1.5"
                      placeholder="e.g. Andhra Pradesh"
                      value={state}
                      onChange={(e) => setStateName(e.target.value)}
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm">
                      <label className="font-medium">Price range</label>
                      <span className="text-muted-foreground">
                        ₹{priceRange[0].toLocaleString()} – ₹{priceRange[1].toLocaleString()}
                      </span>
                    </div>
                    <Slider
                      className="mt-3"
                      value={priceRange}
                      onValueChange={(v) => setPriceRange([v[0], v[1]] as [number, number])}
                      min={0}
                      max={200000}
                      step={500}
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={verifiedOnly}
                      onChange={(e) => setVerifiedOnly(e.target.checked)}
                      className="h-4 w-4 rounded border-input"
                    />
                    Verified sellers only
                  </label>
                  <Button variant="outline" className="w-full" onClick={resetFilters}>
                    Reset filters
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </section>

      <div className="container py-8">
        {/* Category tabs */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0">
            {CATEGORIES.map((c) => {
              const Icon = c.icon;
              return (
                <TabsTrigger
                  key={c.id}
                  value={c.id}
                  className="gap-2 rounded-full border bg-card px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Icon className="h-4 w-4" /> {c.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>

        {/* Result count */}
        <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
          <span>{loading ? "Loading…" : `${filtered.length} listing${filtered.length === 1 ? "" : "s"}`}</span>
        </div>

        {/* Grid */}
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <CardContent className="space-y-3 p-4">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-9 w-full" />
                  </CardContent>
                </Card>
              ))
            : filtered.map((it) => (
                <ItemCard
                  key={`${it.kind}-${it.id}`}
                  item={it}
                  isFavorite={favorites.has(it.id)}
                  onFavorite={() => toggleFavorite(it)}
                  onShare={() => shareItem(it)}
                  onAddToCart={() => {
                    if (it.kind !== "product") return;
                    addItem({
                      id: it.id,
                      name: it.name,
                      price: Number(it.price),
                      unit: it.unit || "unit",
                      image_url: it.image_url || undefined,
                      seller_id: it.seller_id,
                    });
                    toast.success(`${it.name} added to cart`);
                  }}
                />
              ))}
        </div>

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="mt-10 rounded-xl border bg-card p-8 text-center">
            <Sparkles className="mx-auto h-10 w-10 text-primary" />
            <h3 className="mt-3 font-serif text-2xl font-semibold">Nothing matches just yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Try a different category or reset filters. Here are some popular listings instead.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Button onClick={resetFilters} variant="outline">
                Reset filters
              </Button>
              <Button asChild>
                <Link to="/cattle-market/new">
                  <Plus className="mr-1.5 h-4 w-4" /> Add a listing
                </Link>
              </Button>
            </div>
            {featured.length > 0 && (
              <div className="mt-8 grid gap-5 text-left sm:grid-cols-2 lg:grid-cols-4">
                {featured.slice(0, 4).map((it) => (
                  <ItemCard
                    key={`feat-${it.kind}-${it.id}`}
                    item={it}
                    isFavorite={favorites.has(it.id)}
                    onFavorite={() => toggleFavorite(it)}
                    onShare={() => shareItem(it)}
                    onAddToCart={() => {}}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ItemCard({
  item,
  isFavorite,
  onFavorite,
  onShare,
  onAddToCart,
}: {
  item: Item;
  isFavorite: boolean;
  onFavorite: () => void;
  onShare: () => void;
  onAddToCart: () => void;
}) {
  const img = itemImage(item);
  const loc = itemLocation(item);
  const isCattle = item.kind === "cattle";

  return (
    <Card className="group flex flex-col overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-xl">
      <Link to={itemHref(item)} className="relative block aspect-[4/3] overflow-hidden bg-muted">
        {img ? (
          <img
            src={img}
            alt={item.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <Sparkles className="h-10 w-10 opacity-40" />
          </div>
        )}
        <div className="absolute left-2 top-2 flex gap-1.5">
          <Badge variant="secondary" className="bg-background/90 backdrop-blur">
            {isCattle ? (item as CattleRow).breed || (item as CattleRow).type || "Cattle" : (item as ProductRow).category}
          </Badge>
          {item.seller_name && (
            <Badge className="gap-1 bg-emerald-600 text-white hover:bg-emerald-600">
              <ShieldCheck className="h-3 w-3" /> Verified
            </Badge>
          )}
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onFavorite();
          }}
          aria-label="Save to wishlist"
          className="absolute right-2 top-2 rounded-full bg-background/90 p-2 backdrop-blur transition hover:bg-background"
        >
          <Heart className={`h-4 w-4 ${isFavorite ? "fill-red-500 text-red-500" : "text-foreground"}`} />
        </button>
      </Link>

      <CardContent className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <Link to={itemHref(item)} className="line-clamp-1 font-medium hover:underline">
            {item.name}
          </Link>
          <button
            type="button"
            onClick={onShare}
            aria-label="Share listing"
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-baseline gap-1 text-primary">
          <IndianRupee className="h-4 w-4" />
          <span className="text-xl font-bold">{Number(item.price).toLocaleString("en-IN")}</span>
          {!isCattle && (item as ProductRow).unit && (
            <span className="text-xs text-muted-foreground">/ {(item as ProductRow).unit}</span>
          )}
        </div>

        <div className="space-y-1 text-xs text-muted-foreground">
          {loc && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> <span className="line-clamp-1">{loc}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span>By {item.seller_name || "Verified Seller"}</span>
            <span>{daysAgo(item.created_at)}</span>
          </div>
          <div className="flex items-center gap-1 text-amber-500">
            <Star className="h-3.5 w-3.5 fill-amber-500" />
            <Star className="h-3.5 w-3.5 fill-amber-500" />
            <Star className="h-3.5 w-3.5 fill-amber-500" />
            <Star className="h-3.5 w-3.5 fill-amber-500" />
            <Star className="h-3.5 w-3.5" />
            <span className="ml-1 text-muted-foreground">New</span>
          </div>
        </div>

        <div className="mt-auto flex gap-2 pt-2">
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link to={itemHref(item)}>View details</Link>
          </Button>
          {!isCattle && (
            <Button size="sm" className="flex-1 gap-1.5" onClick={onAddToCart}>
              <ShoppingCart className="h-3.5 w-3.5" /> Add
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
