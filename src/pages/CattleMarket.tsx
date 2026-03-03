import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Phone, MapPin, IndianRupee, Plus, Search, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function CattleMarket() {
  const { user } = useAuth();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);

  // Form
  const [form, setForm] = useState({ name: "", breed: "", type: "cow", age: "", milk_yield: "", price: "", location: "", description: "", contact_phone: "", listing_type: "sell" });
  const [saving, setSaving] = useState(false);

  const fetchListings = async () => {
    let query = supabase.from("cattle_listings").select("*").eq("status", "active");
    if (typeFilter !== "all") query = query.eq("type", typeFilter);
    if (search) query = query.ilike("name", `%${search}%`);
    const { data } = await query.order("created_at", { ascending: false });
    setListings(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchListings(); }, [typeFilter, search]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error("Please login first"); return; }
    setSaving(true);
    const { error } = await supabase.from("cattle_listings").insert({
      ...form,
      price: parseFloat(form.price),
      seller_id: user.id,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Listing created!");
    setAddOpen(false);
    setForm({ name: "", breed: "", type: "cow", age: "", milk_yield: "", price: "", location: "", description: "", contact_phone: "", listing_type: "sell" });
    fetchListings();
  };

  return (
    <div className="container py-10">
      <div className="flex items-center justify-between">
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
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="mt-1.5" placeholder="HF Cross Cow" />
                  </div>
                  <div>
                    <Label>Breed</Label>
                    <Input value={form.breed} onChange={(e) => setForm({ ...form, breed: e.target.value })} required className="mt-1.5" placeholder="Holstein Friesian" />
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
                    <Input value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} className="mt-1.5" placeholder="3 years" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Milk Yield</Label>
                    <Input value={form.milk_yield} onChange={(e) => setForm({ ...form, milk_yield: e.target.value })} className="mt-1.5" placeholder="15 L/day" />
                  </div>
                  <div>
                    <Label>Price (₹)</Label>
                    <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required className="mt-1.5" placeholder="85000" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Location</Label>
                    <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="mt-1.5" placeholder="Pune, MH" />
                  </div>
                  <div>
                    <Label>Contact Phone</Label>
                    <Input value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} className="mt-1.5" placeholder="+91 98765 43210" />
                  </div>
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1.5" placeholder="Describe the animal..." />
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
          listings.map((c) => (
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
                {c.location && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" /> {c.location}
                  </div>
                )}
                {c.contact_phone && (
                  <div className="flex items-center justify-end border-t pt-3">
                    <Button size="sm" variant="outline" className="gap-1.5" asChild>
                      <a href={`tel:${c.contact_phone}`}><Phone className="h-3.5 w-3.5" /> Contact</a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
