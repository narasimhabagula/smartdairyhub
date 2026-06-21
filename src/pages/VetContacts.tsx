import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Phone, MapPin, MessageCircle, Search, Plus, Map as MapIcon, List, Navigation, User, ExternalLink, Check, X, Siren, Star, Radar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { normalizeIndianPhone, telHref, waHref, formatIndianPhoneDisplay } from "@/lib/phone";
import { useTranslation } from "react-i18next";

type NearbyPlace = {
  id: string;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  rating: number | null;
  total_ratings: number | null;
  phone: string | null;
  maps_url: string | null;
  open_now: boolean | null;
};

type Vet = {
  id: string;
  name: string;
  qualification: string | null;
  specialization: string | null;
  phone: string;
  email: string | null;
  location: string;
  hospital_name: string | null;
  address: string | null;
  district: string | null;
  village: string | null;
  google_maps_url: string | null;
  latitude: number | null;
  longitude: number | null;
  rating: number | null;
  total_ratings: number | null;
  available: boolean;
  status: string;
  suggested_by: string | null;
};

const emptyForm = {
  name: "",
  qualification: "",
  specialization: "",
  phone: "",
  email: "",
  hospital_name: "",
  address: "",
  district: "",
  village: "",
  google_maps_url: "",
};

// Haversine distance in km
function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

