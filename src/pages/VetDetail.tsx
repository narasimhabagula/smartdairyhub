import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft, Clock, MapPin, Navigation, Phone, MessageCircle, Star, Stethoscope,
  ShieldCheck, CalendarPlus, IndianRupee, Loader2, AlertCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { friendlyError } from "@/lib/errors";
import { normalizeIndianPhone, telHref, waHref } from "@/lib/phone";
import {
  describeDay, isOpenNow, parseOpeningHours, slotsForDate, todayHours, type DayHours,
} from "@/lib/vetHours";

type VetRow = {
  id: string;
  name: string;
  qualification: string | null;
  specialization: string | null;
  location: string | null;
  hospital_name: string | null;
  address: string | null;
  district: string | null;
  village: string | null;
  google_maps_url: string | null;
  latitude: number | null;
  longitude: number | null;
  rating: number | null;
  total_ratings: number | null;
  available: boolean | null;
  opening_hours: unknown;
  consultation_fee: number | null;
  experience_years: number | null;
  bio: string | null;
  image_url: string | null;
};

const COLUMNS =
  "id,name,qualification,specialization,location,hospital_name,address,district,village,google_maps_url,latitude,longitude,rating,total_ratings,available,opening_hours,consultation_fee,experience_years,bio,image_url";

const ANIMAL_TYPES = ["Cow", "Buffalo", "Goat", "Sheep", "Poultry", "Other"] as const;
const MODES = [
  { value: "in_person", label: "Visit clinic" },
  { value: "online", label: "Phone / video" },
  { value: "emergency", label: "Emergency" },
] as const;

