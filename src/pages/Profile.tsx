import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  User as UserIcon, Save, MapPin, Phone, Mail, Languages as LangIcon,
  Milk, Wheat, Stethoscope, Heart, IndianRupee, Camera, ImagePlus, LogOut, ShoppingCart, ShieldCheck, Sparkles,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuthModal } from "@/components/auth/AuthModalProvider";
import { toast } from "sonner";
import { LANGUAGES, type LanguageCode } from "@/locales";
import { Link } from "react-router-dom";
import farmBg from "@/assets/bg-farm-soft.jpg";
import farmerAvatar from "@/assets/farmer-avatar.png";


type FarmExtras = {
  avatar_url?: string;
  village?: string;
  mandal?: string;
  district?: string;
  state?: string;
  pin_code?: string;
  farm_name?: string;
  dairy_type?: string;
  total_animals?: number;
  cow_count?: number;
  buffalo_count?: number;
  poultry_count?: number;
  today_collection?: number;
  monthly_income?: number;
  vaccinations?: string;
  feed_schedule?: string;
  health_notes?: string;
};

const KEY = (uid: string) => `sdh_farm_profile_${uid}`;

function loadExtras(uid: string): FarmExtras {
  try { const r = localStorage.getItem(KEY(uid)); return r ? JSON.parse(r) : {}; } catch { return {}; }
}
function saveExtras(uid: string, v: FarmExtras) {
  try { localStorage.setItem(KEY(uid), JSON.stringify(v)); } catch {}
}

