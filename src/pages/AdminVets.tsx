import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Check, X, MapPin, Stethoscope, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { friendlyError } from "@/lib/errors";

type Status = "pending" | "approved" | "rejected";
type Vet = {
  id: string; name: string; qualification: string | null; specialization: string | null;
  hospital_name: string | null; address: string | null; district: string | null; village: string | null;
  location: string; status: Status; rejection_reason: string | null; reviewed_at: string | null;
  created_at: string; opening_hours: unknown; consultation_fee: number | null;
};

export default function AdminVets() {
  const [vets, setVets] = useState<Vet[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Status>("pending");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("vet_doctors")
      .select("id,name,qualification,specialization,hospital_name,address,district,village,location,status,rejection_reason,reviewed_at,created_at,opening_hours,consultation_fee")
      .order("created_at", { ascending: false });
    if (error) toast.error(friendlyError(error));
    setVets((data as Vet[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const counts = useMemo(() => ({
    pending: vets.filter(v => v.status === "pending").length,
    approved: vets.filter(v => v.status === "approved").length,
    rejected: vets.filter(v => v.status === "rejected").length,
  }), [vets]);

  const shown = vets.filter(v => v.status === tab && (!q ||
    [v.name, v.hospital_name, v.district, v.location].some(f => f?.toLowerCase().includes(q.toLowerCase()))));

  const update = async (id: string, status: Status, rejection_reason: string | null = null) => {
    setBusy(id);
    const { error } = await supabase.from("vet_doctors").update({ status, rejection_reason }).eq("id", id);
    setBusy(null);
    if (error) return toast.error(friendlyError(error));
    setVets(vs => vs.map(v => v.id === id ? { ...v, status, rejection_reason, reviewed_at: new Date().toISOString() } : v));
    setRejecting(null); setReason("");
    toast.success(status === "approved" ? "Listing approved — bookings can now be confirmed" : "Listing rejected");
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-10">
      <Link to="/admin" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Admin dashboard
      </Link>
      <h1 className="font-display text-2xl font-bold sm:text-3xl">Vet listing approvals</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Only approved listings appear in the directory, and bookings with a vet can be confirmed only after their listing is approved.
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={tab} onValueChange={v => setTab(v as Status)}>
          <TabsList>
            <TabsTrigger value="pending">Pending ({counts.pending})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({counts.approved})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({counts.rejected})</TabsTrigger>
          </TabsList>
        </Tabs>
        <Input placeholder="Search name, clinic, district" value={q} onChange={e => setQ(e.target.value)} className="sm:w-64" aria-label="Search listings" />
      </div>

      <div className="mt-5 space-y-3">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : shown.length === 0 ? (
          <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
            No {tab} listings{q ? " match your search" : ""}.
          </div>
        ) : shown.map(v => (
          <article key={v.id} className="rounded-xl border bg-card p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold">{v.name}</h2>
                  <Badge variant={v.status === "approved" ? "default" : v.status === "rejected" ? "destructive" : "secondary"} className="capitalize">{v.status}</Badge>
                </div>
                <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <Stethoscope className="h-3.5 w-3.5 shrink-0" />
                  {[v.qualification, v.specialization, v.hospital_name].filter(Boolean).join(" · ") || "No qualification details"}
                </p>
                <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  {[v.address, v.village, v.district].filter(Boolean).join(", ") || v.location}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Submitted {new Date(v.created_at).toLocaleDateString()} · Hours {v.opening_hours ? "provided" : "not provided"}
                  {v.consultation_fee != null && ` · Fee ₹${v.consultation_fee}`}
                  {v.reviewed_at && ` · Reviewed ${new Date(v.reviewed_at).toLocaleDateString()}`}
                </p>
                {v.status === "rejected" && v.rejection_reason && (
                  <p className="mt-2 text-sm text-destructive">Reason: {v.rejection_reason}</p>
                )}
              </div>
              <div className="flex shrink-0 gap-2">
                {v.status !== "approved" && (
                  <Button size="sm" disabled={busy === v.id} onClick={() => update(v.id, "approved")}>
                    <Check className="mr-1 h-4 w-4" /> Approve
                  </Button>
                )}
                {v.status !== "rejected" && (
                  <Button size="sm" variant="outline" disabled={busy === v.id} onClick={() => { setRejecting(v.id); setReason(""); }}>
                    <X className="mr-1 h-4 w-4" /> Reject
                  </Button>
                )}
              </div>
            </div>
            {rejecting === v.id && (
              <div className="mt-4 space-y-2 border-t pt-4">
                <Textarea placeholder="Why is this listing being rejected? (required)" value={reason} onChange={e => setReason(e.target.value)} maxLength={500} aria-label="Rejection reason" />
                <div className="flex gap-2">
                  <Button size="sm" variant="destructive" disabled={!reason.trim() || busy === v.id} onClick={() => update(v.id, "rejected", reason.trim())}>Confirm reject</Button>
                  <Button size="sm" variant="ghost" onClick={() => setRejecting(null)}>Cancel</Button>
                </div>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
