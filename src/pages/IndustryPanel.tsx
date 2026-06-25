import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Factory, Plus, Trash2, ImagePlus, Save, ShieldCheck, ShieldAlert, ShieldQuestion, FileText, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Company = {
  id: string; name: string; logo_url: string | null; description: string | null;
  address: string | null; village: string | null; district: string | null; state: string | null; pin_code: string | null;
  phone: string | null; email: string | null; working_hours: string | null; verified: boolean;
  verification_status: "pending" | "verified" | "rejected"; rejection_reason: string | null;
  registration_number: string | null; gst_number: string | null; business_doc_url: string | null;
  submitted_at: string | null; reviewed_at: string | null;
};

type Rate = {
  id: string; company_id: string; milk_type: "cow" | "buffalo";
  fat: number; snf: number; price_per_litre: number;
  effective_date: string; collection_timing: string | null; notes: string | null; updated_at: string;
};

export default function IndustryPanel() {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<Company | null>(null);
  const [rates, setRates] = useState<Rate[]>([]);

  useEffect(() => {
    if (!user) return;
    if (!hasRole("industry") && !hasRole("admin")) {
      toast.error("Industry role required to access this page.");
      navigate("/dashboard");
      return;
    }
    (async () => {
      setLoading(true);
      const { data: c } = await supabase.from("dairy_companies").select("*").eq("owner_id", user.id).maybeSingle();
      setCompany((c as Company) ?? null);
      if (c) {
        const { data: r } = await supabase.from("milk_rates").select("*").eq("company_id", c.id).order("effective_date", { ascending: false });
        setRates((r as Rate[]) ?? []);
      }
      setLoading(false);
    })();
  }, [user, hasRole, navigate]);

  if (loading) return <div className="container py-12 text-center text-muted-foreground">Loading…</div>;

  return (
    <div className="container max-w-5xl py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/15 text-primary"><Factory className="h-5 w-5" /></div>
        <div>
          <h1 className="font-display text-2xl font-bold">Industry Panel</h1>
          <p className="text-sm text-muted-foreground">Manage your dairy company and publish daily milk rates.</p>
        </div>
      </div>

      {company && <VerificationBanner company={company} />}

      <CompanyForm company={company} onSaved={(c) => setCompany(c)} />

      {company && (
        <div className="mt-8">
          {company.verification_status === "verified" ? (
            <RatesManager company={company} rates={rates} onChange={setRates} />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground"><Lock className="h-6 w-6" /></div>
                <h3 className="font-display text-lg font-semibold">Publishing is locked</h3>
                <p className="max-w-md text-sm text-muted-foreground">
                  You'll be able to publish milk rates and announcements once an admin verifies your company details
                  (registration, GST, contact). Make sure the form above is complete and submitted.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function VerificationBanner({ company }: { company: Company }) {
  const status = company.verification_status;
  if (status === "verified") {
    return (
      <Card className="mb-6 border-emerald-500/40 bg-emerald-50/60">
        <CardContent className="flex items-start gap-3 p-4 text-sm">
          <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-700" />
          <div>
            <p className="font-semibold text-emerald-800">Company verified</p>
            <p className="text-emerald-800/80">You can publish milk rates, bonuses and announcements. Editing key business details will send your profile back for re-review.</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  if (status === "rejected") {
    return (
      <Card className="mb-6 border-destructive/40 bg-destructive/5">
        <CardContent className="flex items-start gap-3 p-4 text-sm">
          <ShieldAlert className="mt-0.5 h-5 w-5 text-destructive" />
          <div>
            <p className="font-semibold text-destructive">Verification rejected</p>
            <p className="text-destructive/90">Reason: {company.rejection_reason || "Not specified"}. Update your details below and resubmit for review.</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="mb-6 border-amber-500/40 bg-amber-50/60">
      <CardContent className="flex items-start gap-3 p-4 text-sm">
        <ShieldQuestion className="mt-0.5 h-5 w-5 text-amber-700" />
        <div>
          <p className="font-semibold text-amber-800">Verification pending</p>
          <p className="text-amber-800/80">An admin is reviewing your registration, GST, and contact details. Publishing is disabled until your company is verified.</p>
        </div>
      </CardContent>
    </Card>
  );
}

function CompanyForm({ company, onSaved }: { company: Company | null; onSaved: (c: Company) => void }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: company?.name ?? "",
    description: company?.description ?? "",
    address: company?.address ?? "",
    village: company?.village ?? "",
    district: company?.district ?? "",
    state: company?.state ?? "",
    pin_code: company?.pin_code ?? "",
    phone: company?.phone ?? "",
    email: company?.email ?? "",
    working_hours: company?.working_hours ?? "",
    logo_url: company?.logo_url ?? "",
    registration_number: company?.registration_number ?? "",
    gst_number: company?.gst_number ?? "",
    business_doc_url: company?.business_doc_url ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const uploadLogo = async (file: File) => {
    if (!user) return;
    setUploading(true);
    const path = `${user.id}/dairy-logo-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
    const { error } = await supabase.storage.from("images").upload(path, file, { upsert: false });
    if (error) { toast.error("Upload failed"); setUploading(false); return; }
    const { data } = supabase.storage.from("images").getPublicUrl(path);
    setForm((f) => ({ ...f, logo_url: data.publicUrl }));
    setUploading(false);
  };

  const save = async () => {
    if (!user) return;
    if (!form.name.trim()) return toast.error("Company name is required");
    setSaving(true);
    if (company) {
      const { data, error } = await supabase.from("dairy_companies").update(form).eq("id", company.id).select("*").single();
      setSaving(false);
      if (error) return toast.error(error.message);
      onSaved(data as Company);
      toast.success("Company updated");
    } else {
      const { data, error } = await supabase.from("dairy_companies").insert({ ...form, owner_id: user.id }).select("*").single();
      setSaving(false);
      if (error) return toast.error(error.message);
      onSaved(data as Company);
      toast.success("Company created");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Factory className="h-5 w-5" /> Company profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          {form.logo_url ? (
            <img src={form.logo_url} alt="Logo" className="h-16 w-16 rounded-md object-cover" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-md bg-muted text-muted-foreground"><Factory className="h-6 w-6" /></div>
          )}
          <label className="cursor-pointer">
            <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadLogo(f); }} />
            <Button asChild variant="outline" size="sm" disabled={uploading}>
              <span className="gap-2"><ImagePlus className="h-4 w-4" />{uploading ? "Uploading…" : form.logo_url ? "Change logo" : "Upload logo"}</span>
            </Button>
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Company name *"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={120} /></Field>
          <Field label="Phone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} maxLength={20} /></Field>
          <Field label="Email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} maxLength={200} /></Field>
          <Field label="Working hours"><Input placeholder="6 AM – 10 AM, 4 PM – 7 PM" value={form.working_hours} onChange={(e) => setForm({ ...form, working_hours: e.target.value })} maxLength={120} /></Field>
          <Field label="Village / Center"><Input value={form.village} onChange={(e) => setForm({ ...form, village: e.target.value })} maxLength={120} /></Field>
          <Field label="District"><Input value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} maxLength={120} /></Field>
          <Field label="State"><Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} maxLength={120} /></Field>
          <Field label="PIN code"><Input value={form.pin_code} onChange={(e) => setForm({ ...form, pin_code: e.target.value })} maxLength={10} /></Field>
        </div>
        <Field label="Address"><Textarea rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} maxLength={400} /></Field>
        <Field label="About the company"><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={800} /></Field>

        <div className="rounded-lg border bg-muted/30 p-4">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold"><FileText className="h-4 w-4" /> Business verification</p>
          <p className="mb-3 text-xs text-muted-foreground">An admin reviews these details before your company can publish rates. Required for verification.</p>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Company registration number"><Input placeholder="e.g. CIN / Society reg. no." value={form.registration_number} onChange={(e) => setForm({ ...form, registration_number: e.target.value })} maxLength={64} /></Field>
            <Field label="GSTIN"><Input placeholder="15-digit GST number" value={form.gst_number} onChange={(e) => setForm({ ...form, gst_number: e.target.value.toUpperCase() })} maxLength={15} /></Field>
          </div>
          <div className="mt-3">
            <Label className="mb-1.5 block text-xs">Business document URL (registration / GST certificate, PDF or image link)</Label>
            <Input placeholder="https://…" value={form.business_doc_url} onChange={(e) => setForm({ ...form, business_doc_url: e.target.value })} maxLength={500} />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={save} disabled={saving} className="gap-2"><Save className="h-4 w-4" />{saving ? "Saving…" : company ? "Save changes" : "Submit for verification"}</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 block text-xs">{label}</Label>
      {children}
    </div>
  );
}

function RatesManager({ company, rates, onChange }: { company: Company; rates: Rate[]; onChange: (r: Rate[]) => void }) {
  const empty = {
    milk_type: "cow" as "cow" | "buffalo",
    fat: "3.5",
    snf: "8.5",
    price_per_litre: "",
    effective_date: new Date().toISOString().slice(0, 10),
    collection_timing: "",
    notes: "",
  };
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const refresh = async () => {
    const { data } = await supabase.from("milk_rates").select("*").eq("company_id", company.id).order("effective_date", { ascending: false });
    onChange((data as Rate[]) ?? []);
  };

  const add = async () => {
    const price = parseFloat(form.price_per_litre);
    const fat = parseFloat(form.fat);
    const snf = parseFloat(form.snf);
    if (!isFinite(price) || price <= 0) return toast.error("Enter a valid price");
    if (!isFinite(fat) || fat <= 0 || fat > 15) return toast.error("FAT must be between 0 and 15");
    if (!isFinite(snf) || snf <= 0 || snf > 15) return toast.error("SNF must be between 0 and 15");
    setSaving(true);
    const { error } = await supabase.from("milk_rates").insert({
      company_id: company.id,
      milk_type: form.milk_type,
      fat, snf, price_per_litre: price,
      effective_date: form.effective_date,
      collection_timing: form.collection_timing || null,
      notes: form.notes || null,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Rate published");
    setForm(empty);
    refresh();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this rate?")) return;
    const { error } = await supabase.from("milk_rates").delete().eq("id", id);
    if (error) return toast.error(error.message);
    refresh();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Publish today's rates</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-7">
          <div className="md:col-span-1">
            <Label className="mb-1.5 block text-xs">Milk</Label>
            <Select value={form.milk_type} onValueChange={(v) => setForm({ ...form, milk_type: v as any })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cow">Cow</SelectItem>
                <SelectItem value="buffalo">Buffalo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Field label="FAT %"><Input inputMode="decimal" value={form.fat} onChange={(e) => setForm({ ...form, fat: e.target.value })} /></Field>
          <Field label="SNF %"><Input inputMode="decimal" value={form.snf} onChange={(e) => setForm({ ...form, snf: e.target.value })} /></Field>
          <Field label="₹/Litre"><Input inputMode="decimal" placeholder="42.00" value={form.price_per_litre} onChange={(e) => setForm({ ...form, price_per_litre: e.target.value })} /></Field>
          <Field label="Effective"><Input type="date" value={form.effective_date} onChange={(e) => setForm({ ...form, effective_date: e.target.value })} /></Field>
          <Field label="Timing"><Input placeholder="Morning / Evening" value={form.collection_timing} onChange={(e) => setForm({ ...form, collection_timing: e.target.value })} /></Field>
          <div className="flex items-end">
            <Button className="w-full gap-2" onClick={add} disabled={saving}><Plus className="h-4 w-4" />{saving ? "Saving…" : "Publish"}</Button>
          </div>
        </div>
        <Field label="Notes (optional)"><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} maxLength={300} /></Field>

        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs">
              <tr>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">FAT</th>
                <th className="px-3 py-2">SNF</th>
                <th className="px-3 py-2">₹/L</th>
                <th className="px-3 py-2">Timing</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {rates.length === 0 ? (
                <tr><td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">No rates published yet.</td></tr>
              ) : rates.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-3 py-2">{r.effective_date}</td>
                  <td className="px-3 py-2"><Badge variant="outline">{r.milk_type}</Badge></td>
                  <td className="px-3 py-2">{r.fat}</td>
                  <td className="px-3 py-2">{r.snf}</td>
                  <td className="px-3 py-2 font-semibold">₹{Number(r.price_per_litre).toFixed(2)}</td>
                  <td className="px-3 py-2 text-muted-foreground">{r.collection_timing || "—"}</td>
                  <td className="px-3 py-2 text-right">
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
