import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Stethoscope, ShieldCheck, ShieldAlert, ShieldQuestion, Clock, CheckCircle2, XCircle,
  Phone, MessageSquare, MapPin, AlertTriangle, FileText, Save, Loader2, CalendarDays,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { normalizeIndianPhone } from "@/lib/phone";

type Status = "pending" | "accepted" | "declined" | "completed" | "cancelled";

interface Appointment {
  id: string;
  farmer_id: string;
  vet_id: string;
  animal_type: string | null;
  symptoms: string;
  scheduled_at: string | null;
  mode: "in_person" | "online" | "emergency";
  status: Status;
  notes: string | null;
  prescription: string | null;
  contact_phone: string | null;
  location: string | null;
  created_at: string;
}

interface VetProfile {
  id: string;
  user_id: string;
  qualification: string | null;
  specialization: string | null;
  experience_years: number | null;
  license_number: string | null;
  verification_status: "pending" | "verified" | "rejected";
  bio: string | null;
  consultation_fee: number | null;
  available: boolean;
}

const STATUS_STYLES: Record<Status, string> = {
  pending: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  accepted: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  declined: "bg-rose-500/15 text-rose-700 border-rose-500/30",
  completed: "bg-sky-500/15 text-sky-700 border-sky-500/30",
  cancelled: "bg-muted text-muted-foreground border-border",
};

const MODE_LABEL = { in_person: "In-person", online: "Online", emergency: "Emergency" } as const;

