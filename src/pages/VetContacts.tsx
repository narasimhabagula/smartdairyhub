import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone, MapPin, Star, Clock, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function VetContacts() {
  const [vets, setVets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchVets = async () => {
      let query = supabase.from("vet_doctors").select("*").eq("available", true);
      if (search) query = query.or(`name.ilike.%${search}%,location.ilike.%${search}%,specialization.ilike.%${search}%`);
      const { data } = await query.order("rating", { ascending: false });
      setVets(data || []);
      setLoading(false);
    };
    fetchVets();
  }, [search]);

  return (
    <div className="container py-10">
      <h1 className="font-display text-3xl font-bold">Veterinary Doctors</h1>
      <p className="mt-2 text-muted-foreground">Connect with experienced veterinary doctors.</p>

      <div className="mt-6 relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search by name, location, or specialization..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p className="text-muted-foreground col-span-full">Loading...</p>
        ) : vets.length === 0 ? (
          <p className="text-muted-foreground col-span-full text-center py-12">No veterinary doctors found.</p>
        ) : (
          vets.map((v) => (
            <Card key={v.id} className="transition-shadow hover:shadow-lg">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-lg font-bold text-primary">
                    {v.name.split(" ").slice(0, 2).map((n: string) => n[0]).join("")}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display text-base font-bold">{v.name}</h3>
                    <p className="text-sm text-muted-foreground">{v.specialization || "General"}</p>
                    {v.qualification && <p className="text-xs text-muted-foreground">{v.qualification}</p>}
                    <div className="mt-1 flex items-center gap-1 text-xs">
                      <Star className="h-3 w-3 fill-accent text-accent" />
                      <span className="font-medium">{Number(v.rating).toFixed(1)}</span>
                      <span className="text-muted-foreground">({v.total_ratings} ratings)</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0" /> {v.location}
                  </div>
                </div>
                <Button size="sm" className="mt-4 w-full gap-1.5" asChild>
                  <a href={`tel:${v.phone}`}><Phone className="h-3.5 w-3.5" /> Call Now</a>
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