export default function Profile() {
  const { user, profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [language, setLanguage] = useState<LanguageCode>(((profile?.language as LanguageCode) || "en"));
  const [extras, setExtras] = useState<FarmExtras>(() => (user ? loadExtras(user.id) : {}));
  const [saving, setSaving] = useState(false);
  const [favListings, setFavListings] = useState<number>(0);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name || "");
    setPhone(profile.phone || "");
    setLanguage(((profile.language as LanguageCode) || "en"));
  }, [profile]);

  useEffect(() => { if (user) setExtras(loadExtras(user.id)); }, [user]);

  useEffect(() => {
    if (!user) return;
    supabase.from("cattle_favorites").select("listing_id", { count: "exact", head: true }).eq("user_id", user.id)
      .then(({ count }) => setFavListings(count || 0));
  }, [user]);

  const updateExtra = <K extends keyof FarmExtras>(k: K, v: FarmExtras[K]) => {
    setExtras((p) => {
      const next = { ...p, [k]: v };
      if (user) saveExtras(user.id, next);
      return next;
    });
  };

  const onAvatarFile = async (file: File) => {
    if (!user) return;
    if (file.size > 2 * 1024 * 1024) return toast.error("Image must be under 2 MB");
    const path = `${user.id}/avatar-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
    const { error } = await supabase.storage.from("images").upload(path, file, { upsert: true });
    if (error) return toast.error(error.message);
    const { data: pub } = supabase.storage.from("images").getPublicUrl(path);
    updateExtra("avatar_url", pub.publicUrl);
    await supabase.from("profiles").update({ avatar_url: pub.publicUrl } as any).eq("user_id", user.id);
    await refreshProfile();
    toast.success("Profile photo updated");
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const location = [extras.village, extras.mandal, extras.district, extras.state, extras.pin_code].filter(Boolean).join(", ");
    const { error } = await supabase.from("profiles").update({
      full_name: fullName, phone, language, location,
    } as any).eq("user_id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    if (user) saveExtras(user.id, extras);
    await refreshProfile();
    toast.success("Profile saved");
  };

  const initials = useMemo(() => (fullName || "U").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase(), [fullName]);

  if (!user) return <SignedOutProfile />;

  const locationLabel = [extras.village, extras.mandal, extras.district, extras.state, extras.pin_code].filter(Boolean).join(", ");

  return (
    <div className="relative">
      {/* Premium blurred farm backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[320px] overflow-hidden">
        <img src={farmBg} alt="" width={1600} height={912} className="h-full w-full scale-105 object-cover blur-[2px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/25 via-background/70 to-background" />
      </div>

      <div className="container relative max-w-4xl py-6">
        {/* Hero identity card */}
        <section className="mb-6 overflow-hidden rounded-3xl border border-white/40 bg-white/60 p-5 shadow-xl backdrop-blur-xl dark:bg-card/60">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-primary/10 ring-4 ring-primary/25">
              {extras.avatar_url ? (
                <img src={extras.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <img src={farmerAvatar} alt="" width={1024} height={1024} loading="lazy" className="h-full w-full object-cover" />
              )}
              <label className="absolute bottom-0 right-0 cursor-pointer rounded-full bg-primary p-1.5 text-primary-foreground shadow-md hover:opacity-90">
                <Camera className="h-3.5 w-3.5" />
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onAvatarFile(e.target.files[0])} />
              </label>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <h1 className="font-display text-2xl font-bold sm:text-3xl">{fullName || "Add your name"}</h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                  <ShieldCheck className="h-3 w-3" /> Verified Farmer
                </span>
              </div>
              {extras.farm_name && <p className="text-sm font-medium text-primary">{extras.farm_name}</p>}
              <p className="mt-0.5 flex flex-wrap items-center justify-center gap-1 text-xs text-muted-foreground sm:justify-start">
                <MapPin className="h-3.5 w-3.5" /> {locationLabel || "Add your village & district"}
              </p>
              <p className="text-xs text-muted-foreground break-all">{user.email}</p>
            </div>
            <Button onClick={save} disabled={saving} className="rounded-full shadow-md">
              <Save className="mr-2 h-4 w-4" /> {saving ? "Saving…" : "Save"}
            </Button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="Cows" value={extras.cow_count ?? 0} />
            <Stat label="Buffalo" value={extras.buffalo_count ?? 0} />
            <Stat label="Poultry" value={extras.poultry_count ?? 0} />
            <Stat label="Saved" value={favListings} />
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <Link to="/my-listings" className="rounded-xl border bg-card/70 px-3 py-2 text-center text-xs font-medium transition hover:border-primary hover:bg-primary/5">
              <Heart className="mx-auto mb-0.5 h-4 w-4 text-primary" /> Saved listings: {favListings}
            </Link>
            <Link to="/my-appointments" className="rounded-xl border bg-card/70 px-3 py-2 text-center text-xs font-medium transition hover:border-primary hover:bg-primary/5">
              <Stethoscope className="mx-auto mb-0.5 h-4 w-4 text-primary" /> Vet appointments
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-center text-xs font-semibold text-destructive transition hover:bg-destructive/10"
            >
              <LogOut className="mx-auto mb-0.5 h-4 w-4" /> Sign Out
            </button>
          </div>
        </section>

      <div className="grid gap-5">
        <div className="space-y-5">

          {/* Personal */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><UserIcon className="h-4 w-4" /> Personal Info</CardTitle></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <Field label="Full Name"><Input value={fullName} onChange={(e) => setFullName(e.target.value)} /></Field>
              <Field label="Mobile Number" icon={<Phone className="h-3.5 w-3.5" />}><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit mobile" /></Field>
              <Field label="Email" icon={<Mail className="h-3.5 w-3.5" />}><Input value={user.email || ""} disabled /></Field>
              <Field label="Preferred Language" icon={<LangIcon className="h-3.5 w-3.5" />}>
                <Select value={language} onValueChange={(v) => setLanguage(v as LanguageCode)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{LANGUAGES.map((l) => <SelectItem key={l.code} value={l.code}>{l.native}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
            </CardContent>
          </Card>

          {/* Address */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><MapPin className="h-4 w-4" /> Address</CardTitle></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <Field label="Village"><Input value={extras.village || ""} onChange={(e) => updateExtra("village", e.target.value)} /></Field>
              <Field label="Mandal"><Input value={extras.mandal || ""} onChange={(e) => updateExtra("mandal", e.target.value)} /></Field>
              <Field label="District"><Input value={extras.district || ""} onChange={(e) => updateExtra("district", e.target.value)} /></Field>
              <Field label="State"><Input value={extras.state || ""} onChange={(e) => updateExtra("state", e.target.value)} /></Field>
              <Field label="PIN Code"><Input inputMode="numeric" maxLength={6} value={extras.pin_code || ""} onChange={(e) => updateExtra("pin_code", e.target.value.replace(/\D/g, "").slice(0, 6))} /></Field>
            </CardContent>
          </Card>

          {/* Farm */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Wheat className="h-4 w-4" /> Farm Details</CardTitle></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <Field label="Farm Name"><Input value={extras.farm_name || ""} onChange={(e) => updateExtra("farm_name", e.target.value)} /></Field>
              <Field label="Dairy Type">
                <Select value={extras.dairy_type || ""} onValueChange={(v) => updateExtra("dairy_type", v)}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cow">Cow</SelectItem>
                    <SelectItem value="buffalo">Buffalo</SelectItem>
                    <SelectItem value="mixed">Cow + Buffalo</SelectItem>
                    <SelectItem value="poultry">Poultry</SelectItem>
                    <SelectItem value="mixed_all">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Cow Count"><Input type="number" min={0} value={extras.cow_count ?? ""} onChange={(e) => updateExtra("cow_count", Number(e.target.value) || 0)} /></Field>
              <Field label="Buffalo Count"><Input type="number" min={0} value={extras.buffalo_count ?? ""} onChange={(e) => updateExtra("buffalo_count", Number(e.target.value) || 0)} /></Field>
              <Field label="Poultry Count"><Input type="number" min={0} value={extras.poultry_count ?? ""} onChange={(e) => updateExtra("poultry_count", Number(e.target.value) || 0)} /></Field>
              <Field label="Total Animals"><Input type="number" min={0} value={extras.total_animals ?? ""} onChange={(e) => updateExtra("total_animals", Number(e.target.value) || 0)} /></Field>
            </CardContent>
          </Card>

          {/* Production */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Milk className="h-4 w-4" /> Milk Production & Income</CardTitle></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <Field label="Today's Collection (Litres)"><Input type="number" min={0} step="0.1" value={extras.today_collection ?? ""} onChange={(e) => updateExtra("today_collection", Number(e.target.value) || 0)} /></Field>
              <Field label="Monthly Income Summary" icon={<IndianRupee className="h-3.5 w-3.5" />}><Input type="number" min={0} value={extras.monthly_income ?? ""} onChange={(e) => updateExtra("monthly_income", Number(e.target.value) || 0)} /></Field>
            </CardContent>
          </Card>

          {/* Records */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Stethoscope className="h-4 w-4" /> Health & Care Records</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Field label="Vaccination Records"><Textarea rows={3} value={extras.vaccinations || ""} onChange={(e) => updateExtra("vaccinations", e.target.value)} placeholder="e.g., FMD vaccine on 10 May, Brucellosis on 12 June…" /></Field>
              <Field label="Feed Schedule"><Textarea rows={3} value={extras.feed_schedule || ""} onChange={(e) => updateExtra("feed_schedule", e.target.value)} placeholder="Morning: 2 kg concentrate + green fodder; Evening: silage…" /></Field>
              <Field label="Animal Health Notes"><Textarea rows={3} value={extras.health_notes || ""} onChange={(e) => updateExtra("health_notes", e.target.value)} placeholder="Recent illnesses, calving, mastitis history…" /></Field>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Link to="/cattle-market" className="text-sm text-primary underline-offset-4 hover:underline"><ShoppingCart className="mr-1 inline h-4 w-4" /> My listings</Link>
            <Button onClick={save} disabled={saving}><Save className="mr-2 h-4 w-4" /> {saving ? "Saving…" : "Save changes"}</Button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );

}

function SignedOutProfile() {
  const { openAuth, isAuthOpen } = useAuthModal();
  const navigate = useNavigate();
  const openedRef = useRef(false);

  useEffect(() => {
    if (!openedRef.current) {
      openedRef.current = true;
      openAuth("/profile");
    }
  }, [openAuth]);

  // If the user dismisses the modal without signing in, go back Home
  useEffect(() => {
    if (openedRef.current && !isAuthOpen) {
      const t = setTimeout(() => navigate("/", { replace: true }), 150);
      return () => clearTimeout(t);
    }
  }, [isAuthOpen, navigate]);


  return (
    <div className="relative flex min-h-[80svh] items-center justify-center overflow-hidden px-4 py-10">
      <img src={farmBg} alt="" width={1600} height={912} className="absolute inset-0 h-full w-full scale-105 object-cover blur-[3px]" />
      <div className="absolute inset-0 bg-gradient-to-b from-primary/30 via-background/60 to-background" />

      <div className="relative w-full max-w-sm">
        <img
          src={farmerAvatar}
          alt="Smart Dairy Hub farmer"
          width={1024}
          height={1024}
          className="mx-auto -mb-10 h-40 w-40 drop-shadow-2xl"
        />
        <div className="rounded-3xl border border-white/50 bg-white/60 p-6 pt-14 text-center shadow-2xl backdrop-blur-2xl dark:bg-card/60">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary">
            <Sparkles className="h-3 w-3" /> Farmer Portal
          </span>
          <h1 className="mt-2 font-display text-2xl font-bold">Welcome to your farm</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to manage your herd, milk income, orders and vet appointments.
          </p>

          <div className="mt-6 space-y-2.5">
            <Button onClick={() => openAuth("/profile")} className="h-12 w-full rounded-2xl text-base font-semibold shadow-lg transition-transform duration-200 hover:-translate-y-0.5">
              Sign In / Create Account
            </Button>
          </div>

          <p className="mt-5 text-[11px] text-muted-foreground">
            Secure authentication • Google protected • Trusted by farmers
          </p>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          {[
            { icon: Milk, label: "Milk income" },
            { icon: Stethoscope, label: "Vet booking" },
            { icon: ShieldCheck, label: "Verified deals" },
          ].map((f) => (
            <div key={f.label} className="rounded-2xl border border-white/50 bg-white/50 p-3 backdrop-blur-xl dark:bg-card/50">
              <f.icon className="mx-auto mb-1 h-4 w-4 text-primary" />
              <span className="text-[11px] font-medium text-muted-foreground">{f.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}



function Field({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">{icon}{label}</Label>
      {children}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-card px-2 py-1.5">
      <div className="text-sm font-bold text-primary">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}
