import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Phone, MapPin, IndianRupee, Plus, Search, MessageCircle, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { normalizeIndianPhone, telHref, waHref, formatIndianPhoneDisplay } from "@/lib/phone";

type Listing = {
  id: string;
  seller_id: string;
  name: string;
  breed: string;
  type: string;
  age: string | null;
  milk_yield: string | null;
  price: number;
  location: string | null;
  district: string | null;
  village: string | null;
  description: string | null;
  contact_phone: string | null;
  listing_type: string;
  status: string;
  created_at: string;
  seller_name?: string;
};

const emptyForm = {
  name: "",
  breed: "",
  type: "cow",
  age: "",
  milk_yield: "",
  price: "",
  location: "",
  district: "",
  village: "",
  description: "",
  contact_phone: "",
  listing_type: "sell",
};

export default function CattleMarket() {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);

  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchListings = async () => {
    setLoading(true);
    let query = supabase.from("cattle_listings").select("*").eq("status", "active");
    if (typeFilter !== "all") query = query.eq("type", typeFilter);
    if (search) query = query.ilike("name", `%${search}%`);
    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) {
      toast.error(error.message);
      setListings([]);
      setLoading(false);
      return;
    }
    const rows = (data as Listing[]) || [];
    // Fetch seller names in one round-trip
    const sellerIds = Array.from(new Set(rows.map((r) => r.seller_id)));
    if (sellerIds.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", sellerIds);
      const map = new Map((profs || []).map((p: any) => [p.user_id, p.full_name]));
      rows.forEach((r) => {
        r.seller_name = map.get(r.seller_id) || "Verified Seller";
      });
    }
    setListings(rows);
    setLoading(false);
  };

  useEffect(() => {
    fetchListings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, search]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please login first");
      return;
    }
    const normalized = normalizeIndianPhone(form.contact_phone);
    if (!normalized) {
      toast.error("Enter a valid 10-digit Indian mobile number");
      return;
    }
    const priceNum = parseFloat(form.price);
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      toast.error("Enter a valid price");
      return;
    }

    setSaving(true);
    const { error } = await supabase.from("cattle_listings").insert({
      name: form.name.trim(),
      breed: form.breed.trim(),
      type: form.type,
      age: form.age.trim() || null,
      milk_yield: form.milk_yield.trim() || null,
      price: priceNum,
      location: form.location.trim() || null,
      district: form.district.trim() || null,
      village: form.village.trim() || null,
      description: form.description.trim() || null,
      contact_phone: normalized,
      listing_type: form.listing_type,
      seller_id: user.id,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Listing created!");
    setAddOpen(false);
    setForm(emptyForm);
    fetchListings();
  };

  return (
    <div className="container py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Cattle Market</h1>
          <p className="mt-2 text-muted-foreground">Buy and sell cows & buffaloes from trusted farmers.</p>
        </div>
        {user && (
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> Add Listing</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle className="font-display">New Cattle Listing</DialogTitle></DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Name</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={80} className="mt-1.5" placeholder="HF Cross Cow" />
                  </div>
                  <div>
                    <Label>Breed</Label>
                    <Input value={form.breed} onChange={(e) => setForm({ ...form, breed: e.target.value })} required maxLength={80} className="mt-1.5" placeholder="Holstein Friesian" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Type</Label>
                    <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                      <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cow">Cow</SelectItem>
                        <SelectItem value="buffalo">Buffalo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Listing Type</Label>
                    <Select value={form.listing_type} onValueChange={(v) => setForm({ ...form, listing_type: v })}>
                      <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sell">For Sale</SelectItem>
                        <SelectItem value="buy">Want to Buy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Age</Label>
                    <Input value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} maxLength={20} className="mt-1.5" placeholder="3 years" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Milk Yield</Label>
                    <Input value={form.milk_yield} onChange={(e) => setForm({ ...form, milk_yield: e.target.value })} maxLength={20} className="mt-1.5" placeholder="15 L/day" />
                  </div>
                  <div>
                    <Label>Price (₹)</Label>
                    <Input type="number" min="1" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required className="mt-1.5" placeholder="85000" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>District</Label>
                    <Input value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} maxLength={60} className="mt-1.5" placeholder="Guntur" />
                  </div>
                  <div>
                    <Label>Village / Town</Label>
                    <Input value={form.village} onChange={(e) => setForm({ ...form, village: e.target.value })} maxLength={60} className="mt-1.5" placeholder="Tenali" />
                  </div>
                </div>
                <div>
                  <Label>Full Address (optional)</Label>
                  <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} maxLength={120} className="mt-1.5" placeholder="Near main road, ..." />
                </div>
                <div>
                  <Label>Contact Phone (Indian mobile)</Label>
                  <Input
                    value={form.contact_phone}
                    onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                    required
                    inputMode="tel"
                    maxLength={15}
                    className="mt-1.5"
                    placeholder="98765 43210"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">Saved as +91XXXXXXXXXX. Used for Call and WhatsApp buttons.</p>
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={500} className="mt-1.5" placeholder="Describe the animal..." />
                </div>
                <Button type="submit" className="w-full" disabled={saving}>
                  {saving ? "Creating..." : "Create Listing"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search cattle..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="cow">Cow</SelectItem>
            <SelectItem value="buffalo">Buffalo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p className="text-muted-foreground col-span-full">Loading...</p>
        ) : listings.length === 0 ? (
          <p className="text-muted-foreground col-span-full text-center py-12">No listings found.</p>
        ) : (
          listings.map((c) => {
            const locParts = [c.village, c.district].filter(Boolean).join(", ") || c.location || "";
            return (
              <Card key={c.id} className="overflow-hidden transition-shadow hover:shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="font-display text-lg">{c.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{c.breed}</p>
                    </div>
                    <Badge variant={c.listing_type === "sell" ? "default" : "secondary"}>
                      {c.listing_type === "sell" ? "For Sale" : "Wanted"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted-foreground">Type:</span> <span className="capitalize">{c.type}</span></div>
                    <div><span className="text-muted-foreground">Age:</span> {c.age || "N/A"}</div>
                    <div><span className="text-muted-foreground">Milk:</span> {c.milk_yield || "N/A"}</div>
                    <div className="flex items-center gap-1">
                      <IndianRupee className="h-3 w-3 text-muted-foreground" />
                      <span className="font-semibold text-primary">{Number(c.price).toLocaleString("en-IN")}</span>
                    </div>
                  </div>

                  {locParts && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 shrink-0" /> {locParts}
                    </div>
                  )}

                  <div className="rounded-lg border bg-muted/40 p-3 text-sm space-y-1">
                    <div className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-medium">{c.seller_name || "Verified Seller"}</span>
                    </div>
                    {c.contact_phone && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" />
                        <span>{formatIndianPhoneDisplay(c.contact_phone)}</span>
                      </div>
                    )}
                  </div>

                  {c.contact_phone && (
                    <div className="grid grid-cols-2 gap-2 border-t pt-3">
                      <Button size="sm" variant="outline" className="gap-1.5" asChild>
                        <a href={telHref(c.contact_phone)} aria-label={`Call seller of ${c.name}`}>
                          <Phone className="h-3.5 w-3.5" /> Call
                        </a>
                      </Button>
                      <Button
                        size="sm"
                        className="gap-1.5 bg-[#25D366] text-white hover:bg-[#1ebe5b]"
                        asChild
                      >
                        <a
                          href={waHref(
                            c.contact_phone,
                            `Hello, I'm interested in your ${c.breed} (${c.name}) listed on DairyPro.`,
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`WhatsApp seller of ${c.name}`}
                        >
                          <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                        </a>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
