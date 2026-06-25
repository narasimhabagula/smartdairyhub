import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Phone, MessageCircle, MapPin, IndianRupee, Heart, Flag, User, ArrowLeft, Loader2 } from "lucide-react";
import { telHref, waHref, formatIndianPhoneDisplay } from "@/lib/phone";
import { toast } from "sonner";

export default function CattleDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [listing, setListing] = useState<any>(null);
  const [seller, setSeller] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState(0);
  const [fav, setFav] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [reporting, setReporting] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase.from("cattle_listings").select("*").eq("id", id!).single();
      if (!data) { setLoading(false); return; }
      setListing(data);
      const { data: prof } = await supabase.rpc("get_display_names", { _ids: [(data as any).seller_id] } as any);
      setSeller(prof?.[0] ? { full_name: prof[0].full_name } : null);
      if (user) {
        const { data: f } = await supabase.from("cattle_favorites" as any).select("id").eq("user_id", user.id).eq("listing_id", id!).maybeSingle();
        setFav(!!f);
      }
      setLoading(false);
    })();
  }, [id, user]);

  const toggleFav = async () => {
    if (!user) { toast.error("Please log in to save favorites"); return; }
    if (fav) {
      await supabase.from("cattle_favorites" as any).delete().eq("user_id", user.id).eq("listing_id", id!);
      setFav(false);
    } else {
      const { error } = await supabase.from("cattle_favorites" as any).insert({ user_id: user.id, listing_id: id });
      if (error) toast.error(error.message); else { setFav(true); toast.success("Saved to favorites"); }
    }
  };

  const submitReport = async () => {
    if (!user) { toast.error("Please log in to report"); return; }
    if (reason.trim().length < 3) { toast.error("Add a brief reason"); return; }
    setReporting(true);
    const { error } = await supabase.from("cattle_reports" as any).insert({
      reporter_id: user.id, listing_id: id, reason: reason.trim(),
    });
    setReporting(false);
    if (error) toast.error(error.message);
    else { toast.success("Reported. Our team will review it."); setReportOpen(false); setReason(""); }
  };

  if (loading) return <div className="container py-16 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin" /></div>;
  if (!listing) return <div className="container py-16 text-center text-muted-foreground">Listing not found.</div>;

  const photos: string[] = listing.photos?.length ? listing.photos : (listing.image_url ? [listing.image_url] : []);
  const loc = [listing.village, listing.district, listing.state].filter(Boolean).join(", ") || listing.location;

  return (
    <div className="container max-w-5xl py-8">
      <Link to="/cattle-market" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to market</Link>

      <div className="mt-4 grid gap-6 md:grid-cols-2">
        <div>
          <div className="aspect-[4/3] overflow-hidden rounded-xl border bg-muted">
            {photos[activePhoto] ? (
              <img src={photos[activePhoto]} alt={listing.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">No photo</div>
            )}
          </div>
          {photos.length > 1 && (
            <div className="mt-3 grid grid-cols-5 gap-2">
              {photos.map((url, i) => (
                <button key={url} onClick={() => setActivePhoto(i)}
                  className={`aspect-square overflow-hidden rounded-md border-2 ${i === activePhoto ? "border-primary" : "border-transparent"}`}>
                  <img src={url} alt="" loading="lazy" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
          {listing.video_url && (
            <div className="mt-4">
              <p className="mb-2 text-sm font-medium">Video</p>
              <video src={listing.video_url} controls preload="metadata" className="w-full rounded-lg border bg-black" />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-bold">{listing.name}</h1>
              <p className="text-muted-foreground">{listing.breed}</p>
            </div>
            <Badge variant={listing.status === "sold" ? "secondary" : "default"}>
              {listing.status === "sold" ? "Sold" : listing.listing_type === "sell" ? "For Sale" : "Wanted"}
            </Badge>
          </div>

          <div className="flex items-baseline gap-1 text-3xl font-bold text-primary">
            <IndianRupee className="h-6 w-6" />{Number(listing.price).toLocaleString("en-IN")}
          </div>

          {loc && <div className="flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="h-4 w-4" /> {loc}</div>}

          <Card>
            <CardContent className="grid grid-cols-2 gap-3 p-4 text-sm">
              <Field label="Type" value={listing.type} capitalize />
              <Field label="Age" value={listing.age} />
              {(listing.type === "cow" || listing.type === "buffalo") && (
                <Field label="Milk Yield" value={listing.milk_yield ? `${listing.milk_yield} L/day` : null} />
              )}
              {listing.type === "cow" && <Field label="Gender" value={listing.attrs?.gender} capitalize />}
              {(listing.type === "cow" || listing.type === "buffalo") && (
                <Field label="FAT %" value={listing.attrs?.fat} />
              )}
              {listing.type === "cow" && <Field label="SNF %" value={listing.attrs?.snf} />}
              {listing.type === "cow" && <Field label="Lactation #" value={listing.attrs?.lactation_number} />}
              {listing.type === "hen" && <Field label="Egg Laying" value={listing.attrs?.egg_laying} capitalize />}
              {listing.type === "hen" && <Field label="Eggs / Week" value={listing.attrs?.eggs_per_week} />}
              {listing.weight && <Field label="Weight" value={listing.weight} />}
              {listing.quantity != null && <Field label="Quantity" value={listing.quantity} />}
              <Field label="Vaccination" value={listing.vaccination_status} />
              <Field label="Health" value={listing.health_status} className="col-span-2" />
              {listing.negotiable && <Field label="Price" value="Negotiable" />}
            </CardContent>
          </Card>

          {listing.description && (
            <div>
              <p className="font-medium">Description</p>
              <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">{listing.description}</p>
            </div>
          )}

          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{seller?.full_name || "Verified Seller"}</span>
              </div>
              {listing.contact_phone && (
                <div className="text-sm text-muted-foreground">{formatIndianPhoneDisplay(listing.contact_phone)}</div>
              )}
              {listing.contact_phone && listing.status !== "sold" && (
                <div className="grid grid-cols-2 gap-2">
                  <Button asChild size="lg" variant="outline" className="gap-2">
                    <a href={telHref(listing.contact_phone)}><Phone className="h-4 w-4" /> Call</a>
                  </Button>
                  <Button asChild size="lg" className="gap-2 bg-[#25D366] text-white hover:bg-[#1ebe5b]">
                    <a target="_blank" rel="noopener noreferrer" href={waHref(listing.contact_phone, `Hello, I'm interested in your ${listing.breed} (${listing.name}) on Smart Dairy Hub.`)}>
                      <MessageCircle className="h-4 w-4" /> WhatsApp
                    </a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button variant={fav ? "default" : "outline"} onClick={toggleFav} className="flex-1 gap-2">
              <Heart className={`h-4 w-4 ${fav ? "fill-current" : ""}`} /> {fav ? "Saved" : "Save"}
            </Button>
            <Dialog open={reportOpen} onOpenChange={setReportOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex-1 gap-2"><Flag className="h-4 w-4" /> Report</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Report this listing</DialogTitle></DialogHeader>
                <p className="text-sm text-muted-foreground">Tell us why this listing looks fake or misleading.</p>
                <Textarea value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} rows={4} placeholder="e.g. price seems too low, photos look stolen…" />
                <Button onClick={submitReport} disabled={reporting}>{reporting ? "Submitting…" : "Submit report"}</Button>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, capitalize, className }: { label: string; value: any; capitalize?: boolean; className?: string }) {
  return (
    <div className={className}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`font-medium ${capitalize ? "capitalize" : ""}`}>{value || "—"}</p>
    </div>
  );
}
