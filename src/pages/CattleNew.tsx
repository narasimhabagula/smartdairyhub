import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ImagePlus, Video, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { normalizeIndianPhone } from "@/lib/phone";
import {
  MAX_PHOTOS,
  uploadCattleFile,
  validatePhoto,
  validateVideo,
  deleteCattleFiles,
} from "@/lib/cattle-media";

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana",
  "Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur",
  "Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Jammu and Kashmir","Ladakh",
  "Puducherry","Chandigarh","Andaman and Nicobar","Dadra and Nagar Haveli","Lakshadweep",
];

const empty = {
  name: "", breed: "", type: "cow", listing_type: "sell",
  age: "", milk_yield: "", price: "",
  state: "", district: "", village: "", location: "",
  contact_phone: "", vaccination_status: "", health_status: "", description: "",
};

export default function CattleNew() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [form, setForm] = useState(empty);
  const [photos, setPhotos] = useState<string[]>([]);
  const [video, setVideo] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingListing, setLoadingListing] = useState(isEdit);

  useEffect(() => {
    if (!isEdit) {
      if (profile?.phone) setForm((f) => ({ ...f, contact_phone: f.contact_phone || profile.phone! }));
      return;
    }
    (async () => {
      const { data, error } = await supabase.from("cattle_listings").select("*").eq("id", id!).single();
      if (error || !data) { toast.error("Listing not found"); navigate("/my-listings"); return; }
      if (data.seller_id !== user?.id) { toast.error("Not your listing"); navigate("/my-listings"); return; }
      const d: any = data;
      setForm({
        name: d.name ?? "", breed: d.breed ?? "", type: d.type ?? "cow",
        listing_type: d.listing_type ?? "sell", age: d.age ?? "", milk_yield: d.milk_yield ?? "",
        price: String(d.price ?? ""), state: d.state ?? "", district: d.district ?? "",
        village: d.village ?? "", location: d.location ?? "", contact_phone: d.contact_phone ?? "",
        vaccination_status: d.vaccination_status ?? "", health_status: d.health_status ?? "",
        description: d.description ?? "",
      });
      setPhotos(d.photos ?? []);
      setVideo(d.video_url ?? null);
      setLoadingListing(false);
    })();
  }, [id, isEdit, user, profile, navigate]);

  const onPhotoFiles = async (files: FileList | null) => {
    if (!files || !user) return;
    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) { toast.error(`Max ${MAX_PHOTOS} photos`); return; }
    const toUpload = Array.from(files).slice(0, remaining);
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const f of toUpload) {
        const err = validatePhoto(f);
        if (err) { toast.error(`${f.name}: ${err}`); continue; }
        urls.push(await uploadCattleFile(user.id, f, "photo"));
      }
      setPhotos((p) => [...p, ...urls]);
    } catch (e: any) { toast.error(e.message); }
    finally { setUploading(false); }
  };

  const removePhoto = async (url: string) => {
    setPhotos((p) => p.filter((u) => u !== url));
    await deleteCattleFiles([url]);
  };

  const onVideoFile = async (file: File | null) => {
    if (!file || !user) return;
    const err = validateVideo(file);
    if (err) { toast.error(err); return; }
    setUploading(true);
    try {
      if (video) await deleteCattleFiles([video]);
      const url = await uploadCattleFile(user.id, file, "video");
      setVideo(url);
    } catch (e: any) { toast.error(e.message); }
    finally { setUploading(false); }
  };

  const removeVideo = async () => {
    if (!video) return;
    const v = video;
    setVideo(null);
    await deleteCattleFiles([v]);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const phone = normalizeIndianPhone(form.contact_phone);
    if (!phone) return toast.error("Enter a valid 10-digit Indian mobile");
    const price = parseFloat(form.price);
    if (!Number.isFinite(price) || price <= 0) return toast.error("Enter a valid price");
    if (photos.length === 0) return toast.error("Upload at least 1 photo");

    setSaving(true);
    const payload: any = {
      name: form.name.trim(), breed: form.breed.trim(), type: form.type,
      listing_type: form.listing_type, age: form.age.trim() || null,
      milk_yield: form.milk_yield.trim() || null, price,
      state: form.state.trim() || null, district: form.district.trim() || null,
      village: form.village.trim() || null, location: form.location.trim() || null,
      contact_phone: phone,
      vaccination_status: form.vaccination_status.trim() || null,
      health_status: form.health_status.trim() || null,
      description: form.description.trim() || null,
      photos, video_url: video, image_url: photos[0] ?? null,
    };

    let res;
    if (isEdit) {
      res = await supabase.from("cattle_listings").update(payload).eq("id", id!);
    } else {
      res = await supabase.from("cattle_listings").insert({ ...payload, seller_id: user.id });
    }
    setSaving(false);
    if (res.error) { toast.error(res.error.message); return; }
    toast.success(isEdit ? "Listing updated" : "Listing created");
    navigate("/my-listings");
  };

  if (loadingListing) {
    return <div className="container py-16 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="container max-w-3xl py-10">
      <h1 className="font-display text-3xl font-bold">{isEdit ? "Edit Listing" : "Sell Your Animal"}</h1>
      <p className="mt-1 text-muted-foreground">Add photos, a short video, and complete details so buyers can trust your listing.</p>

      <form onSubmit={submit} className="mt-8 space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">Photos & Video</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Photos ({photos.length}/{MAX_PHOTOS}) — JPG/PNG/WebP, up to 5 MB each</Label>
              <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {photos.map((url) => (
                  <div key={url} className="relative group aspect-square overflow-hidden rounded-lg border">
                    <img src={url} alt="" loading="lazy" className="h-full w-full object-cover" />
                    <button type="button" onClick={() => removePhoto(url)}
                      className="absolute right-1 top-1 rounded-full bg-background/90 p-1 opacity-0 transition group-hover:opacity-100">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {photos.length < MAX_PHOTOS && (
                  <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-muted-foreground transition hover:border-primary hover:text-primary">
                    <ImagePlus className="h-6 w-6" />
                    <span className="text-xs">Add photo</span>
                    <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden"
                      onChange={(e) => { onPhotoFiles(e.target.files); e.target.value = ""; }} />
                  </label>
                )}
              </div>
            </div>

            <div>
              <Label>Short Video (optional) — MP4/MOV/WebM, up to 30 MB</Label>
              <div className="mt-2">
                {video ? (
                  <div className="relative">
                    <video src={video} controls className="w-full max-h-72 rounded-lg border bg-black" />
                    <Button type="button" size="sm" variant="destructive" onClick={removeVideo} className="absolute right-2 top-2 gap-1">
                      <X className="h-3.5 w-3.5" /> Remove
                    </Button>
                  </div>
                ) : (
                  <label className="flex h-32 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-muted-foreground hover:border-primary hover:text-primary">
                    <Video className="h-6 w-6" />
                    <span className="text-sm">Tap to upload video</span>
                    <input type="file" accept="video/mp4,video/quicktime,video/webm" className="hidden"
                      onChange={(e) => onVideoFile(e.target.files?.[0] ?? null)} />
                  </label>
                )}
              </div>
            </div>

            {uploading && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading…</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Animal Information</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div><Label>Name</Label><Input className="mt-1.5" required maxLength={80} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="HF Cross Cow" /></div>
            <div><Label>Breed</Label><Input className="mt-1.5" required maxLength={80} value={form.breed} onChange={(e) => setForm({ ...form, breed: e.target.value })} placeholder="Holstein Friesian" /></div>
            <div>
              <Label>Animal Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cow">Cow</SelectItem>
                  <SelectItem value="buffalo">Buffalo</SelectItem>
                  <SelectItem value="calf">Calf</SelectItem>
                  <SelectItem value="goat">Goat</SelectItem>
                  <SelectItem value="sheep">Sheep</SelectItem>
                  <SelectItem value="hen">Hen</SelectItem>
                  <SelectItem value="rooster">Rooster (Cock)</SelectItem>
                  <SelectItem value="chicken">Chicken</SelectItem>
                  <SelectItem value="duck">Duck</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Listing</Label>
              <Select value={form.listing_type} onValueChange={(v) => setForm({ ...form, listing_type: v })}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sell">For Sale</SelectItem>
                  <SelectItem value="buy">Want to Buy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Age</Label><Input className="mt-1.5" maxLength={20} value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} placeholder="3 years" /></div>
            <div><Label>Milk Yield Per Day</Label><Input className="mt-1.5" maxLength={20} value={form.milk_yield} onChange={(e) => setForm({ ...form, milk_yield: e.target.value })} placeholder="15 L/day" /></div>
            <div><Label>Price (₹)</Label><Input className="mt-1.5" type="number" min="1" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="85000" /></div>
            <div><Label>Vaccination Status</Label><Input className="mt-1.5" maxLength={80} value={form.vaccination_status} onChange={(e) => setForm({ ...form, vaccination_status: e.target.value })} placeholder="FMD + HS done" /></div>
            <div className="sm:col-span-2"><Label>Health Status</Label><Input className="mt-1.5" maxLength={120} value={form.health_status} onChange={(e) => setForm({ ...form, health_status: e.target.value })} placeholder="Healthy, 2nd lactation, no mastitis" /></div>
            <div className="sm:col-span-2"><Label>Description</Label><Textarea className="mt-1.5" maxLength={500} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the animal..." /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Seller Information</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><Label>Farmer Name</Label><Input className="mt-1.5" value={profile?.full_name || ""} disabled /></div>
            <div><Label>Mobile Number</Label><Input className="mt-1.5" required inputMode="tel" maxLength={15} value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} placeholder="98765 43210" /></div>
            <div><Label>Village</Label><Input className="mt-1.5" maxLength={60} value={form.village} onChange={(e) => setForm({ ...form, village: e.target.value })} placeholder="Tenali" /></div>
            <div><Label>District</Label><Input className="mt-1.5" maxLength={60} value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} placeholder="Guntur" /></div>
            <div>
              <Label>State</Label>
              <Select value={form.state} onValueChange={(v) => setForm({ ...form, state: v })}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select state" /></SelectTrigger>
                <SelectContent>{INDIAN_STATES.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2"><Label>Full Address (optional)</Label><Input className="mt-1.5" maxLength={120} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" size="lg" disabled={saving || uploading} className="flex-1">
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Publish Listing"}
          </Button>
          <Button type="button" size="lg" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
