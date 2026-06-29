import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Handshake, Phone, MessageCircle, Mail, MapPin, Factory, ShoppingCart, Plus, ListChecks, Search, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { telHref, waHref } from "@/lib/phone";

type Company = {
  id: string;
  name: string;
  logo_url: string | null;
  district: string | null;
  state: string | null;
  village: string | null;
  phone: string | null;
  email: string | null;
  working_hours: string | null;
  verified: boolean;
};

type Listing = {
  id: string;
  name: string;
  price: number;
  type: string | null;
  breed: string | null;
  district: string | null;
  state: string | null;
  status: string;
  created_at: string;
  image_url: string | null;
};

export default function MediatorPanel() {
  const { user, hasRole, loading } = useAuth();

  if (loading) return <div className="container py-12 text-center text-muted-foreground">Loading…</div>;

  if (!user) {
    return (
      <div className="container max-w-md py-16 text-center">
        <Lock className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
        <h1 className="font-display text-2xl font-bold">Sign in to access the Mediator panel</h1>
        <Link to="/select-role"><Button className="mt-6">Continue</Button></Link>
      </div>
    );
  }

  const allowed = hasRole("mediator") || hasRole("admin");
  if (!allowed) {
    return (
      <div className="container max-w-md py-16 text-center">
        <Handshake className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
        <h1 className="font-display text-2xl font-bold">Mediator role required</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This workspace is for traders and mediators connecting farmers with dairy industries.
        </p>
        <Link to="/select-role"><Button className="mt-6" variant="outline">Change role</Button></Link>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-500/15 text-amber-700"><Handshake className="h-5 w-5" /></div>
        <div className="flex-1">
          <h1 className="font-display text-2xl font-bold">Mediator Workspace</h1>
          <p className="text-sm text-muted-foreground">Connect farmers and dairy industries. Trade livestock. View live procurement rates.</p>
        </div>
        <div className="hidden gap-2 sm:flex">
          <Link to="/milk-rates"><Button variant="outline" size="sm">Today's rates</Button></Link>
          <Link to="/cattle-market/new"><Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> List livestock</Button></Link>
        </div>
      </div>

      <div className="mb-6 rounded-lg border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
        <Lock className="-mt-0.5 mr-1.5 inline h-3.5 w-3.5" />
        Mediators can browse and contact industries and farmers, and trade livestock. Publishing or editing milk rates is reserved for verified dairy industries.
      </div>

      <Tabs defaultValue="industries">
        <TabsList>
          <TabsTrigger value="industries" className="gap-1.5"><Factory className="h-3.5 w-3.5" /> Industries</TabsTrigger>
          <TabsTrigger value="livestock" className="gap-1.5"><ShoppingCart className="h-3.5 w-3.5" /> Livestock leads</TabsTrigger>
          <TabsTrigger value="mine" className="gap-1.5"><ListChecks className="h-3.5 w-3.5" /> My trades</TabsTrigger>
        </TabsList>

        <TabsContent value="industries" className="mt-5">
          <IndustriesDirectory />
        </TabsContent>
        <TabsContent value="livestock" className="mt-5">
          <LivestockLeads />
        </TabsContent>
        <TabsContent value="mine" className="mt-5">
          <MyTrades userId={user.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function IndustriesDirectory() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [q, setQ] = useState("");
  const [district, setDistrict] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("dairy_companies_public")
        .select("id,name,logo_url,district,state,village,phone,working_hours,verified")
        .order("verified", { ascending: false })
        .order("name");
      setCompanies((data as Company[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const districts = useMemo(
    () => Array.from(new Set(companies.map((c) => c.district).filter(Boolean))) as string[],
    [companies],
  );

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return companies.filter((c) => {
      if (district !== "all" && c.district !== district) return false;
      if (!ql) return true;
      return `${c.name} ${c.district ?? ""} ${c.state ?? ""} ${c.village ?? ""}`.toLowerCase().includes(ql);
    });
  }, [companies, q, district]);

  return (
    <div>
      <Card className="mb-4">
        <CardContent className="grid gap-3 p-4 md:grid-cols-3">
          <div className="relative md:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search company, district, village…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
          </div>
          <Select value={district} onValueChange={setDistrict}>
            <SelectTrigger><SelectValue placeholder="District" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All districts</SelectItem>
              {districts.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {loading ? (
        <p className="py-10 text-center text-muted-foreground">Loading industries…</p>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No industries match your filters.</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => <IndustryCard key={c.id} company={c} />)}
        </div>
      )}
    </div>
  );
}

function IndustryCard({ company }: { company: Company }) {
  const tel = company.phone ? telHref(company.phone) : null;
  const wa = company.phone
    ? waHref(company.phone, `Hello ${company.name}, I'm a mediator on Smart Dairy Hub and have farmers interested in supplying milk. Could we discuss procurement rates?`)
    : null;

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <CardHeader className="bg-muted/30 pb-3">
        <div className="flex items-start gap-3">
          {company.logo_url ? (
            <img src={company.logo_url} alt={`${company.name} logo`} className="h-12 w-12 rounded-md object-cover" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/15 text-primary"><Factory className="h-6 w-6" /></div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="truncate text-base">{company.name}</CardTitle>
              {company.verified && <Badge variant="secondary" className="text-[10px]">Verified</Badge>}
            </div>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {[company.village, company.district, company.state].filter(Boolean).join(", ") || "Location not set"}
            </p>
            {company.working_hours && <p className="mt-0.5 text-xs text-muted-foreground">{company.working_hours}</p>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-2 pt-4">
        <a href={tel || "#"} aria-disabled={!tel}>
          <Button variant="outline" className="w-full gap-1.5" disabled={!tel}><Phone className="h-4 w-4" /> Call</Button>
        </a>
        <a href={wa || "#"} target="_blank" rel="noreferrer" aria-disabled={!wa}>
          <Button className="w-full gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700" disabled={!wa}>
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </Button>
        </a>
        <a href={company.email ? `mailto:${company.email}` : "#"} aria-disabled={!company.email}>
          <Button variant="outline" className="w-full gap-1.5" disabled={!company.email}><Mail className="h-4 w-4" /> Email</Button>
        </a>
      </CardContent>
    </Card>
  );
}

function LivestockLeads() {
  const [items, setItems] = useState<Listing[]>([]);
  const [q, setQ] = useState("");
  const [animal, setAnimal] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("cattle_listings_public" as any)
        .select("id,name,price,type,breed,district,state,status,created_at,image_url")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(60);
      setItems((data as Listing[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const animals = useMemo(
    () => Array.from(new Set(items.map((i) => i.type).filter(Boolean))) as string[],
    [items],
  );

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return items.filter((i) => {
      if (animal !== "all" && i.type !== animal) return false;
      if (!ql) return true;
      return `${i.name} ${i.breed ?? ""} ${i.district ?? ""} ${i.state ?? ""}`.toLowerCase().includes(ql);
    });
  }, [items, q, animal]);

  return (
    <div>
      <Card className="mb-4">
        <CardContent className="grid gap-3 p-4 md:grid-cols-3">
          <div className="relative md:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search breed, location, title…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
          </div>
          <Select value={animal} onValueChange={setAnimal}>
            <SelectTrigger><SelectValue placeholder="Animal type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All animals</SelectItem>
              {animals.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {loading ? (
        <p className="py-10 text-center text-muted-foreground">Loading leads…</p>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No active livestock leads right now.</CardContent></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((l) => (
            <Link to={`/cattle-market/${l.id}`} key={l.id}>
              <Card className="overflow-hidden transition-shadow hover:shadow-md">
                {l.image_url ? (
                  <img src={l.image_url} alt={l.name} loading="lazy" className="h-40 w-full object-cover" />
                ) : (
                  <div className="flex h-40 items-center justify-center bg-muted text-muted-foreground"><ShoppingCart className="h-8 w-8" /></div>
                )}
                <CardContent className="space-y-1 p-3">
                  <p className="line-clamp-1 font-semibold">{l.name}</p>
                  <p className="text-sm font-bold text-primary">₹{Number(l.price).toLocaleString("en-IN")}</p>
                  <p className="line-clamp-1 text-xs text-muted-foreground">
                    {[l.type, l.breed].filter(Boolean).join(" · ")}
                  </p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {[l.district, l.state].filter(Boolean).join(", ") || "—"}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function MyTrades({ userId }: { userId: string }) {
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("cattle_listings")
        .select("id,name,price,type,breed,district,state,status,created_at,image_url")
        .eq("seller_id", userId)
        .order("created_at", { ascending: false });
      setItems((data as Listing[]) ?? []);
      setLoading(false);
    })();
  }, [userId]);

  if (loading) return <p className="py-10 text-center text-muted-foreground">Loading…</p>;
  if (items.length === 0) {
    return (
      <Card><CardContent className="py-12 text-center">
        <p className="text-muted-foreground">You haven't posted any livestock trades yet.</p>
        <Link to="/cattle-market/new"><Button className="mt-4 gap-1.5"><Plus className="h-4 w-4" /> Post first listing</Button></Link>
      </CardContent></Card>
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((l) => (
        <Link to={`/cattle-market/${l.id}`} key={l.id}>
          <Card className="overflow-hidden transition-shadow hover:shadow-md">
            {l.image_url && <img src={l.image_url} alt={l.name} loading="lazy" className="h-36 w-full object-cover" />}
            <CardContent className="p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="line-clamp-1 font-semibold">{l.name}</p>
                <Badge variant={l.status === "active" ? "default" : "secondary"} className="capitalize">{l.status}</Badge>
              </div>
              <p className="mt-1 text-sm font-bold text-primary">₹{Number(l.price).toLocaleString("en-IN")}</p>
              <p className="mt-1 text-xs text-muted-foreground">{[l.type, l.breed].filter(Boolean).join(" · ")}</p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