function directionsHref(v: VetRow) {
  if (v.google_maps_url) return v.google_maps_url;
  if (v.latitude != null && v.longitude != null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${v.latitude},${v.longitude}`;
  }
  const q = [v.hospital_name, v.address, v.village, v.district, v.name].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

function nextDays(count = 7) {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    d.setHours(0, 0, 0, 0);
    return d;
  });
}

export default function VetDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [vet, setVet] = useState<VetRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [contact, setContact] = useState<{ phone: string | null; email: string | null } | null>(null);

  const [dayIndex, setDayIndex] = useState(0);
  const [slot, setSlot] = useState("");
  const [animalType, setAnimalType] = useState<string>("Cow");
  const [mode, setMode] = useState<string>("in_person");
  const [symptoms, setSymptoms] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("vet_doctors_public" as never)
        .select(COLUMNS)
        .eq("id", id)
        .maybeSingle();
      if (cancelled) return;
      if (error) toast.error(friendlyError(error, "Couldn't open this doctor's profile."));
      if (!data) setNotFound(true);
      setVet((data as unknown as VetRow) ?? null);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [id]);

  // Phone/email are PII: the RPC returns rows only to admins and the suggester.
  useEffect(() => {
    if (!id || !user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.rpc("get_vet_contact" as never, { _vet_id: id } as never);
      if (cancelled) return;
      const rows = (data ?? []) as unknown as Array<{ phone?: string | null; email?: string | null }>;
      const row = Array.isArray(rows) ? rows[0] : undefined;
      if (row) setContact({ phone: row.phone ?? null, email: row.email ?? null });
    })();
    return () => { cancelled = true; };
  }, [id, user]);

  useEffect(() => {
    if (profile?.phone && !phone) setPhone(profile.phone);
  }, [profile?.phone]);

  const hours: DayHours[] | null = useMemo(() => parseOpeningHours(vet?.opening_hours), [vet?.opening_hours]);
  const openNow = useMemo(() => isOpenNow(hours), [hours]);
  const today = useMemo(() => todayHours(hours), [hours]);

  const days = useMemo(() => nextDays(7), []);
  const selectedDate = days[dayIndex] ?? days[0];
  const slots = useMemo(() => slotsForDate(hours, selectedDate), [hours, selectedDate]);

  useEffect(() => { setSlot(""); }, [dayIndex]);

  const book = useCallback(async () => {
    if (!vet) return;
    if (!user) {
      navigate(`/login?next=${encodeURIComponent(`/vet/${vet.id}`)}`);
      return;
    }
    if (symptoms.trim().length < 10) {
      toast.error("Please describe the symptoms in at least 10 characters.");
      return;
    }
    const normalized = normalizeIndianPhone(phone);
    if (!normalized) {
      toast.error("Enter a valid 10-digit mobile number so the clinic can reach you.");
      return;
    }
    let scheduledAt: string | null = null;
    if (slot) {
      const [h, m] = slot.split(":").map(Number);
      const d = new Date(selectedDate);
      d.setHours(h, m, 0, 0);
      scheduledAt = d.toISOString();
    }
    setSubmitting(true);
    const { error } = await supabase.from("appointments" as never).insert({
      farmer_id: user.id,
      directory_vet_id: vet.id,
      animal_type: animalType,
      mode,
      symptoms: symptoms.trim(),
      contact_phone: normalized,
      location: [vet.hospital_name, vet.address].filter(Boolean).join(", ") || vet.location,
      scheduled_at: scheduledAt,
      status: "pending",
    } as never);
    setSubmitting(false);
    if (error) {
      toast.error(friendlyError(error, "Couldn't send your booking request. Please try again."));
      return;
    }
    toast.success("Booking request sent. You can track it in My Appointments.");
    setSymptoms("");
    setSlot("");
  }, [vet, user, symptoms, phone, slot, selectedDate, animalType, mode, navigate]);

  if (loading) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-64 rounded-2xl lg:col-span-2" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (notFound || !vet) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-16 text-center">
        <Stethoscope className="mx-auto h-12 w-12 text-muted-foreground" />
        <h1 className="mt-4 font-display text-2xl font-bold">This doctor is no longer listed</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The profile may have been removed or is awaiting approval.
        </p>
        <Button className="mt-6" asChild><Link to="/vet-contacts">Back to veterinary support</Link></Button>
      </div>
    );
  }

  const fullAddress = [vet.address, vet.village, vet.district].filter(Boolean).join(", ") || vet.location;
  const initials = vet.name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6 sm:py-8">
      <Button variant="ghost" size="sm" className="mb-4 gap-1.5 -ml-2" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      {/* Header */}
      <Card className="overflow-hidden rounded-2xl border-border/60">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:p-6">
          {vet.image_url ? (
            <img src={vet.image_url} alt={vet.name} className="h-20 w-20 shrink-0 rounded-2xl object-cover ring-1 ring-primary/10" />
          ) : (
            <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 font-display text-2xl font-bold text-primary ring-1 ring-primary/10">
              {initials || <Stethoscope className="h-8 w-8" />}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-xl font-bold leading-tight sm:text-2xl">{vet.name}</h1>
            {vet.hospital_name && <p className="mt-0.5 text-sm text-muted-foreground">{vet.hospital_name}</p>}
            <p className="mt-1 text-xs text-muted-foreground">
              {[vet.qualification, vet.specialization, vet.experience_years ? `${vet.experience_years} yrs experience` : null]
                .filter(Boolean).join(" · ")}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {vet.rating != null && (
                <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-50 px-1.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                  <Star className="h-3 w-3 fill-current" />{vet.rating.toFixed(1)}
                  {vet.total_ratings ? <span className="font-normal opacity-70">·{vet.total_ratings}</span> : null}
                </span>
              )}
              {openNow === true && <Badge className="border-0 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Open now</Badge>}
              {openNow === false && <Badge variant="secondary" className="bg-rose-100 text-rose-700 hover:bg-rose-100">Closed now</Badge>}
              {openNow == null && <Badge variant="outline" className="font-normal text-muted-foreground">Hours not provided</Badge>}
              {vet.available && <Badge variant="outline" className="gap-1 border-primary/30 text-primary"><ShieldCheck className="h-3 w-3" /> Accepting cases</Badge>}
              {vet.consultation_fee != null && (
                <Badge variant="outline" className="gap-0.5 font-normal"><IndianRupee className="h-3 w-3" />{vet.consultation_fee} consultation</Badge>
              )}
            </div>
          </div>
          <div className="flex w-full gap-2 sm:w-auto sm:flex-col">
            {contact?.phone ? (
              <>
                <Button className="flex-1 gap-1.5" asChild>
                  <a href={telHref(contact.phone)}><Phone className="h-4 w-4" /> Call</a>
                </Button>
                <Button variant="outline" className="flex-1 gap-1.5" asChild>
                  <a href={waHref(contact.phone)} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-4 w-4" /> WhatsApp</a>
                </Button>
              </>
            ) : null}
            <Button variant="outline" className="flex-1 gap-1.5" asChild>
              <a href={directionsHref(vet)} target="_blank" rel="noopener noreferrer"><Navigation className="h-4 w-4" /> Directions</a>
            </Button>
          </div>
        </div>
      </Card>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        {/* Left: clinic info */}
        <div className="space-y-5 lg:col-span-2">
          <Card className="rounded-2xl border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 font-display text-lg"><Clock className="h-4 w-4 text-primary" /> Clinic hours</CardTitle>
            </CardHeader>
            <CardContent>
              {hours ? (
                <>
                  {today && (
                    <p className="mb-3 rounded-lg bg-muted/50 p-3 text-sm">
                      <span className="font-medium">Today ({today.label}):</span>{" "}
                      {describeDay(today)}
                    </p>
                  )}
                  <ul className="divide-y text-sm">
                    {hours.map((d) => (
                      <li key={d.day} className="flex items-center justify-between gap-4 py-2">
                        <span className={d.day === today?.day ? "font-medium" : "text-muted-foreground"}>{d.label}</span>
                        <span className={d.closed ? "text-muted-foreground" : ""}>{describeDay(d)}</span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <div className="flex items-start gap-2 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>This clinic hasn't shared its opening hours yet. Please call before visiting, or send a booking request below and the clinic will confirm a time.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 font-display text-lg"><MapPin className="h-4 w-4 text-primary" /> Address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {fullAddress ? (
                <p>{fullAddress}</p>
              ) : (
                <p className="text-muted-foreground">Address not shared. Use directions to reach the clinic area.</p>
              )}
              {vet.latitude != null && vet.longitude != null && (
                <iframe
                  title={`Map of ${vet.name}`}
                  loading="lazy"
                  className="h-56 w-full rounded-xl border"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps?q=${vet.latitude},${vet.longitude}&z=15&output=embed`}
                />
              )}
              {vet.bio && <p className="pt-1 text-muted-foreground">{vet.bio}</p>}
            </CardContent>
          </Card>
        </div>

        {/* Right: booking */}
        <Card className="h-fit rounded-2xl border-border/60 lg:sticky lg:top-24">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 font-display text-lg"><CalendarPlus className="h-4 w-4 text-primary" /> Book an appointment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Date</Label>
              <div className="grid grid-cols-4 gap-1.5">
                {days.map((d, i) => {
                  const dayInfo = todayHours(hours, d);
                  const closed = dayInfo?.closed === true;
                  return (
                    <button
                      key={d.toISOString()}
                      type="button"
                      onClick={() => setDayIndex(i)}
                      className={`rounded-lg border p-1.5 text-center text-xs transition-colors ${
                        i === dayIndex ? "border-primary bg-primary/10 font-medium text-primary" : "hover:bg-muted"
                      } ${closed ? "opacity-50" : ""}`}
                    >
                      <span className="block">{d.toLocaleDateString("en-IN", { weekday: "short" })}</span>
                      <span className="block font-semibold">{d.getDate()}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Time</Label>
              {slots.length > 0 ? (
                <div className="grid grid-cols-3 gap-1.5">
                  {slots.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSlot(s)}
                      className={`rounded-lg border py-1.5 text-xs transition-colors ${
                        slot === s ? "border-primary bg-primary/10 font-medium text-primary" : "hover:bg-muted"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="rounded-lg bg-muted/50 p-2.5 text-xs text-muted-foreground">
                  {hours
                    ? "No slots on this day. Pick another date, or send the request and the clinic will suggest a time."
                    : "The clinic will confirm a time with you after you send this request."}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Animal</Label>
                <Select value={animalType} onValueChange={setAnimalType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ANIMAL_TYPES.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={mode} onValueChange={setMode}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MODES.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="vet-symptoms">What's wrong?</Label>
              <Textarea
                id="vet-symptoms"
                rows={3}
                maxLength={1000}
                placeholder="e.g. Cow off feed since yesterday, swollen udder, low milk"
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="vet-phone">Your mobile number</Label>
              <Input id="vet-phone" inputMode="tel" placeholder="10-digit mobile" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>

            <Button className="w-full gap-1.5" onClick={book} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarPlus className="h-4 w-4" />}
              {user ? "Send booking request" : "Login to book"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              The clinic confirms every request. Track it in{" "}
              <Link to="/my-appointments" className="underline underline-offset-2">My Appointments</Link>.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
