import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Phone, MapPin, MessageCircle, Search, Plus, Map as MapIcon, List, Navigation,
  ExternalLink, Check, X, Siren, Radar, AlertCircle, SlidersHorizontal, Sparkles, Stethoscope, Star,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { normalizeIndianPhone, formatIndianPhoneDisplay } from "@/lib/phone";
import { escapeHtml } from "@/lib/safe-url";
import { useTranslation } from "react-i18next";
import { VetCard, VetCardSkeleton, type VetCardData } from "@/components/vet/VetCard";

type NearbyPlace = {
  id: string; name: string; address: string | null; lat: number | null; lng: number | null;
  rating: number | null; total_ratings: number | null; phone: string | null;
  maps_url: string | null; open_now: boolean | null; hours?: string[] | null;
  types?: string[]; business_status?: string | null;
};

type Vet = {
  id: string; name: string; qualification: string | null; specialization: string | null;
  phone: string; email: string | null; location: string; hospital_name: string | null;
  address: string | null; district: string | null; village: string | null;
  google_maps_url: string | null; latitude: number | null; longitude: number | null;
  rating: number | null; total_ratings: number | null; available: boolean;
  status: string; suggested_by: string | null;
};

type GeoComponents = {
  village: string | null; mandal: string | null; district: string | null;
  state: string | null; pincode: string | null; country: string | null;
  formatted: string | null; lat: number | null; lng: number | null;
};

const ANIMALS: { id: string; emoji: string; label: string }[] = [
  { id: "all", emoji: "🐾", label: "All Animals" },
  { id: "cow", emoji: "🐄", label: "Cow" },
  { id: "buffalo", emoji: "🐃", label: "Buffalo" },
  { id: "goat", emoji: "🐐", label: "Goat" },
  { id: "sheep", emoji: "🐑", label: "Sheep" },
  { id: "hen", emoji: "🐔", label: "Hen" },
  { id: "chicken", emoji: "🐓", label: "Chicken" },
  { id: "duck", emoji: "🦆", label: "Duck" },
  { id: "dog", emoji: "🐕", label: "Dog" },
  { id: "cat", emoji: "🐈", label: "Cat" },
  { id: "rabbit", emoji: "🐇", label: "Rabbit" },
  { id: "pig", emoji: "🐖", label: "Pig" },
  { id: "horse", emoji: "🐎", label: "Horse" },
  { id: "birds", emoji: "🐦", label: "Birds" },
];

const emptyForm = {
  name: "", qualification: "", specialization: "", phone: "", email: "",
  hospital_name: "", address: "", district: "", village: "", google_maps_url: "",
};

function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

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
    s.async = true; s.defer = true;
    s.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(s);
  });
  return mapsLoader;
}