// Load Google Maps JS API once
let mapsLoader: Promise<void> | null = null;
function loadGoogleMaps(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if ((window as any).google?.maps) return Promise.resolve();
  if (mapsLoader) return mapsLoader;
  const key = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY;
  const channel = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID;
  if (!key) return Promise.reject(new Error("Google Maps key missing"));
  mapsLoader = new Promise<void>((resolve, reject) => {
    (window as any).__initDairyMap = () => resolve();
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&loading=async&callback=__initDairyMap${channel ? `&channel=${channel}` : ""}`;
    s.async = true;
    s.defer = true;
    s.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(s);
  });
  return mapsLoader;
}

export default function VetContacts() {
  const { user, hasRole } = useAuth();
  const { t } = useTranslation();
  const isAdmin = hasRole("admin");

  const [vets, setVets] = useState<Vet[]>([]);
  const [pending, setPending] = useState<Vet[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [district, setDistrict] = useState("all");
  const [view, setView] = useState<"list" | "map" | "nearby">("list");
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [sortByNearest, setSortByNearest] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [nearby, setNearby] = useState<NearbyPlace[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyFetched, setNearbyFetched] = useState(false);

  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const fetchVets = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("vet_doctors")
      .select("*")
      .eq("status", "approved")
      .eq("available", true)
      .order("rating", { ascending: false });
    if (error) toast.error(error.message);
    setVets((data as any[]) || []);
    setLoading(false);
  }, []);

  const fetchPending = useCallback(async () => {
    if (!isAdmin) return;
    const { data } = await supabase
      .from("vet_doctors")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    setPending((data as any[]) || []);
  }, [isAdmin]);

  useEffect(() => {
    fetchVets();
    fetchPending();
  }, [fetchVets, fetchPending]);

  // Districts derived from current data
  const districts = Array.from(new Set(vets.map((v) => v.district).filter(Boolean))) as string[];

  let filtered = vets.filter((v) => {
    if (district !== "all" && v.district !== district) return false;
    if (search) {
      const q = search.toLowerCase();
      const hay = [v.name, v.hospital_name, v.village, v.district, v.specialization, v.location]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  if (sortByNearest && userLoc) {
    filtered = [...filtered].sort((a, b) => {
      const da = a.latitude != null && a.longitude != null ? distanceKm(userLoc, { lat: a.latitude, lng: a.longitude }) : Infinity;
      const db = b.latitude != null && b.longitude != null ? distanceKm(userLoc, { lat: b.latitude, lng: b.longitude }) : Infinity;
      return da - db;
    });
  }

  const locateMe = () =>
    new Promise<{ lat: number; lng: number } | null>((resolve) => {
      if (!navigator.geolocation) {
        toast.error("Geolocation not supported on this device");
        return resolve(null);
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLoc(loc);
          setSortByNearest(true);
          resolve(loc);
        },
        () => {
          toast.error("Could not get your location");
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000 },
      );
    });

  const fetchNearbyLive = async () => {
    setNearbyLoading(true);
    setNearbyFetched(true);
    try {
      const loc = userLoc ?? (await locateMe());
      if (!loc) return;
      const { data, error } = await supabase.functions.invoke("nearby-vets", {
        body: { lat: loc.lat, lng: loc.lng, radius: 20000 },
      });
      if (error) throw error;
      setNearby((data as any)?.places || []);
    } catch (e: any) {
      toast.error(e.message || "Failed to load nearby vets");
    } finally {
      setNearbyLoading(false);
    }
  };

  // Render the Google Map when in map view
  useEffect(() => {
    if (view !== "map") return;
    let cancelled = false;
    loadGoogleMaps()
      .then(() => {
        if (cancelled || !mapRef.current) return;
        const g = (window as any).google;
        const center = userLoc ?? { lat: 16.5062, lng: 80.648 }; // Vijayawada, AP default
        if (!mapInstance.current) {
          mapInstance.current = new g.maps.Map(mapRef.current, {
            center,
            zoom: userLoc ? 11 : 7,
            mapTypeControl: false,
            streetViewControl: false,
          });
        } else {
          mapInstance.current.setCenter(center);
        }
        // Clear markers
        markersRef.current.forEach((m) => m.setMap(null));
        markersRef.current = [];
        if (userLoc) {
          markersRef.current.push(
            new g.maps.Marker({
              position: userLoc,
              map: mapInstance.current,
              title: "You",
              icon: {
                path: g.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: "#2563eb",
                fillOpacity: 1,
                strokeColor: "#fff",
                strokeWeight: 2,
              },
            }),
          );
        }
        filtered.forEach((v) => {
          if (v.latitude == null || v.longitude == null) return;
          const marker = new g.maps.Marker({
            position: { lat: v.latitude, lng: v.longitude },
            map: mapInstance.current,
            title: v.name,
          });
          const info = new g.maps.InfoWindow({
            content: `<div style="font-family:sans-serif;max-width:220px">
              <div style="font-weight:600">${v.name}</div>
              ${v.hospital_name ? `<div style="font-size:12px">${v.hospital_name}</div>` : ""}
              ${v.address ? `<div style="font-size:12px;color:#555">${v.address}</div>` : ""}
              <div style="margin-top:6px;display:flex;gap:6px">
                <a href="tel:${v.phone}" style="color:#16a34a;font-size:12px">Call</a>
                <a href="${waHref(v.phone)}" target="_blank" rel="noreferrer" style="color:#25D366;font-size:12px">WhatsApp</a>
              </div>
            </div>`,
          });
          marker.addListener("click", () => info.open({ anchor: marker, map: mapInstance.current }));
          markersRef.current.push(marker);
        });
      })
      .catch((e) => toast.error(e.message));
    return () => {
      cancelled = true;
    };
  }, [view, filtered, userLoc]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please login first");
      return;
    }
    const normalized = normalizeIndianPhone(form.phone);
    if (!normalized) {
      toast.error("Enter a valid 10-digit Indian mobile number");
      return;
    }
    if (!form.name.trim() || !form.district.trim()) {
      toast.error("Name and district are required");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("vet_doctors").insert({
      name: form.name.trim(),
      qualification: form.qualification.trim() || null,
      specialization: form.specialization.trim() || null,
      phone: normalized,
      email: form.email.trim() || null,
      hospital_name: form.hospital_name.trim() || null,
      address: form.address.trim() || null,
      district: form.district.trim(),
      village: form.village.trim() || null,
      google_maps_url: form.google_maps_url.trim() || null,
      location: [form.village.trim(), form.district.trim()].filter(Boolean).join(", "),
      status: "pending",
      suggested_by: user.id,
    } as any);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Submitted! An admin will review and approve.");
    setAddOpen(false);
    setForm(emptyForm);
  };

  const moderate = async (id: string, status: "approved" | "rejected") => {
    const { error } = await supabase.from("vet_doctors").update({ status } as any).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Vet ${status}`);
    fetchPending();
    fetchVets();
  };

  return (
    <div className="container py-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">{t("vet.title")}</h1>
          <p className="mt-2 text-muted-foreground">{t("vet.subtitle")}</p>
        </div>
        {user && (
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> {t("vet.suggest")}</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle className="font-display">Suggest a Vet Doctor</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Doctor Name *</Label><Input className="mt-1.5" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={100} /></div>
                  <div><Label>Hospital / Clinic</Label><Input className="mt-1.5" value={form.hospital_name} onChange={(e) => setForm({ ...form, hospital_name: e.target.value })} maxLength={120} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Qualification</Label><Input className="mt-1.5" placeholder="BVSc, MVSc" value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} maxLength={80} /></div>
                  <div><Label>Specialization</Label><Input className="mt-1.5" placeholder="Bovine, Surgery" value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} maxLength={80} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>District *</Label><Input className="mt-1.5" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} required maxLength={60} /></div>
                  <div><Label>Village / Town</Label><Input className="mt-1.5" value={form.village} onChange={(e) => setForm({ ...form, village: e.target.value })} maxLength={60} /></div>
                </div>
                <div><Label>Address</Label><Input className="mt-1.5" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} maxLength={200} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Phone *</Label>
                    <Input className="mt-1.5" inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required placeholder="98765 43210" maxLength={15} />
                  </div>
                  <div><Label>Email</Label><Input className="mt-1.5" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} maxLength={120} /></div>
                </div>
                <div><Label>Google Maps Link</Label><Input className="mt-1.5" type="url" value={form.google_maps_url} onChange={(e) => setForm({ ...form, google_maps_url: e.target.value })} placeholder="https://maps.app.goo.gl/..." /></div>
                <p className="text-xs text-muted-foreground">Submissions are reviewed by an admin before going live.</p>
                <Button type="submit" className="w-full" disabled={saving}>{saving ? "Submitting..." : "Submit for review"}</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search name, hospital, village..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={district} onValueChange={setDistrict}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="District" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Districts</SelectItem>
            {districts.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => locateMe().then((l) => l && toast.success("Showing nearest vets first"))} className="gap-1.5">
          <Navigation className="h-4 w-4" /> {t("vet.nearest")}
        </Button>
      </div>

      {/* Admin: pending approvals */}
      {isAdmin && pending.length > 0 && (
        <Card className="mt-6 border-amber-300/60 bg-amber-50/40 dark:bg-amber-950/10">
          <CardHeader>
            <CardTitle className="font-display text-lg">Pending vet submissions ({pending.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pending.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-background p-3 text-sm">
                <div>
                  <div className="font-medium">{p.name} {p.hospital_name && <span className="text-muted-foreground">· {p.hospital_name}</span>}</div>
                  <div className="text-xs text-muted-foreground">{[p.village, p.district].filter(Boolean).join(", ")} · {formatIndianPhoneDisplay(p.phone)}</div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => moderate(p.id, "approved")} className="gap-1.5"><Check className="h-3.5 w-3.5" /> Approve</Button>
                  <Button size="sm" variant="outline" onClick={() => moderate(p.id, "rejected")} className="gap-1.5"><X className="h-3.5 w-3.5" /> Reject</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Tabs value={view} onValueChange={(v) => setView(v as any)} className="mt-6">
        <TabsList>
          <TabsTrigger value="list" className="gap-1.5"><List className="h-4 w-4" /> {t("vet.list")}</TabsTrigger>
          <TabsTrigger value="map" className="gap-1.5"><MapIcon className="h-4 w-4" /> {t("vet.map")}</TabsTrigger>
          <TabsTrigger value="nearby" className="gap-1.5"><Radar className="h-4 w-4" /> {t("vet.nearby")}</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-6">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              <p className="text-muted-foreground col-span-full">Loading...</p>
            ) : filtered.length === 0 ? (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                No vets found yet. {user ? "Be the first to suggest one!" : "Please login to suggest one."}
              </div>
            ) : (
              filtered.map((v) => {
                const dist = sortByNearest && userLoc && v.latitude != null && v.longitude != null
                  ? distanceKm(userLoc, { lat: v.latitude, lng: v.longitude })
                  : null;
                const mapsLink = v.google_maps_url || (v.latitude != null && v.longitude != null
                  ? `https://www.google.com/maps/search/?api=1&query=${v.latitude},${v.longitude}`
                  : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([v.hospital_name, v.address, v.village, v.district].filter(Boolean).join(", "))}`);
                return (
                  <Card key={v.id} className="transition-shadow hover:shadow-lg">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-base font-bold text-primary">
                          {v.name.split(" ").slice(0, 2).map((n) => n[0]).join("")}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-display text-base font-bold leading-tight">{v.name}</h3>
                          {v.hospital_name && <p className="text-sm">{v.hospital_name}</p>}
                          <p className="text-xs text-muted-foreground">{v.specialization || "General"}{v.qualification ? ` · ${v.qualification}` : ""}</p>
                          {dist != null && <Badge variant="secondary" className="mt-1.5">{dist.toFixed(1)} km away</Badge>}
                        </div>
                      </div>

                      <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                        {(v.village || v.district) && (
                          <div className="flex items-start gap-1.5"><MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" /> <span>{[v.village, v.district].filter(Boolean).join(", ")}</span></div>
                        )}
                        {v.address && <div className="pl-5 text-xs">{v.address}</div>}
                        <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {formatIndianPhoneDisplay(v.phone)}</div>
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-2">
                        <Button size="sm" variant="outline" className="gap-1.5" asChild>
                          <a href={telHref(v.phone)} aria-label={`Call ${v.name}`}><Phone className="h-3.5 w-3.5" /> Call</a>
                        </Button>
                        <Button size="sm" className="gap-1.5 bg-[#25D366] text-white hover:bg-[#1ebe5b]" asChild>
                          <a href={waHref(v.phone, `Hello Dr. ${v.name}, I'm reaching out from DairyPro.`)} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp ${v.name}`}>
                            <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                          </a>
                        </Button>
                        <Button size="sm" variant="outline" className="gap-1.5" asChild>
                          <a href={mapsLink} target="_blank" rel="noopener noreferrer" aria-label={`Open ${v.name} on Google Maps`}>
                            <ExternalLink className="h-3.5 w-3.5" /> Maps
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="map" className="mt-6">
          <div ref={mapRef} className="h-[60vh] w-full overflow-hidden rounded-lg border" />
          <p className="mt-3 text-xs text-muted-foreground flex items-center gap-1.5">
            <User className="h-3 w-3" /> Tap "{t("vet.nearest")}" to show your location and sort vets by distance.
          </p>
        </TabsContent>

        <TabsContent value="nearby" className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/40 p-4">
            <p className="text-sm text-muted-foreground">{t("vet.nearbyHelp")}</p>
            <Button onClick={fetchNearbyLive} disabled={nearbyLoading} size="lg" className="gap-2">
              <Radar className="h-4 w-4" />
              {nearbyLoading ? t("vet.searching") : t("vet.findNearby")}
            </Button>
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {nearbyLoading ? (
              <p className="col-span-full text-center text-muted-foreground py-8">{t("vet.searching")}</p>
            ) : !nearbyFetched ? (
              <p className="col-span-full text-center text-muted-foreground py-8">{t("vet.nearbyHelp")}</p>
            ) : nearby.length === 0 ? (
              <p className="col-span-full text-center text-muted-foreground py-8">{t("vet.noNearby")}</p>
            ) : (
              nearby.map((p) => {
                const dist = userLoc && p.lat != null && p.lng != null ? distanceKm(userLoc, { lat: p.lat, lng: p.lng }) : null;
                const mapsLink = p.maps_url || (p.lat != null && p.lng != null ? `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}` : "#");
                const waNumber = p.phone ? p.phone.replace(/\D/g, "") : null;
                return (
                  <Card key={p.id} className="transition-shadow hover:shadow-lg">
                    <CardContent className="p-5">
                      <h3 className="font-display text-base font-bold leading-tight">{p.name}</h3>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {p.rating != null && (
                          <span className="inline-flex items-center gap-0.5">
                            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" /> {p.rating.toFixed(1)}
                            {p.total_ratings ? ` (${p.total_ratings})` : ""}
                          </span>
                        )}
                        {dist != null && <Badge variant="secondary">{dist.toFixed(1)} {t("vet.distance")}</Badge>}
                        {p.open_now === true && <Badge className="bg-green-600 hover:bg-green-700">Open</Badge>}
                      </div>
                      {p.address && (
                        <div className="mt-3 flex items-start gap-1.5 text-sm text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" /> <span>{p.address}</span>
                        </div>
                      )}
                      {p.phone && (
                        <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Phone className="h-3.5 w-3.5" /> {p.phone}
                        </div>
                      )}

                      <div className="mt-4 grid grid-cols-3 gap-2">
                        <Button size="sm" variant="outline" className="gap-1.5" disabled={!p.phone} asChild={!!p.phone}>
                          {p.phone ? (
                            <a href={`tel:${p.phone}`}><Phone className="h-3.5 w-3.5" /> {t("vet.call")}</a>
                          ) : (
                            <span><Phone className="h-3.5 w-3.5" /> {t("vet.call")}</span>
                          )}
                        </Button>
                        <Button size="sm" className="gap-1.5 bg-[#25D366] text-white hover:bg-[#1ebe5b]" disabled={!waNumber} asChild={!!waNumber}>
                          {waNumber ? (
                            <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noopener noreferrer">
                              <MessageCircle className="h-3.5 w-3.5" /> {t("vet.whatsapp")}
                            </a>
                          ) : (
                            <span><MessageCircle className="h-3.5 w-3.5" /> {t("vet.whatsapp")}</span>
                          )}
                        </Button>
                        <Button size="sm" variant="outline" className="gap-1.5" asChild>
                          <a href={mapsLink} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3.5 w-3.5" /> {t("vet.directions")}
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Emergency Support */}
      <Card className="mt-10 border-destructive/40 bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-xl">
            <Siren className="h-5 w-5 text-destructive" /> {t("vet.emergency.title")}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{t("vet.emergency.subtitle")}</p>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border bg-background p-4">
            <h3 className="font-display font-bold">{t("vet.emergency.helpline")}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{t("vet.emergency.helplineDesc")}</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button size="lg" className="gap-1.5" asChild>
                <a href="tel:1962"><Phone className="h-4 w-4" /> 1962</a>
              </Button>
              <Button size="lg" variant="outline" className="gap-1.5" asChild>
                <a href="https://wa.me/911962" target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-4 w-4" /> {t("vet.whatsapp")}
                </a>
              </Button>
            </div>
          </div>
          <div className="rounded-lg border bg-background p-4">
            <h3 className="font-display font-bold">{t("vet.emergency.ah")}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{t("vet.emergency.ahDesc")}</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button size="lg" className="gap-1.5" asChild>
                <a href="tel:+918632446183"><Phone className="h-4 w-4" /> Call AH Dept</a>
              </Button>
              <Button size="lg" variant="outline" className="gap-1.5" asChild>
                <a href="https://www.google.com/maps/search/?api=1&query=District+Animal+Husbandry+Office+Andhra+Pradesh" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" /> {t("vet.directions")}
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