export default function VetDashboard() {
  const { user, profile } = useAuth();
  const [profileRow, setProfileRow] = useState<VetProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [form, setForm] = useState({
    qualification: "", specialization: "", license_number: "",
    experience_years: "", consultation_fee: "", bio: "", available: true,
  });
  const [appts, setAppts] = useState<Appointment[]>([]);
  const [farmerNames, setFarmerNames] = useState<Record<string, string>>({});
  const [apptLoading, setApptLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});

  // Load vet profile
  useEffect(() => {
    if (!user) return;
    (async () => {
      setProfileLoading(true);
      const { data, error } = await supabase
        .from("vet_profiles" as any)
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) console.error("[vet] profile load", error);
      const row = data as VetProfile | null;
      setProfileRow(row);
      if (row) {
        setForm({
          qualification: row.qualification ?? "",
          specialization: row.specialization ?? "",
          license_number: row.license_number ?? "",
          experience_years: row.experience_years != null ? String(row.experience_years) : "",
          consultation_fee: row.consultation_fee != null ? String(row.consultation_fee) : "",
          bio: row.bio ?? "",
          available: row.available,
        });
      }
      setProfileLoading(false);
    })();
  }, [user]);

  // Load appointments
  const loadAppts = async () => {
    if (!user) return;
    setApptLoading(true);
    const { data, error } = await supabase
      .from("appointments" as any)
      .select("*")
      .eq("vet_id", user.id)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("[vet] appts load", error);
      toast.error("Could not load appointments");
    }
    const rows = (data ?? []) as Appointment[];
    setAppts(rows);
    // Resolve farmer display names
    const ids = Array.from(new Set(rows.map((r) => r.farmer_id)));
    if (ids.length) {
      const { data: names } = await supabase.rpc("get_display_names", { _ids: ids });
      const map: Record<string, string> = {};
      (names ?? []).forEach((n: any) => { map[n.user_id] = n.full_name || "Farmer"; });
      setFarmerNames(map);
    }
    setApptLoading(false);
  };

  useEffect(() => { loadAppts(); }, [user]);

  // Realtime: new requests appear instantly
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("appointments-vet")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments", filter: `vet_id=eq.${user.id}` },
        () => loadAppts(),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const saveProfile = async () => {
    if (!user) return;
    setProfileSaving(true);
    const payload: any = {
      user_id: user.id,
      qualification: form.qualification.trim() || null,
      specialization: form.specialization.trim() || null,
      license_number: form.license_number.trim() || null,
      experience_years: form.experience_years ? Number(form.experience_years) : null,
      consultation_fee: form.consultation_fee ? Number(form.consultation_fee) : null,
      bio: form.bio.trim() || null,
      available: form.available,
    };
    const { error } = await supabase
      .from("vet_profiles" as any)
      .upsert(payload, { onConflict: "user_id" });
    setProfileSaving(false);
    if (error) {
      console.error("[vet] save", error);
      toast.error("Could not save profile");
      return;
    }
    toast.success("Profile saved. Verification stays pending until reviewed.");
    const { data } = await supabase
      .from("vet_profiles" as any).select("*").eq("user_id", user.id).maybeSingle();
    setProfileRow(data as VetProfile);
  };

  const setStatus = async (a: Appointment, status: Status) => {
    setActingId(a.id);
    const patch: any = { status };
    if (status === "completed") {
      const note = noteDraft[a.id]?.trim();
      if (note) patch.prescription = note;
    }
    const { error } = await supabase
      .from("appointments" as any)
      .update(patch)
      .eq("id", a.id);
    setActingId(null);
    if (error) {
      console.error("[vet] update", error);
      toast.error("Could not update");
      return;
    }
    toast.success(`Marked ${status}`);
  };

  const tel = (p: string | null) => {
    if (!p) return;
    window.location.href = `tel:${p}`;
  };
  const whatsapp = (p: string | null, name: string) => {
    if (!p) return;
    const num = normalizeIndianPhone(p) ?? p;
    const text = `Hello ${name}, this is Dr. ${profile?.full_name || "your vet"} from Smart Dairy Hub regarding your appointment.`;
    window.open(`https://wa.me/${num.replace(/^\+/, "")}?text=${encodeURIComponent(text)}`, "_blank");
  };

  const counts = useMemo(() => {
    const c = { pending: 0, accepted: 0, completed: 0, emergency: 0 };
    appts.forEach((a) => {
      if (a.status === "pending") c.pending++;
      if (a.status === "accepted") c.accepted++;
      if (a.status === "completed") c.completed++;
      if (a.mode === "emergency" && a.status === "pending") c.emergency++;
    });
    return c;
  }, [appts]);

  const verifyBadge = () => {
    if (!profileRow) return null;
    const map = {
      verified: { Icon: ShieldCheck, label: "Verified", cls: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30" },
      pending: { Icon: ShieldQuestion, label: "Verification pending", cls: "bg-amber-500/15 text-amber-700 border-amber-500/30" },
      rejected: { Icon: ShieldAlert, label: "Verification rejected", cls: "bg-rose-500/15 text-rose-700 border-rose-500/30" },
    } as const;
    const v = map[profileRow.verification_status];
    return <Badge variant="outline" className={`gap-1 ${v.cls}`}><v.Icon className="h-3.5 w-3.5" />{v.label}</Badge>;
  };

  return (
    <div className="container max-w-6xl py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-rose-500/10 p-3 text-rose-600"><Stethoscope className="h-6 w-6" /></div>
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Veterinarian dashboard</h1>
            <p className="text-sm text-muted-foreground">Manage your profile, accept consultation requests and respond to emergencies.</p>
          </div>
        </div>
        {verifyBadge()}
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard Icon={Clock} label="Pending requests" value={counts.pending} tone="amber" />
        <StatCard Icon={CheckCircle2} label="Active appointments" value={counts.accepted} tone="emerald" />
        <StatCard Icon={CalendarDays} label="Completed" value={counts.completed} tone="sky" />
        <StatCard Icon={AlertTriangle} label="Emergency queue" value={counts.emergency} tone="rose" />
      </div>

      <Tabs defaultValue="requests">
        <TabsList>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="profile">My profile</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="mt-4 space-y-3">
          {apptLoading && <SkeletonList />}
          {!apptLoading && appts.filter((a) => a.status === "pending").length === 0 && (
            <EmptyState text="No pending requests right now. You're all caught up." />
          )}
          {appts.filter((a) => a.status === "pending").map((a) => (
            <AppointmentRow
              key={a.id} a={a} farmerName={farmerNames[a.farmer_id]} acting={actingId === a.id}
              onAccept={() => setStatus(a, "accepted")}
              onDecline={() => setStatus(a, "declined")}
              onCall={() => tel(a.contact_phone)}
              onWa={() => whatsapp(a.contact_phone, farmerNames[a.farmer_id] || "Farmer")}
            />
          ))}
        </TabsContent>

        <TabsContent value="active" className="mt-4 space-y-3">
          {apptLoading && <SkeletonList />}
          {!apptLoading && appts.filter((a) => a.status === "accepted").length === 0 && (
            <EmptyState text="No active appointments yet." />
          )}
          {appts.filter((a) => a.status === "accepted").map((a) => (
            <AppointmentRow
              key={a.id} a={a} farmerName={farmerNames[a.farmer_id]} acting={actingId === a.id}
              showPrescription
              noteValue={noteDraft[a.id] ?? ""}
              onNoteChange={(v) => setNoteDraft((s) => ({ ...s, [a.id]: v }))}
              onComplete={() => setStatus(a, "completed")}
              onCall={() => tel(a.contact_phone)}
              onWa={() => whatsapp(a.contact_phone, farmerNames[a.farmer_id] || "Farmer")}
            />
          ))}
        </TabsContent>

        <TabsContent value="history" className="mt-4 space-y-3">
          {apptLoading && <SkeletonList />}
          {!apptLoading && appts.filter((a) => ["completed","declined","cancelled"].includes(a.status)).length === 0 && (
            <EmptyState text="History will appear here after you complete or close appointments." />
          )}
          {appts.filter((a) => ["completed","declined","cancelled"].includes(a.status)).map((a) => (
            <AppointmentRow key={a.id} a={a} farmerName={farmerNames[a.farmer_id]} readOnly />
          ))}
        </TabsContent>

        <TabsContent value="profile" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Professional profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {profileLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
              ) : (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div><Label>Qualification *</Label>
                      <Input className="mt-1.5" placeholder="B.V.Sc & A.H" value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} />
                    </div>
                    <div><Label>Specialization</Label>
                      <Input className="mt-1.5" placeholder="Large animals / Dairy cattle" value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} />
                    </div>
                    <div><Label>License / Registration number *</Label>
                      <Input className="mt-1.5" placeholder="State VCI registration" value={form.license_number} onChange={(e) => setForm({ ...form, license_number: e.target.value })} />
                    </div>
                    <div><Label>Years of experience</Label>
                      <Input className="mt-1.5" inputMode="numeric" placeholder="e.g. 8" value={form.experience_years} onChange={(e) => setForm({ ...form, experience_years: e.target.value.replace(/[^0-9]/g, "") })} />
                    </div>
                    <div><Label>Consultation fee (₹)</Label>
                      <Input className="mt-1.5" inputMode="decimal" placeholder="e.g. 300" value={form.consultation_fee} onChange={(e) => setForm({ ...form, consultation_fee: e.target.value.replace(/[^0-9.]/g, "") })} />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <div className="text-sm font-medium">Accepting new appointments</div>
                        <div className="text-xs text-muted-foreground">Turn off when you're unavailable.</div>
                      </div>
                      <Switch checked={form.available} onCheckedChange={(v) => setForm({ ...form, available: v })} />
                    </div>
                  </div>
                  <div>
                    <Label>About</Label>
                    <Textarea className="mt-1.5" rows={4} placeholder="Brief bio — areas of expertise, languages spoken, service area." value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <p className="text-xs text-muted-foreground">
                      Submitting your profile sends it for verification. Once an admin verifies your license, farmers will see a "Verified" badge on your card.
                    </p>
                    <Button onClick={saveProfile} disabled={profileSaving || !form.qualification.trim() || !form.license_number.trim()} className="gap-2">
                      {profileSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Save profile
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ Icon, label, value, tone }: { Icon: any; label: string; value: number; tone: "amber" | "emerald" | "sky" | "rose" }) {
  const toneMap = {
    amber: "bg-amber-500/10 text-amber-700",
    emerald: "bg-emerald-500/10 text-emerald-700",
    sky: "bg-sky-500/10 text-sky-700",
    rose: "bg-rose-500/10 text-rose-700",
  };
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`rounded-lg p-2.5 ${toneMap[tone]}`}><Icon className="h-5 w-5" /></div>
        <div>
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">{text}</CardContent></Card>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <Card key={i}><CardContent className="h-24 animate-pulse bg-muted/30" /></Card>
      ))}
    </div>
  );
}

