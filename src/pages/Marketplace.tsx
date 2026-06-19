import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingCart, Search, Plus, Minus, IndianRupee, Package, Phone, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { normalizeIndianPhone, telHref, waHref } from "@/lib/phone";

const categories = ["all", "milk", "ghee", "butter", "paneer", "curd", "other"];

type Product = any & { seller_name?: string; seller_phone?: string | null };

export default function Marketplace() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const { addItem, items } = useCart();

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      let query = supabase.from("products").select("*").eq("approved", true).gt("stock", 0);
      if (category !== "all") query = query.eq("category", category);
      if (search) query = query.ilike("name", `%${search}%`);
      const { data } = await query.order("created_at", { ascending: false });
      const rows = (data as Product[]) || [];
      const sellerIds = Array.from(new Set(rows.map((r) => r.seller_id)));
      if (sellerIds.length > 0) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("user_id, full_name, phone")
          .in("user_id", sellerIds);
        const map = new Map((profs || []).map((p: any) => [p.user_id, p]));
        rows.forEach((r) => {
          const p = map.get(r.seller_id);
          r.seller_name = p?.full_name || "Verified Seller";
          r.seller_phone = p?.phone ? normalizeIndianPhone(p.phone) : null;
        });
      }
      setProducts(rows);
      setLoading(false);
    };
    fetchProducts();
  }, [category, search]);

  const getCartQty = (id: string) => items.find((i) => i.id === id)?.quantity || 0;

  return (
    <div className="container py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Dairy Marketplace</h1>
          <p className="mt-2 text-muted-foreground">Fresh dairy products from local farmers.</p>
        </div>
        <Link to="/cart">
          <Button variant="outline" className="gap-2 relative">
            <ShoppingCart className="h-4 w-4" />
            Cart
            {items.length > 0 && (
              <Badge className="absolute -right-2 -top-2 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
                {items.reduce((s, i) => s + i.quantity, 0)}
              </Badge>
            )}
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c} value={c} className="capitalize">{c === "all" ? "All Products" : c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Product grid */}
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-40 bg-muted rounded-t-lg" />
              <CardContent className="p-4 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))
        ) : products.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Package className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">No products found. Check back later!</p>
          </div>
        ) : (
          products.map((p) => (
            <Card key={p.id} className="overflow-hidden transition-shadow hover:shadow-lg">
              <div className="h-40 bg-muted flex items-center justify-center">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                ) : (
                  <Package className="h-12 w-12 text-muted-foreground/40" />
                )}
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{p.name}</h3>
                    <Badge variant="secondary" className="mt-1 capitalize">{p.category}</Badge>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-0.5 font-display text-lg font-bold text-primary">
                      <IndianRupee className="h-4 w-4" />
                      {Number(p.price).toFixed(0)}
                    </div>
                    <span className="text-xs text-muted-foreground">/{p.unit}</span>
                  </div>
                </div>
                {p.description && (
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{p.description}</p>
                )}
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Stock: {p.stock}</span>
                  {getCartQty(p.id) > 0 ? (
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" className="h-8 w-8 p-0"
                        onClick={() => {
                          const cart = items.find(i => i.id === p.id);
                          if (cart && cart.quantity > 1) {
                            // handled by cart context
                          }
                        }}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-sm font-medium">{getCartQty(p.id)}</span>
                      <Button size="sm" variant="outline" className="h-8 w-8 p-0"
                        onClick={() => addItem({ id: p.id, name: p.name, price: Number(p.price), unit: p.unit, image_url: p.image_url, seller_id: p.seller_id })}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" onClick={() => {
                      addItem({ id: p.id, name: p.name, price: Number(p.price), unit: p.unit, image_url: p.image_url, seller_id: p.seller_id });
                      toast.success(`${p.name} added to cart`);
                    }} className="gap-1.5">
                      <ShoppingCart className="h-3.5 w-3.5" /> Add
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
