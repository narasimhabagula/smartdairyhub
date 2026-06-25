import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ImagePlus, Video, X, Loader2, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { normalizeIndianPhone } from "@/lib/phone";
import {
  MAX_PHOTOS, uploadCattleFile, validatePhoto, validateVideo, deleteCattleFiles,
} from "@/lib/cattle-media";

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana",
  "Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur",
  "Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Jammu and Kashmir","Ladakh",
  "Puducherry","Chandigarh","Andaman and Nicobar","Dadra and Nagar Haveli","Lakshadweep",
];

const ANIMAL_OPTIONS = [
  { id: "cow", label: "🐄 Cow" },
  { id: "buffalo", label: "🐃 Buffalo" },
  { id: "hen", label: "🐔 Hen" },
  { id: "rooster", label: "🐓 Cock (Rooster)" },
];

type AnimalType = "cow" | "buffalo" | "hen" | "rooster";

type FormState = {
  type: AnimalType;
  name: string;
  breed: string;
  age: string;
  gender: string;
  milk_yield: string;
  fat: string;
  snf: string;
  health_status: string;
  vaccination_status: string;
  weight: string;
  lactation_number: string;
  egg_laying: string;
  eggs_per_week: string;
  pregnancy_status: string;
  quantity: string;
  price: string;
  negotiable: boolean;
  state: string;
  district: string;
  village: string;
  location: string;
  gps_lat: string;
  gps_lng: string;
  seller_name: string;
  contact_phone: string;
  whatsapp_phone: string;
  description: string;
};

const empty: FormState = {
  type: "cow", name: "", breed: "", age: "", gender: "", milk_yield: "",
  fat: "", snf: "", health_status: "", vaccination_status: "", weight: "",
  lactation_number: "", egg_laying: "", eggs_per_week: "", pregnancy_status: "", quantity: "",
  price: "", negotiable: false,
  state: "", district: "", village: "", location: "", gps_lat: "", gps_lng: "",
  seller_name: "", contact_phone: "", whatsapp_phone: "",
  description: "",
};