function AppointmentRow(props: {
  a: Appointment;
  farmerName?: string;
  acting?: boolean;
  readOnly?: boolean;
  showPrescription?: boolean;
  noteValue?: string;
  onNoteChange?: (v: string) => void;
  onAccept?: () => void;
  onDecline?: () => void;
  onComplete?: () => void;
  onCall?: () => void;
  onWa?: () => void;
}) {
  const { a, farmerName = "Farmer", acting, readOnly, showPrescription, noteValue = "", onNoteChange, onAccept, onDecline, onComplete, onCall, onWa } = props;
  const created = new Date(a.created_at);
  return (
    <Card className={a.mode === "emergency" && a.status === "pending" ? "border-rose-500/50" : ""}>
      <CardContent className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className="font-semibold">{farmerName}</div>
              <Badge variant="outline" className={STATUS_STYLES[a.status]}>{a.status}</Badge>
              <Badge variant="outline" className="gap-1">
                {a.mode === "emergency" ? <AlertTriangle className="h-3 w-3 text-rose-600" /> : null}
                {MODE_LABEL[a.mode]}
              </Badge>
              {a.animal_type && <Badge variant="secondary">{a.animal_type}</Badge>}
            </div>
            <p className="mt-2 text-sm">{a.symptoms}</p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {created.toLocaleString()}</span>
              {a.scheduled_at && (
                <span className="inline-flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {new Date(a.scheduled_at).toLocaleString()}</span>
              )}
              {a.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {a.location}</span>}
              {a.contact_phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" /> {a.contact_phone}</span>}
            </div>
            {a.prescription && (
              <div className="mt-3 rounded-md border bg-muted/40 p-2 text-sm">
                <div className="mb-1 inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground"><FileText className="h-3 w-3" /> Prescription / notes</div>
                {a.prescription}
              </div>
            )}
          </div>

          {!readOnly && (
            <div className="flex flex-col gap-2">
              {a.contact_phone && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={onCall} className="gap-1"><Phone className="h-4 w-4" /> Call</Button>
                  <Button size="sm" variant="outline" onClick={onWa} className="gap-1"><MessageSquare className="h-4 w-4" /> WhatsApp</Button>
                </div>
              )}
              {a.status === "pending" && (
                <div className="flex gap-2">
                  <Button size="sm" onClick={onAccept} disabled={acting} className="gap-1"><CheckCircle2 className="h-4 w-4" /> Accept</Button>
                  <Button size="sm" variant="destructive" onClick={onDecline} disabled={acting} className="gap-1"><XCircle className="h-4 w-4" /> Decline</Button>
                </div>
              )}
              {a.status === "accepted" && (
                <Button size="sm" onClick={onComplete} disabled={acting} className="gap-1"><CheckCircle2 className="h-4 w-4" /> Mark completed</Button>
              )}
            </div>
          )}
        </div>

        {showPrescription && a.status === "accepted" && (
          <div className="mt-3">
            <Label className="text-xs">Add prescription / consultation notes (saved when you complete the appointment)</Label>
            <Textarea className="mt-1.5" rows={3} placeholder="Diagnosis, prescription, follow-up advice…" value={noteValue} onChange={(e) => onNoteChange?.(e.target.value)} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
