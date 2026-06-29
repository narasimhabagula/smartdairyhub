import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Droplets, Plus, Pencil, Trash2, Search, Filter, Save, X, Lock,
  ShieldCheck, ShieldAlert, ShieldQuestion, Factory, RotateCcw,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Company = {
  id: string;
  name: string;
  state: string | null;
  district: string | null;
  village: string | null;
  verification_status: "pending" | "verified" | "rejected";
  rejection_reason: string | null;
};

type Rate = {
  id: string;
  company_id: string;
  milk_type: "cow" | "buffalo";
  fat: number;
  snf: number;
  price_per_litre: number;
  bonus: number | null;
  effective_date: string;
  effective_time: string | null;
  collection_timing: string | null;
  notes: string | null;
  updated_at: string;
};

type FormState = {
  milk_type: "cow" | "buffalo";
  fat: string;
  snf: string;
  price_per_litre: string;
  bonus: string;
  effective_date: string;
  collection_timing: string;
  branch: string;
  notes: string;
};

const emptyForm: FormState = {
  milk_type: "cow",
  fat: "3.5",
  snf: "8.5",
  price_per_litre: "",
  bonus: "",
  effective_date: new Date().toISOString().slice(0, 10),
  collection_timing: "morning",
  branch: "",
  notes: "",
};

