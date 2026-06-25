import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Stethoscope, ShieldCheck, CalendarPlus, AlertTriangle, IndianRupee, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { normalizeIndianPhone } from "@/lib/phone";

interface VetRow {
  user_id: string;
  qualification: string | null;
  specialization: string | null;
  experience_years: number | null;
  consultation_fee: number | null;
  bio: string | null;
  full_name: string;
}

export default function BookVet() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [vets, setVets] = useState<VetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeVet, setActiveVet] = useState<VetRow | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    animal_type: "Cow",
    symptoms: "",
    mode: "in_person" as "in_person" | "online" | "emergency",
    contact_phone: "",
    location: "",
    scheduled_at: "",
  });

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: vps, error } = await supabase
        .from("vet_profiles" as any)
        .select("user_id,qualification,specialization,experience_years,consultation_fee,bio")
        .eq("verification_status", "verified")
        .eq("available", true);
      if (error) {
        console.error(error);
        toast.error("Could not load veterinarians");
        setLoading(false);
        return;
      }
      const rows = (vps ?? []) as any[];
      const ids = rows.map((r) => r.user_id);
      let names: Record<string, string> = {};
      if (ids.length) {
        const { data: dn } = await supabase.rpc("get_display_names", { _ids: ids });
        (dn ?? []).forEach((n: any) => { names[n.user_id] = n.full_name || "Veterinarian"; });
      }
      setVets(rows.map((r) => ({ ...r, full_name: names[r.user_id] || "Veterinarian" })));
      setLoading(false);
    })();
  }, []);

  const openBooking = (v: VetRow) => {
    if (!user) { navigate("/login"); return; }
    setActiveVet(v);
    setForm((f) => ({
      ...f,
      contact_phone: profile?.phone || "",
    }));
  };

  const submit = async () => {
    if (!user || !activeVet) return;
    const symptoms = form.symptoms.trim();
    if (symptoms.length < 5) { toast.error("Please describe the symptoms (at least 5 characters)"); return; }
    const phoneN = normalizeIndianPhone(form.contact_phone);
    if (!phoneN) { toast.error("Enter a valid 10-digit phone number"); return; }
    setSubmitting(true);
    const payload: any = {
      farmer_id: user.id,
      vet_id: activeVet.user_id,
      animal_type: form.animal_type,
      symptoms,
      mode: form.mode,
      contact_phone: phoneN,
      location: form.location.trim() || null,
      scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
    };
    const { error } = await supabase.from("appointments" as any).insert(payload);
    setSubmitting(false);
    if (error) {
      console.error(error);
      toast.error("Could not send request");
      return;
    }
    toast.success("Request sent — the vet has been notified.");
    setActiveVet(null);
    setForm({ animal_type: "Cow", symptoms: "", mode: "in_person", contact_phone: "", location: "", scheduled_at: "" });
  };

  return (
    <div className="container max-w-6xl py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-xl bg-rose-500/10 p-3 text-rose-600"><Stethoscope className="h-6 w-6" /></div>
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Book a veterinarian</h1>
          <p className="text-sm text-muted-foreground">Verified vets on Smart Dairy Hub. Send a consultation request and they will respond.</p>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0,1,2].map((i) => <Card key={i}><CardContent className="h-44 animate-pulse bg-muted/30" /></Card>)}
        </div>
      ) : vets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No verified vets are available right now. Please check back soon or browse the public directory.
            <div className="mt-4">
              <Button variant="outline" onClick={() => navigate("/vet-contacts")}>Open vet directory</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vets.map((v) => (
            <Card key={v.user_id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-start justify-between gap-2">
                  <span className="font-display text-lg">{v.full_name}</span>
                  <Badge variant="outline" className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-700">
                    <ShieldCheck className="h-3 w-3" /> Verified
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-2 text-sm">
                {v.qualification && <div><span className="font-medium">Qualification:</span> {v.qualification}</div>}
                {v.specialization && <div><span className="font-medium">Specialization:</span> {v.specialization}</div>}
                {v.experience_years != null && <div><span className="font-medium">Experience:</span> {v.experience_years} years</div>}
                {v.consultation_fee != null && (
                  <div className="inline-flex items-center gap-1 text-foreground">
                    <IndianRupee className="h-3.5 w-3.5" /> {v.consultation_fee} consultation fee
                  </div>
                )}
                {v.bio && <p className="line-clamp-3 text-muted-foreground">{v.bio}</p>}
                <div className="mt-auto pt-3">
                  <Button className="w-full gap-1.5" onClick={() => openBooking(v)}>
                    <CalendarPlus className="h-4 w-4" /> Request consultation
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!activeVet} onOpenChange={(o) => !o && setActiveVet(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Request consultation with {activeVet?.full_name}</DialogTitle>
            <DialogDescription>
              The vet will see your request immediately and respond with accept / decline.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Animal</Label>
                <Select value={form.animal_type} onValueChange={(v) => setForm({ ...form, animal_type: v })}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Cow","Buffalo","Goat","Sheep","Poultry","Other"].map((a) => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Mode</Label>
                <Select value={form.mode} onValueChange={(v: any) => setForm({ ...form, mode: v })}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_person">In-person visit</SelectItem>
                    <SelectItem value="online">Online consultation</SelectItem>
                    <SelectItem value="emergency"><span className="inline-flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-rose-600" /> Emergency</span></SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Symptoms / reason *</Label>
              <Textarea className="mt-1.5" rows={3} value={form.symptoms} onChange={(e) => setForm({ ...form, symptoms: e.target.value })} placeholder="e.g. Cow has been off feed for 2 days, mild fever, reduced milk yield." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Contact phone *</Label>
                <Input className="mt-1.5" inputMode="numeric" placeholder="10-digit mobile" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} />
              </div>
              <div>
                <Label>Preferred time (optional)</Label>
                <Input className="mt-1.5" type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Location / village (optional)</Label>
              <Input className="mt-1.5" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Village, mandal, district" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveVet(null)}>Cancel</Button>
            <Button onClick={submit} disabled={submitting} className="gap-2">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarPlus className="h-4 w-4" />}
              Send request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