export default function CattleNew() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [form, setForm] = useState<FormState>(empty);
  const [photos, setPhotos] = useState<string[]>([]);
  const [video, setVideo] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [loadingListing, setLoadingListing] = useState(isEdit);

  useEffect(() => {
    if (!isEdit) {
      setForm((f) => ({
        ...f,
        contact_phone: f.contact_phone || profile?.phone || "",
        seller_name: f.seller_name || profile?.full_name || "",
      }));
      return;
    }
    (async () => {
      const { data, error } = await supabase.from("cattle_listings").select("*").eq("id", id!).single();
      if (error || !data) { toast.error("Listing not found"); navigate("/my-listings"); return; }
      if (data.seller_id !== user?.id) { toast.error("Not your listing"); navigate("/my-listings"); return; }
      const d: any = data;
      const a = d.attrs || {};
      setForm({
        type: (d.type ?? "cow") as AnimalType,
        name: d.name ?? "", breed: d.breed ?? "", age: d.age ?? "",
        gender: a.gender ?? "", milk_yield: d.milk_yield ?? "",
        fat: a.fat ?? "", snf: a.snf ?? "",
        health_status: d.health_status ?? "", vaccination_status: d.vaccination_status ?? "",
        weight: d.weight ?? "", lactation_number: a.lactation_number ?? "",
        egg_laying: a.egg_laying ?? "", eggs_per_week: a.eggs_per_week ?? "",
        pregnancy_status: a.pregnancy_status ?? "",
        quantity: d.quantity != null ? String(d.quantity) : "",
        price: String(d.price ?? ""), negotiable: !!d.negotiable,
        state: d.state ?? "", district: d.district ?? "", village: d.village ?? "",
        location: d.location ?? "",
        gps_lat: d.gps_lat != null ? String(d.gps_lat) : "",
        gps_lng: d.gps_lng != null ? String(d.gps_lng) : "",
        seller_name: a.seller_name ?? profile?.full_name ?? "",
        contact_phone: d.contact_phone ?? "",
        whatsapp_phone: d.whatsapp_phone ?? "",
        description: d.description ?? "",
      });
      setPhotos(d.photos ?? []);
      setVideo(d.video_url ?? null);
      setLoadingListing(false);
    })();
  }, [id, isEdit, user, profile, navigate]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  const onPhotoFiles = async (files: FileList | null) => {
    if (!files || !user) return;
    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) { toast.error(`Max ${MAX_PHOTOS} photos`); return; }
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const f of Array.from(files).slice(0, remaining)) {
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
      setVideo(await uploadCattleFile(user.id, file, "video"));
    } catch (e: any) { toast.error(e.message); }
    finally { setUploading(false); }
  };
  const removeVideo = async () => {
    if (!video) return;
    const v = video; setVideo(null); await deleteCattleFiles([v]);
  };

  const captureGPS = () => {
    if (!navigator.geolocation) return toast.error("Geolocation not supported");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set("gps_lat", pos.coords.latitude.toFixed(6));
        set("gps_lng", pos.coords.longitude.toFixed(6));
        setLocating(false);
        toast.success("GPS location captured");
      },
      () => { setLocating(false); toast.error("Couldn't get your location"); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const phone = normalizeIndianPhone(form.contact_phone);
    if (!phone) return toast.error("Enter a valid 10-digit Indian mobile");
    const wa = form.whatsapp_phone.trim() ? normalizeIndianPhone(form.whatsapp_phone) : phone;
    if (form.whatsapp_phone.trim() && !wa) return toast.error("Enter a valid WhatsApp number");
    const price = parseFloat(form.price);
    if (!Number.isFinite(price) || price <= 0) return toast.error("Enter a valid price");
    if (photos.length === 0) return toast.error("Upload at least 1 photo");

    // Build attrs based on animal type
    const attrs: Record<string, any> = { seller_name: form.seller_name.trim() || null };
    if (form.type === "cow") {
      Object.assign(attrs, {
        gender: form.gender || null,
        fat: form.fat || null,
        snf: form.snf || null,
        lactation_number: form.lactation_number || null,
        pregnancy_status: form.pregnancy_status || null,
      });
    } else if (form.type === "buffalo") {
      Object.assign(attrs, {
        fat: form.fat || null,
        pregnancy_status: form.pregnancy_status || null,
      });
    } else if (form.type === "hen") {
      Object.assign(attrs, {
        egg_laying: form.egg_laying || null,
        eggs_per_week: form.eggs_per_week || null,
      });
    }

    const payload: any = {
      type: form.type,
      name: form.name.trim(),
      breed: form.breed.trim() || null,
      listing_type: "sell",
      age: form.age.trim() || null,
      milk_yield: (form.type === "cow" || form.type === "buffalo") ? (form.milk_yield.trim() || null) : null,
      weight: form.weight.trim() || null,
      quantity: (form.type === "hen" || form.type === "rooster") && form.quantity ? Number(form.quantity) : null,
      price, negotiable: !!form.negotiable,
      state: form.state.trim() || null,
      district: form.district.trim() || null,
      village: form.village.trim() || null,
      location: form.location.trim() || null,
      gps_lat: form.gps_lat ? Number(form.gps_lat) : null,
      gps_lng: form.gps_lng ? Number(form.gps_lng) : null,
      contact_phone: phone,
      whatsapp_phone: wa,
      vaccination_status: form.vaccination_status.trim() || null,
      health_status: form.health_status.trim() || null,
      description: form.description.trim() || null,
      attrs,
      photos, video_url: video, image_url: photos[0] ?? null,
    };

    setSaving(true);
    const res = isEdit
      ? await supabase.from("cattle_listings").update(payload).eq("id", id!)
      : await supabase.from("cattle_listings").insert({ ...payload, seller_id: user.id });
    setSaving(false);
    if (res.error) return toast.error(res.error.message);
    toast.success(isEdit ? "Listing updated" : "Listing created");
    navigate("/my-listings");
  };

  if (loadingListing) {
    return <div className="container py-16 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin" /></div>;
  }

  const t = form.type;
  const isCow = t === "cow";
  const isBuf = t === "buffalo";
  const isHen = t === "hen";
  const isRooster = t === "rooster";
  const isPoultry = isHen || isRooster;
  const isDairy = isCow || isBuf;

  return (
    <div className="container max-w-3xl py-10">
      <h1 className="font-display text-3xl font-bold">{isEdit ? "Edit Listing" : "Sell Your Animal"}</h1>
      <p className="mt-1 text-muted-foreground">Choose the animal you're selling — the form will adapt to the right fields.</p>

      <form onSubmit={submit} className="mt-8 space-y-6">
        {/* Animal type */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Animal Type</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {ANIMAL_OPTIONS.map((a) => (
                <button type="button" key={a.id}
                  onClick={() => set("type", a.id as AnimalType)}
                  className={`rounded-lg border p-3 text-sm transition ${
                    t === a.id ? "border-primary bg-primary/10 font-semibold" : "hover:bg-muted"
                  }`}>
                  {a.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Media */}
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
                  <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-muted-foreground hover:border-primary hover:text-primary">
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

        {/* Animal-specific fields */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Animal Information</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Title / Name *</Label>
              <Input className="mt-1.5" required maxLength={100} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder={isCow ? "Lakshmi (HF Cross)" : isBuf ? "Murrah Buffalo" : isHen ? "Aseel Hen batch" : "Country Rooster"} />
            </div>
            <div>
              <Label>Breed</Label>
              <Input className="mt-1.5" maxLength={80} value={form.breed} onChange={(e) => set("breed", e.target.value)} />
            </div>
            <div>
              <Label>Age</Label>
              <Input className="mt-1.5" maxLength={40} value={form.age} onChange={(e) => set("age", e.target.value)} placeholder="e.g. 3 years" />
            </div>

            {isCow && (
              <div>
                <Label>Gender</Label>
                <Select value={form.gender} onValueChange={(v) => set("gender", v)}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {isDairy && (
              <div>
                <Label>Milk Yield (Litres/Day)</Label>
                <Input className="mt-1.5" value={form.milk_yield} onChange={(e) => set("milk_yield", e.target.value)} placeholder="e.g. 12" />
              </div>
            )}
            {isCow && (
              <>
                <div>
                  <Label>FAT %</Label>
                  <Input className="mt-1.5" value={form.fat} onChange={(e) => set("fat", e.target.value)} placeholder="e.g. 4.2" />
                </div>
                <div>
                  <Label>SNF %</Label>
                  <Input className="mt-1.5" value={form.snf} onChange={(e) => set("snf", e.target.value)} placeholder="e.g. 8.5" />
                </div>
                <div>
                  <Label>Lactation Number</Label>
                  <Input className="mt-1.5" value={form.lactation_number} onChange={(e) => set("lactation_number", e.target.value)} placeholder="e.g. 2nd" />
                </div>
              </>
            )}
            {isBuf && (
              <div>
                <Label>FAT %</Label>
                <Input className="mt-1.5" value={form.fat} onChange={(e) => set("fat", e.target.value)} placeholder="e.g. 7.0" />
              </div>
            )}

            {isHen && (
              <>
                <div>
                  <Label>Egg Laying</Label>
                  <Select value={form.egg_laying} onValueChange={(v) => set("egg_laying", v)}>
                    <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Average Eggs / Week</Label>
                  <Input className="mt-1.5" value={form.eggs_per_week} onChange={(e) => set("eggs_per_week", e.target.value)} placeholder="e.g. 5" />
                </div>
              </>
            )}

            <div>
              <Label>Weight</Label>
              <Input className="mt-1.5" value={form.weight} onChange={(e) => set("weight", e.target.value)} placeholder={isPoultry ? "e.g. 2.5 kg" : "e.g. 350 kg"} />
            </div>

            {isPoultry && (
              <div>
                <Label>Quantity Available</Label>
                <Input type="number" min={1} className="mt-1.5" value={form.quantity} onChange={(e) => set("quantity", e.target.value)} placeholder="e.g. 20" />
              </div>
            )}

            <div>
              <Label>Health Status</Label>
              <Input className="mt-1.5" value={form.health_status} onChange={(e) => set("health_status", e.target.value)} placeholder="e.g. Healthy" />
            </div>
            <div>
              <Label>Vaccination Status</Label>
              <Input className="mt-1.5" value={form.vaccination_status} onChange={(e) => set("vaccination_status", e.target.value)} placeholder="e.g. Up to date" />
            </div>
          </CardContent>
        </Card>

        {/* Price */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Price</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Price (₹) *</Label>
              <Input type="number" min={1} required className="mt-1.5" value={form.price} onChange={(e) => set("price", e.target.value)} />
            </div>
            <label className="flex items-center gap-2 mt-7">
              <Checkbox checked={form.negotiable} onCheckedChange={(v) => set("negotiable", !!v)} />
              <span className="text-sm">Price is negotiable</span>
            </label>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Location</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>State</Label>
              <Select value={form.state} onValueChange={(v) => set("state", v)}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select state" /></SelectTrigger>
                <SelectContent>{INDIAN_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>District</Label>
              <Input className="mt-1.5" value={form.district} onChange={(e) => set("district", e.target.value)} />
            </div>
            <div>
              <Label>Village / Town</Label>
              <Input className="mt-1.5" value={form.village} onChange={(e) => set("village", e.target.value)} />
            </div>
            <div>
              <Label>Landmark / Address</Label>
              <Input className="mt-1.5" value={form.location} onChange={(e) => set("location", e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Label>GPS Latitude</Label>
                  <Input className="mt-1.5" value={form.gps_lat} onChange={(e) => set("gps_lat", e.target.value)} placeholder="optional" />
                </div>
                <div className="flex-1">
                  <Label>GPS Longitude</Label>
                  <Input className="mt-1.5" value={form.gps_lng} onChange={(e) => set("gps_lng", e.target.value)} placeholder="optional" />
                </div>
                <Button type="button" variant="outline" onClick={captureGPS} disabled={locating} className="gap-1.5">
                  {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                  Use my location
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Seller contact */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Seller Contact</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Seller Name</Label>
              <Input className="mt-1.5" value={form.seller_name} onChange={(e) => set("seller_name", e.target.value)} />
            </div>
            <div>
              <Label>Contact Number *</Label>
              <Input required className="mt-1.5" value={form.contact_phone} onChange={(e) => set("contact_phone", e.target.value)} placeholder="10-digit mobile" />
            </div>
            <div>
              <Label>WhatsApp Number</Label>
              <Input className="mt-1.5" value={form.whatsapp_phone} onChange={(e) => set("whatsapp_phone", e.target.value)} placeholder="Leave blank to use contact number" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Description</CardTitle></CardHeader>
          <CardContent>
            <Textarea rows={5} maxLength={2000} value={form.description} onChange={(e) => set("description", e.target.value)}
              placeholder="Add any other details that will help buyers decide." />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit" disabled={saving || uploading} className="gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? "Save Changes" : "Publish Listing"}
          </Button>
        </div>
      </form>
    </div>
  );
}