export default function MilkRateManagement() {
  const { user, hasRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<Company | null>(null);
  const [rates, setRates] = useState<Rate[]>([]);

  // Filters
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "cow" | "buffalo">("all");
  const [filterDate, setFilterDate] = useState("");
  const [minFat, setMinFat] = useState("");
  const [minSnf, setMinSnf] = useState("");

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Rate | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/login");
      return;
    }
    if (!hasRole("industry") && !hasRole("admin")) {
      toast.error("Industry account required for Milk Rate Management.");
      navigate("/milk-rates");
      return;
    }
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data: c } = await supabase
      .from("dairy_companies")
      .select("id,name,state,district,village,verification_status,rejection_reason")
      .eq("owner_id", user.id)
      .maybeSingle();
    setCompany((c as Company) ?? null);
    if (c) {
      const { data: r } = await supabase
        .from("milk_rates")
        .select("*")
        .eq("company_id", (c as Company).id)
        .order("effective_date", { ascending: false })
        .order("updated_at", { ascending: false });
      setRates((r as Rate[]) ?? []);
    } else {
      setRates([]);
    }
    setLoading(false);
  };

  const filtered = useMemo(() => {
    return rates.filter((r) => {
      if (filterType !== "all" && r.milk_type !== filterType) return false;
      if (filterDate && r.effective_date !== filterDate) return false;
      if (minFat && r.fat < parseFloat(minFat)) return false;
      if (minSnf && r.snf < parseFloat(minSnf)) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const hay = `${r.milk_type} ${r.notes ?? ""} ${r.collection_timing ?? ""} ${r.effective_date}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rates, filterType, filterDate, minFat, minSnf, search]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (r: Rate) => {
    setEditing(r);
    setForm({
      milk_type: r.milk_type,
      fat: String(r.fat),
      snf: String(r.snf),
      price_per_litre: String(r.price_per_litre),
      bonus: r.bonus != null ? String(r.bonus) : "",
      effective_date: r.effective_date,
      collection_timing: r.collection_timing || "morning",
      branch: company?.village || "",
      notes: r.notes || "",
    });
    setDialogOpen(true);
  };

  const validate = (f: FormState): string | null => {
    const price = parseFloat(f.price_per_litre);
    const fat = parseFloat(f.fat);
    const snf = parseFloat(f.snf);
    if (!isFinite(price) || price <= 0) return "Enter a valid price per litre (> 0)";
    if (!isFinite(fat) || fat < 1 || fat > 15) return "FAT must be between 1 and 15";
    if (!isFinite(snf) || snf < 1 || snf > 15) return "SNF must be between 1 and 15";
    if (f.bonus && (!isFinite(parseFloat(f.bonus)) || parseFloat(f.bonus) < 0)) return "Bonus must be 0 or more";
    if (!f.effective_date) return "Effective date is required";
    return null;
  };

  const submit = async () => {
    if (!company) return;
    const err = validate(form);
    if (err) return toast.error(err);
    setSaving(true);
    const branchNote = form.branch.trim() ? `Branch: ${form.branch.trim()}` : "";
    const fullNote = [branchNote, form.notes.trim()].filter(Boolean).join(" • ") || null;
    const payload = {
      milk_type: form.milk_type,
      fat: parseFloat(form.fat),
      snf: parseFloat(form.snf),
      price_per_litre: parseFloat(form.price_per_litre),
      bonus: form.bonus ? parseFloat(form.bonus) : null,
      effective_date: form.effective_date,
      collection_timing: form.collection_timing || null,
      notes: fullNote,
    };
    if (editing) {
      const { error } = await supabase.from("milk_rates").update(payload).eq("id", editing.id);
      setSaving(false);
      if (error) return toast.error(error.message);
      toast.success("Milk rate updated & published");
    } else {
      const { error } = await supabase.from("milk_rates").insert({ company_id: company.id, ...payload });
      setSaving(false);
      if (error) return toast.error(error.message);
      toast.success("Milk rate published");
    }
    setDialogOpen(false);
    void load();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("milk_rates").delete().eq("id", deleteId);
    setDeleteId(null);
    if (error) return toast.error(error.message);
    toast.success("Rate deleted");
    void load();
  };

  const resetFilters = () => {
    setSearch(""); setFilterType("all"); setFilterDate(""); setMinFat(""); setMinSnf("");
  };

  if (authLoading || loading) {
    return <div className="container py-12 text-center text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="container max-w-6xl py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Droplets className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">Milk Rate Management</h1>
            <p className="text-sm text-muted-foreground">
              Industry portal · Add, update and publish milk rates farmers can view instantly.
            </p>
          </div>
        </div>
        <Button onClick={openAdd} className="gap-2" disabled={!company || company.verification_status !== "verified"}>
          <Plus className="h-4 w-4" /> Add Milk Rate
        </Button>
      </div>

      {!company ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Factory className="h-6 w-6" />
            </div>
            <h3 className="font-display text-lg font-semibold">Set up your dairy company first</h3>
            <p className="max-w-md text-sm text-muted-foreground">
              Add your dairy/industry profile in the Industry Panel to start publishing milk rates.
            </p>
            <Button onClick={() => navigate("/industry")} className="mt-2">Go to Industry Panel</Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <CompanyStatus company={company} />

          {company.verification_status !== "verified" ? (
            <Card className="mt-4">
              <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Lock className="h-6 w-6" />
                </div>
                <h3 className="font-display text-lg font-semibold">Publishing is locked</h3>
                <p className="max-w-md text-sm text-muted-foreground">
                  An admin will verify your company before you can publish rates.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Filters */}
              <Card className="mt-4">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Filter className="h-4 w-4" /> Search & Filter
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search by notes, session, date…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-5">
                    <div>
                      <Label className="mb-1.5 block text-xs">Milk type</Label>
                      <Select value={filterType} onValueChange={(v) => setFilterType(v as any)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="cow">Cow</SelectItem>
                          <SelectItem value="buffalo">Buffalo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="mb-1.5 block text-xs">Effective date</Label>
                      <Input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
                    </div>
                    <div>
                      <Label className="mb-1.5 block text-xs">Min FAT</Label>
                      <Input inputMode="decimal" placeholder="e.g. 3.5" value={minFat} onChange={(e) => setMinFat(e.target.value)} />
                    </div>
                    <div>
                      <Label className="mb-1.5 block text-xs">Min SNF</Label>
                      <Input inputMode="decimal" placeholder="e.g. 8.5" value={minSnf} onChange={(e) => setMinSnf(e.target.value)} />
                    </div>
                    <div className="flex items-end">
                      <Button variant="outline" onClick={resetFilters} className="w-full gap-2">
                        <RotateCcw className="h-4 w-4" /> Reset
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Rates table */}
              <Card className="mt-4">
                <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
                  <CardTitle className="text-base">Published Milk Rates</CardTitle>
                  <Badge variant="secondary">{filtered.length} of {rates.length}</Badge>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto rounded-md border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/40 text-left text-xs">
                        <tr>
                          <th className="px-3 py-2">Date</th>
                          <th className="px-3 py-2">Type</th>
                          <th className="px-3 py-2">Session</th>
                          <th className="px-3 py-2">FAT</th>
                          <th className="px-3 py-2">SNF</th>
                          <th className="px-3 py-2">₹/L</th>
                          <th className="px-3 py-2">Bonus</th>
                          <th className="px-3 py-2">Notes</th>
                          <th className="px-3 py-2">Updated</th>
                          <th className="px-3 py-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.length === 0 ? (
                          <tr>
                            <td colSpan={10} className="px-3 py-8 text-center text-muted-foreground">
                              No rates found. Click "Add Milk Rate" to publish your first rate.
                            </td>
                          </tr>
                        ) : filtered.map((r) => (
                          <tr key={r.id} className="border-t">
                            <td className="px-3 py-2">{r.effective_date}</td>
                            <td className="px-3 py-2"><Badge variant="outline" className="capitalize">{r.milk_type}</Badge></td>
                            <td className="px-3 py-2 capitalize">{r.collection_timing || "—"}</td>
                            <td className="px-3 py-2">{r.fat}</td>
                            <td className="px-3 py-2">{r.snf}</td>
                            <td className="px-3 py-2 font-semibold">₹{Number(r.price_per_litre).toFixed(2)}</td>
                            <td className="px-3 py-2">{r.bonus != null ? `₹${Number(r.bonus).toFixed(2)}` : "—"}</td>
                            <td className="px-3 py-2 max-w-[220px] truncate text-muted-foreground" title={r.notes || ""}>{r.notes || "—"}</td>
                            <td className="px-3 py-2 text-xs text-muted-foreground">{new Date(r.updated_at).toLocaleString()}</td>
                            <td className="px-3 py-2 text-right whitespace-nowrap">
                              <Button size="sm" variant="ghost" onClick={() => openEdit(r)} aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
                              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setDeleteId(r.id)} aria-label="Delete">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}

      {/* Add/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editing ? <><Pencil className="h-4 w-4" /> Edit Milk Rate</> : <><Plus className="h-4 w-4" /> Add Milk Rate</>}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Industry / Dairy">
                <Input value={company?.name || ""} disabled />
              </FormField>
              <FormField label="State">
                <Input value={company?.state || ""} disabled />
              </FormField>
              <FormField label="District">
                <Input value={company?.district || ""} disabled />
              </FormField>
              <FormField label="Collection Center / Branch">
                <Input
                  value={form.branch}
                  onChange={(e) => setForm({ ...form, branch: e.target.value })}
                  placeholder={company?.village || "e.g. Main center"}
                  maxLength={120}
                />
              </FormField>
              <FormField label="Milk type *">
                <Select value={form.milk_type} onValueChange={(v) => setForm({ ...form, milk_type: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cow">Cow</SelectItem>
                    <SelectItem value="buffalo">Buffalo</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Session">
                <Select value={form.collection_timing} onValueChange={(v) => setForm({ ...form, collection_timing: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Morning</SelectItem>
                    <SelectItem value="evening">Evening</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="FAT % *">
                <Input inputMode="decimal" value={form.fat} onChange={(e) => setForm({ ...form, fat: e.target.value })} />
              </FormField>
              <FormField label="SNF % *">
                <Input inputMode="decimal" value={form.snf} onChange={(e) => setForm({ ...form, snf: e.target.value })} />
              </FormField>
              <FormField label="Price per Litre (₹) *">
                <Input inputMode="decimal" placeholder="42.00" value={form.price_per_litre} onChange={(e) => setForm({ ...form, price_per_litre: e.target.value })} />
              </FormField>
              <FormField label="Bonus (₹/L)">
                <Input inputMode="decimal" placeholder="optional" value={form.bonus} onChange={(e) => setForm({ ...form, bonus: e.target.value })} />
              </FormField>
              <FormField label="Effective Date *">
                <Input type="date" value={form.effective_date} onChange={(e) => setForm({ ...form, effective_date: e.target.value })} />
              </FormField>
            </div>
            <FormField label="Notes (optional)">
              <Textarea
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                maxLength={300}
                placeholder="Any extra info farmers should see"
              />
            </FormField>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="gap-2">
              <X className="h-4 w-4" /> Cancel
            </Button>
            <Button onClick={submit} disabled={saving} className="gap-2">
              <Save className="h-4 w-4" /> {saving ? "Saving…" : editing ? "Save & Publish" : "Publish Rate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this rate?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the rate entry. Farmers will no longer see it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 block text-xs">{label}</Label>
      {children}
    </div>
  );
}

function CompanyStatus({ company }: { company: Company }) {
  const s = company.verification_status;
  const cls = s === "verified"
    ? "border-emerald-500/40 bg-emerald-50/60 text-emerald-800"
    : s === "rejected"
    ? "border-destructive/40 bg-destructive/5 text-destructive"
    : "border-amber-500/40 bg-amber-50/60 text-amber-800";
  const Icon = s === "verified" ? ShieldCheck : s === "rejected" ? ShieldAlert : ShieldQuestion;
  return (
    <Card className={cls}>
      <CardContent className="flex flex-wrap items-center gap-3 p-4 text-sm">
        <Icon className="h-5 w-5" />
        <div className="flex-1">
          <p className="font-semibold">{company.name}</p>
          <p className="text-xs opacity-80">
            {[company.village, company.district, company.state].filter(Boolean).join(", ") || "Location not set"}
          </p>
        </div>
        <Badge variant="outline" className="capitalize">{s}</Badge>
      </CardContent>
    </Card>
  );
}