const GOVT_HINTS = ["government", "govt", "municipal", "district", "panchayat", "state", "polyclinic"];
function looksGovernment(p: { name: string; address?: string | null }) {
  const hay = `${p.name} ${p.address ?? ""}`.toLowerCase();
  return GOVT_HINTS.some((h) => hay.includes(h));
}
const EMERGENCY_HINTS = ["24", "emergency", "hours", "round the clock"];
function looksEmergency(p: { name: string; address?: string | null }) {
  const hay = `${p.name} ${p.address ?? ""}`.toLowerCase();
  return EMERGENCY_HINTS.some((h) => hay.includes(h));
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
  const [view, setView] = useState<"nearby" | "list" | "map">("nearby");

  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [userGeo, setUserGeo] = useState<GeoComponents | null>(null);
  const [locError, setLocError] = useState<string | null>(null);
  const [resolvingGeo, setResolvingGeo] = useState(false);

  const [sortByNearest, setSortByNearest] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // Manual location search
  const [manualQuery, setManualQuery] = useState("");
  const [manualLoading, setManualLoading] = useState(false);

  // Nearby state
  const [nearby, setNearby] = useState<NearbyPlace[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyFetched, setNearbyFetched] = useState(false);
  const [nearbyError, setNearbyError] = useState<string | null>(null);
  const [expandedNotice, setExpandedNotice] = useState<number | null>(null);

  // Filters
  const [animal, setAnimal] = useState<string>("all");
  const [radius, setRadius] = useState<number>(10000);
  const [minRating, setMinRating] = useState<string>("0");
  const [openOnly, setOpenOnly] = useState(false);
  const [govOnly, setGovOnly] = useState(false);
  const [emergencyOnly, setEmergencyOnly] = useState(false);
  const [sameStateOnly, setSameStateOnly] = useState(true);
  const [sortBy, setSortBy] = useState<"distance" | "rating">("distance");

  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const fetchVets = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("vet_doctors").select("*")
      .eq("status", "approved").eq("available", true)
      .order("rating", { ascending: false });
    if (error) toast.error(error.message);
    setVets((data as any[]) || []);
    setLoading(false);
  }, []);

  const fetchPending = useCallback(async () => {
    if (!isAdmin) return;
    const { data } = await supabase.from("vet_doctors").select("*")
      .eq("status", "pending").order("created_at", { ascending: false });
    setPending((data as any[]) || []);
  }, [isAdmin]);

  useEffect(() => { fetchVets(); fetchPending(); }, [fetchVets, fetchPending]);

  const districts = useMemo(
    () => Array.from(new Set(vets.map((v) => v.district).filter(Boolean))) as string[],
    [vets],
  );

  const filteredVets = useMemo(() => {
    let list = vets.filter((v) => {
      if (district !== "all" && v.district !== district) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = [v.name, v.hospital_name, v.village, v.district, v.specialization, v.location]
          .filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    if (sortByNearest && userLoc) {
      list = [...list].sort((a, b) => {
        const da = a.latitude != null && a.longitude != null ? distanceKm(userLoc, { lat: a.latitude, lng: a.longitude }) : Infinity;
        const db = b.latitude != null && b.longitude != null ? distanceKm(userLoc, { lat: b.latitude, lng: b.longitude }) : Infinity;
        return da - db;
      });
    }
    return list;
  }, [vets, district, search, sortByNearest, userLoc]);

  const filteredNearby = useMemo(() => {
    let list = nearby.filter((p) => {
      if (openOnly && p.open_now !== true) return false;
      if (Number(minRating) > 0 && (p.rating ?? 0) < Number(minRating)) return false;
      if (govOnly && !looksGovernment(p)) return false;
      if (emergencyOnly && !looksEmergency(p)) return false;
      return true;
    });
    // Sort
    list = [...list].sort((a, b) => {
      if (sortBy === "rating") return (b.rating ?? 0) - (a.rating ?? 0);
      if (userLoc && a.lat != null && b.lat != null) {
        return distanceKm(userLoc, { lat: a.lat, lng: a.lng! }) - distanceKm(userLoc, { lat: b.lat, lng: b.lng! });
      }
      return 0;
    });
    return list;
  }, [nearby, openOnly, minRating, govOnly, emergencyOnly, sortBy, userLoc]);

  const resolveGeo = useCallback(async (lat: number, lng: number) => {
    setResolvingGeo(true);
    try {
      const { data, error } = await supabase.functions.invoke("geo-resolve", {
        body: { mode: "reverse", lat, lng },
      });
      if (error) throw error;
      const r = (data as any)?.result as GeoComponents | null;
      if (r) setUserGeo(r);
    } catch (e) {
      console.warn("geo-resolve reverse failed", e);
    } finally {
      setResolvingGeo(false);
    }
  }, []);

  const locateMe = useCallback(() =>
    new Promise<{ lat: number; lng: number } | null>((resolve) => {
      setLocError(null);
      if (!navigator.geolocation) {
        setLocError("Geolocation not supported on this device");
        return resolve(null);
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLoc(loc); setSortByNearest(true);
          resolveGeo(loc.lat, loc.lng);
          resolve(loc);
        },
        (err) => {
          setLocError(err.message || "Could not get your location. Please allow location access or search manually.");
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000 },
      );
    }),
  [resolveGeo]);

  const searchManual = useCallback(async () => {
    const q = manualQuery.trim();
    if (q.length < 2) { toast.error("Enter a village, mandal, district, PIN or state"); return; }
    setManualLoading(true);
    setLocError(null);
    try {
      const { data, error } = await supabase.functions.invoke("geo-resolve", {
        body: { mode: "forward", query: q },
      });
      if (error) throw error;
      const r = (data as any)?.result as GeoComponents | null;
      if (!r || r.lat == null || r.lng == null) {
        toast.error("Couldn't find that location. Try a different name.");
        return;
      }
      setUserLoc({ lat: r.lat, lng: r.lng });
      setUserGeo(r);
      setSortByNearest(true);
      // Trigger nearby fetch
      setNearbyFetched(false);
    } catch (e: any) {
      toast.error(e?.message || "Location search failed");
    } finally {
      setManualLoading(false);
    }
  }, [manualQuery]);

  const fetchNearbyLive = useCallback(async (opts?: { radius?: number; animal?: string; loc?: { lat: number; lng: number } }) => {
    setNearbyLoading(true);
    setNearbyFetched(true);
    setNearbyError(null);
    setExpandedNotice(null);
    try {
      const loc = opts?.loc ?? userLoc ?? (await locateMe());
      if (!loc) { setNearbyError("Location required. Allow GPS or search a place manually."); return; }
      const { data, error } = await supabase.functions.invoke("nearby-vets", {
        body: {
          lat: loc.lat,
          lng: loc.lng,
          radius: opts?.radius ?? radius,
          animal: opts?.animal ?? animal,
          state: sameStateOnly ? (userGeo?.state ?? "") : "",
        },
      });
      if (error) throw error;
      const places: NearbyPlace[] = (data as any)?.places || [];
      setNearby(places);
      if ((data as any)?.expanded) setExpandedNotice((data as any).radius_used);
    } catch (e: any) {
      setNearbyError(e?.message || "Failed to load nearby vets");
    } finally {
      setNearbyLoading(false);
    }
  }, [userLoc, radius, animal, sameStateOnly, userGeo, locateMe]);

  // Auto-load on first visit to Nearby tab once we have location
  useEffect(() => {
    if (view === "nearby" && userLoc && !nearbyFetched && !nearbyLoading) {
      fetchNearbyLive();
    }
  }, [view, userLoc, nearbyFetched, nearbyLoading, fetchNearbyLive]);

  // Map rendering
  useEffect(() => {
    if (view !== "map") return;
    let cancelled = false;
    loadGoogleMaps().then(() => {
      if (cancelled || !mapRef.current) return;
      const g = (window as any).google;
      const center = userLoc ?? { lat: 16.5062, lng: 80.648 };
      if (!mapInstance.current) {
        mapInstance.current = new g.maps.Map(mapRef.current, {
          center, zoom: userLoc ? 12 : 7,
          mapTypeControl: false, streetViewControl: false, fullscreenControl: false,
        });
      } else {
        mapInstance.current.setCenter(center);
      }
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
      if (userLoc) {
        markersRef.current.push(new g.maps.Marker({
          position: userLoc, map: mapInstance.current, title: "You",
          icon: { path: g.maps.SymbolPath.CIRCLE, scale: 8, fillColor: "#2563eb", fillOpacity: 1, strokeColor: "#fff", strokeWeight: 2 },
        }));
      }
      const pins: { lat: number; lng: number; name: string; sub?: string; addr?: string; phone?: string; mapsUrl?: string }[] = [];
      filteredVets.forEach((v) => {
        if (v.latitude == null || v.longitude == null) return;
        pins.push({ lat: v.latitude, lng: v.longitude, name: v.name, sub: v.hospital_name || undefined, addr: v.address || undefined, phone: v.phone, mapsUrl: v.google_maps_url || undefined });
      });
      filteredNearby.forEach((p) => {
        if (p.lat == null || p.lng == null) return;
        pins.push({ lat: p.lat, lng: p.lng, name: p.name, addr: p.address || undefined, phone: p.phone || undefined, mapsUrl: p.maps_url || undefined });
      });
      pins.forEach((p) => {
        const marker = new g.maps.Marker({ position: { lat: p.lat, lng: p.lng }, map: mapInstance.current, title: p.name });
        const directions = p.mapsUrl || `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`;
        const info = new g.maps.InfoWindow({
          content: `<div style="font-family:sans-serif;max-width:240px">
            <div style="font-weight:600;font-size:14px">${escapeHtml(p.name)}</div>
            ${p.sub ? `<div style="font-size:12px;color:#444">${escapeHtml(p.sub)}</div>` : ""}
            ${p.addr ? `<div style="font-size:12px;color:#666;margin-top:4px">${escapeHtml(p.addr)}</div>` : ""}
            <div style="margin-top:8px;display:flex;gap:8px;font-size:12px">
              ${p.phone ? `<a href="tel:${escapeHtml(p.phone)}" style="color:#16a34a">Call</a>` : ""}
              <a href="${escapeHtml(directions)}" target="_blank" rel="noreferrer" style="color:#2563eb">Directions</a>
            </div>
          </div>`,
        });
        marker.addListener("click", () => info.open({ anchor: marker, map: mapInstance.current }));
        markersRef.current.push(marker);
      });
    }).catch((e) => toast.error(e.message));
    return () => { cancelled = true; };
  }, [view, filteredVets, filteredNearby, userLoc]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error("Please login first"); return; }
    const normalized = normalizeIndianPhone(form.phone);
    if (!normalized) { toast.error("Enter a valid 10-digit Indian mobile number"); return; }
    if (!form.name.trim() || !form.district.trim()) { toast.error("Name and district are required"); return; }
    setSaving(true);
    const { error } = await supabase.from("vet_doctors").insert({
      name: form.name.trim(), qualification: form.qualification.trim() || null,
      specialization: form.specialization.trim() || null, phone: normalized,
      email: form.email.trim() || null, hospital_name: form.hospital_name.trim() || null,
      address: form.address.trim() || null, district: form.district.trim(),
      village: form.village.trim() || null, google_maps_url: form.google_maps_url.trim() || null,
      location: [form.village.trim(), form.district.trim()].filter(Boolean).join(", "),
      status: "pending", suggested_by: user.id,
    } as any);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Submitted! An admin will review and approve.");
    setAddOpen(false); setForm(emptyForm);
  };

  const moderate = async (id: string, status: "approved" | "rejected") => {
    const { error } = await supabase.from("vet_doctors").update({ status } as any).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Vet ${status}`);
    fetchPending(); fetchVets();
  };

  const detectedLocLabel = userGeo
    ? [userGeo.village, userGeo.mandal, userGeo.district, userGeo.state].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(", ")
    : null;

  return (
    <div className="container py-8 md:py-12">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="font-display text-3xl font-bold md:text-4xl">{t("vet.title")}</h1>
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
                  <div><Label>Phone *</Label><Input className="mt-1.5" inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required placeholder="98765 43210" maxLength={15} /></div>
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

      {/* Admin pending */}
      {isAdmin && pending.length > 0 && (
        <Card className="mt-6 border-amber-300/60 bg-amber-50/40 dark:bg-amber-950/10">
          <CardHeader><CardTitle className="font-display text-lg">Pending vet submissions ({pending.length})</CardTitle></CardHeader>
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

      {/* Tabs */}
      <Tabs value={view} onValueChange={(v) => setView(v as any)} className="mt-8">
        <TabsList className="grid w-full grid-cols-3 sm:w-auto">
          <TabsTrigger value="nearby" className="gap-1.5"><Radar className="h-4 w-4" /> Nearby</TabsTrigger>
          <TabsTrigger value="list" className="gap-1.5"><List className="h-4 w-4" /> Directory</TabsTrigger>
          <TabsTrigger value="map" className="gap-1.5"><MapIcon className="h-4 w-4" /> Map</TabsTrigger>
        </TabsList>

        {/* NEARBY */}
        <TabsContent value="nearby" className="mt-6 space-y-5">
          {/* Location bar */}
          <Card className="overflow-hidden border-border/60">
            <div className="grid gap-3 p-4 sm:grid-cols-[1fr_auto]">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="font-medium">Your location:</span>
                  {detectedLocLabel ? (
                    <span className="text-muted-foreground">{detectedLocLabel}</span>
                  ) : resolvingGeo ? (
                    <span className="text-muted-foreground">Detecting…</span>
                  ) : userLoc ? (
                    <span className="text-muted-foreground">
                      {userLoc.lat.toFixed(3)}, {userLoc.lng.toFixed(3)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Not set</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search village, mandal, district, PIN code or state…"
                      className="pl-9"
                      value={manualQuery}
                      onChange={(e) => setManualQuery(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") searchManual(); }}
                    />
                  </div>
                  <Button variant="outline" disabled={manualLoading} onClick={searchManual} className="gap-1.5">
                    <Search className="h-4 w-4" /> {manualLoading ? "…" : "Search"}
                  </Button>
                </div>
              </div>
              <div className="flex items-end">
                <Button onClick={() => locateMe().then((l) => l && fetchNearbyLive({ loc: l }))} className="gap-2 w-full sm:w-auto">
                  <Navigation className="h-4 w-4" /> Use my GPS
                </Button>
              </div>
            </div>
          </Card>

          {/* Animal selector */}
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              <Stethoscope className="h-4 w-4 text-primary" /> Animal type
            </div>
            <div className="flex flex-wrap gap-2">
              {ANIMALS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => { setAnimal(a.id); if (userLoc) fetchNearbyLive({ animal: a.id }); }}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition ${
                    animal === a.id
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-border bg-background hover:border-primary/50 hover:bg-primary/5"
                  }`}
                >
                  <span className="text-base leading-none">{a.emoji}</span> {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* Filters */}
          <Card className="overflow-hidden border-border/60">
            <div className="flex flex-wrap items-center gap-3 border-b bg-muted/30 p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <SlidersHorizontal className="h-4 w-4 text-primary" /> Filters
              </div>
              <Select value={String(radius)} onValueChange={(v) => { setRadius(Number(v)); if (userLoc) fetchNearbyLive({ radius: Number(v) }); }}>
                <SelectTrigger className="w-[120px]"><SelectValue placeholder="Radius" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="5000">5 km</SelectItem>
                  <SelectItem value="10000">10 km</SelectItem>
                  <SelectItem value="25000">25 km</SelectItem>
                  <SelectItem value="50000">50 km</SelectItem>
                  <SelectItem value="100000">100 km</SelectItem>
                </SelectContent>
              </Select>
              <Select value={minRating} onValueChange={setMinRating}>
                <SelectTrigger className="w-[130px]"><SelectValue placeholder="Rating" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Any rating</SelectItem>
                  <SelectItem value="3">3.0+</SelectItem>
                  <SelectItem value="4">4.0+</SelectItem>
                  <SelectItem value="4.5">4.5+</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="distance">Sort: Distance</SelectItem>
                  <SelectItem value="rating">Sort: Rating</SelectItem>
                </SelectContent>
              </Select>
              <label className="flex items-center gap-2 text-sm"><Switch checked={openOnly} onCheckedChange={setOpenOnly} /> Open now</label>
              <label className="flex items-center gap-2 text-sm"><Switch checked={govOnly} onCheckedChange={setGovOnly} /> Government</label>
              <label className="flex items-center gap-2 text-sm"><Switch checked={emergencyOnly} onCheckedChange={setEmergencyOnly} /> Emergency</label>
              <label className="flex items-center gap-2 text-sm" title="Only show results from your state">
                <Switch
                  checked={sameStateOnly}
                  onCheckedChange={(v) => { setSameStateOnly(v); if (userLoc) fetchNearbyLive(); }}
                /> Same state
              </label>
              <div className="ml-auto">
                <Button onClick={() => fetchNearbyLive()} disabled={nearbyLoading} className="gap-2">
                  <Radar className="h-4 w-4" />
                  {nearbyLoading ? "Searching..." : userLoc ? "Refresh" : "Use my location"}
                </Button>
              </div>
            </div>

            {expandedNotice && (
              <div className="flex items-center gap-2 border-b bg-primary/5 px-4 py-2.5 text-xs text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                No vets within your radius — showing results from {Math.round(expandedNotice / 1000)} km instead.
              </div>
            )}
          </Card>

          {locError && (
            <Card className="border-destructive/40 bg-destructive/5 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 text-destructive" />
                <div className="flex-1">
                  <p className="font-medium">Location access denied</p>
                  <p className="mt-1 text-sm text-muted-foreground">{locError}</p>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" onClick={() => locateMe()}>Try again</Button>
                    <Button size="sm" variant="outline" onClick={() => document.querySelector<HTMLInputElement>("input[placeholder^='Search village']")?.focus()}>
                      Search manually
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {nearbyError && !nearbyLoading && (
            <Card className="border-destructive/40 bg-destructive/5 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 text-destructive" />
                <div className="flex-1">
                  <p className="font-medium">Couldn't load nearby vets</p>
                  <p className="mt-1 text-sm text-muted-foreground">{nearbyError}</p>
                  <Button size="sm" className="mt-3" onClick={() => fetchNearbyLive()}>Retry</Button>
                </div>
              </div>
            </Card>
          )}

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {nearbyLoading ? (
              Array.from({ length: 6 }).map((_, i) => <VetCardSkeleton key={i} />)
            ) : !nearbyFetched ? (
              <Card className="col-span-full p-10 text-center">
                <Radar className="mx-auto h-10 w-10 text-muted-foreground" />
                <h3 className="mt-3 font-display text-lg font-semibold">Find vets near you</h3>
                <p className="mt-1 text-sm text-muted-foreground">Use your GPS or search by village, mandal, district or PIN code.</p>
                <div className="mt-4 flex justify-center gap-2">
                  <Button className="gap-2" onClick={() => locateMe().then((l) => l && fetchNearbyLive({ loc: l }))}>
                    <Navigation className="h-4 w-4" /> Use my GPS
                  </Button>
                </div>
              </Card>
            ) : filteredNearby.length === 0 ? (
              <Card className="col-span-full p-10 text-center">
                <MapPin className="mx-auto h-10 w-10 text-muted-foreground" />
                <h3 className="mt-3 font-display text-lg font-semibold">No nearby veterinary services found</h3>
                <p className="mt-1 text-sm text-muted-foreground">Try expanding the radius, clearing filters, or turning off "Same state".</p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <Button variant="outline" onClick={() => { setOpenOnly(false); setGovOnly(false); setEmergencyOnly(false); setMinRating("0"); }}>Clear filters</Button>
                  <Button variant="outline" onClick={() => { setSameStateOnly(false); fetchNearbyLive(); }}>Allow other states</Button>
                  <Button onClick={() => { setRadius(100000); fetchNearbyLive({ radius: 100000 }); }}>Expand to 100 km</Button>
                </div>
              </Card>
            ) : (
              filteredNearby.map((p) => {
                const dist = userLoc && p.lat != null && p.lng != null ? distanceKm(userLoc, { lat: p.lat, lng: p.lng }) : null;
                const data: VetCardData = {
                  id: p.id, name: p.name, address: p.address, phone: p.phone,
                  rating: p.rating, total_ratings: p.total_ratings, open_now: p.open_now,
                  distance_km: dist, maps_url: p.maps_url, lat: p.lat, lng: p.lng,
                  hours: p.hours, is_government: looksGovernment(p),
                };
                return <VetCard key={p.id} vet={data} />;
              })
            )}
          </div>
        </TabsContent>

        {/* DIRECTORY */}
        <TabsContent value="list" className="mt-6 space-y-5">
          <Card className="overflow-hidden border-border/60">
            <div className="flex flex-wrap items-center gap-3 p-4">
              <div className="relative min-w-[220px] flex-1">
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
                <Navigation className="h-4 w-4" /> Nearest
              </Button>
            </div>
          </Card>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <VetCardSkeleton key={i} />)
            ) : filteredVets.length === 0 ? (
              <Card className="col-span-full p-10 text-center">
                <Stethoscope className="mx-auto h-10 w-10 text-muted-foreground" />
                <h3 className="mt-3 font-display text-lg font-semibold">No vets in the directory yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">{user ? "Be the first to suggest one!" : "Please login to suggest one."}</p>
              </Card>
            ) : (
              filteredVets.map((v) => {
                const dist = sortByNearest && userLoc && v.latitude != null && v.longitude != null
                  ? distanceKm(userLoc, { lat: v.latitude, lng: v.longitude }) : null;
                const data: VetCardData = {
                  id: v.id, name: v.name,
                  hospital: v.hospital_name,
                  subtitle: [v.specialization, v.qualification].filter(Boolean).join(" · ") || null,
                  phone: v.phone, address: v.address || [v.village, v.district].filter(Boolean).join(", "),
                  rating: v.rating, total_ratings: v.total_ratings,
                  distance_km: dist, maps_url: v.google_maps_url,
                  lat: v.latitude, lng: v.longitude,
                };
                return <VetCard key={v.id} vet={data} />;
              })
            )}
          </div>
        </TabsContent>

        {/* MAP */}
        <TabsContent value="map" className="mt-6">
          <Card className="overflow-hidden border-border/60">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Pins show directory vets and nearby clinics. Click a pin for details.</p>
              <Button size="sm" variant="outline" onClick={() => locateMe()} className="gap-1.5">
                <Navigation className="h-3.5 w-3.5" /> Show my location
              </Button>
            </div>
            <div ref={mapRef} className="h-[65vh] w-full" />
          </Card>
        </TabsContent>
      </Tabs>

      {/* Emergency Support */}
      <Card className="mt-12 overflow-hidden rounded-2xl border-destructive/30 bg-gradient-to-br from-destructive/5 to-destructive/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-xl">
            <Siren className="h-5 w-5 text-destructive" /> {t("vet.emergency.title")}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{t("vet.emergency.subtitle")}</p>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border bg-background p-4">
            <h3 className="font-display font-bold">{t("vet.emergency.helpline")}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{t("vet.emergency.helplineDesc")}</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button size="lg" className="gap-1.5" asChild><a href="tel:1962"><Phone className="h-4 w-4" /> 1962</a></Button>
              <Button size="lg" variant="outline" className="gap-1.5" asChild>
                <a href="https://wa.me/911962" target="_blank" rel="noopener noreferrer"><MessageCircle className="h-4 w-4" /> WhatsApp</a>
              </Button>
            </div>
          </div>
          <div className="rounded-xl border bg-background p-4">
            <h3 className="font-display font-bold">{t("vet.emergency.ah")}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{t("vet.emergency.ahDesc")}</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button size="lg" className="gap-1.5" asChild><a href="tel:+918632446183"><Phone className="h-4 w-4" /> Call AH Dept</a></Button>
              <Button size="lg" variant="outline" className="gap-1.5" asChild>
                <a href="https://www.google.com/maps/search/?api=1&query=District+Animal+Husbandry+Office+Andhra+Pradesh" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" /> Directions
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
