import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Mail, Phone, Send, Headphones, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const CATEGORIES = [
  "Account Issues",
  "Login Problems",
  "Marketplace Issues",
  "Cattle Market Issues",
  "Milk Rates Issues",
  "Payment Issues",
  "Report Fraud",
  "Report Fake Listings",
  "Technical Support",
  "General Enquiry",
];

const schema = z.object({
  name: z.string().trim().min(2, "Name is required").max(80),
  email: z.string().trim().email("Valid email required").max(255),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  category: z.string().min(1, "Choose a category"),
  subject: z.string().trim().min(3, "Subject is too short").max(120),
  message: z.string().trim().min(10, "Please describe the issue (min 10 chars)").max(2000),
});

type Ticket = {
  id: string;
  ticket_number: string;
  category: string;
  subject: string;
  status: "open" | "in_progress" | "resolved";
  response_eta_hours: number;
  created_at: string;
};

const STATUS_META: Record<Ticket["status"], { label: string; cls: string; Icon: any }> = {
  open: { label: "Open", cls: "bg-amber-100 text-amber-800 border-amber-200", Icon: AlertCircle },
  in_progress: { label: "In Progress", cls: "bg-blue-100 text-blue-800 border-blue-200", Icon: Clock },
  resolved: { label: "Resolved", cls: "bg-green-100 text-green-800 border-green-200", Icon: CheckCircle2 },
};

export default function Support() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const [tab, setTab] = useState(params.get("tab") === "report" ? "ticket" : "ticket");
  const [form, setForm] = useState({ name: "", email: "", phone: "", category: "", subject: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  useEffect(() => {
    if (user?.email) setForm((f) => ({ ...f, email: f.email || user.email!, name: f.name || (user.user_metadata?.full_name ?? "") }));
  }, [user]);

  async function loadTickets() {
    if (!user) return;
    setLoadingTickets(true);
    const { data, error } = await supabase
      .from("support_tickets")
      .select("id,ticket_number,category,subject,status,response_eta_hours,created_at")
      .order("created_at", { ascending: false });
    if (error) toast.error("Could not load your tickets");
    setTickets((data as any) ?? []);
    setLoadingTickets(false);
  }

  useEffect(() => { loadTickets(); /* eslint-disable-next-line */ }, [user?.id]);

  async function submit() {
    const result = schema.safeParse(form);
    if (!result.success) {
      const e: Record<string, string> = {};
      result.error.issues.forEach((i) => { e[i.path[0] as string] = i.message; });
      setErrors(e);
      return;
    }
    setErrors({});
    if (!user) { toast.error("Please sign in to raise a ticket"); return; }
    setSubmitting(true);
    const { data, error } = await supabase.from("support_tickets").insert({
      user_id: user.id,
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      category: form.category,
      subject: form.subject.trim(),
      message: form.message.trim(),
    }).select("ticket_number").single();
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Ticket ${data!.ticket_number} created — we'll reply within 24 hours.`);
    setForm({ name: form.name, email: form.email, phone: form.phone, category: "", subject: "", message: "" });
    loadTickets();
    setTab("my");
  }

  return (
    <div className="container py-8">
      <div className="mx-auto max-w-4xl text-center">
        <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Headphones className="h-6 w-6" />
        </div>
        <h1 className="font-display text-3xl font-bold md:text-4xl">Customer Support</h1>
        <p className="mt-2 text-muted-foreground">We're here to help — choose how you'd like to reach us.</p>
      </div>

      <div className="mx-auto mt-6 grid max-w-4xl gap-3 md:grid-cols-4">
        <a href="https://wa.me/911800180155" target="_blank" rel="noopener noreferrer">
          <Card className="h-full transition hover:border-primary"><CardContent className="flex flex-col items-center gap-2 p-4 text-center">
            <MessageCircle className="h-6 w-6 text-green-600" /><p className="font-semibold">WhatsApp</p><p className="text-xs text-muted-foreground">Chat instantly</p></CardContent></Card>
        </a>
        <a href="mailto:support@smartdairyhub.in">
          <Card className="h-full transition hover:border-primary"><CardContent className="flex flex-col items-center gap-2 p-4 text-center">
            <Mail className="h-6 w-6 text-primary" /><p className="font-semibold">Email</p><p className="text-xs text-muted-foreground">support@smartdairyhub.in</p></CardContent></Card>
        </a>
        <a href="tel:18001801551">
          <Card className="h-full transition hover:border-primary"><CardContent className="flex flex-col items-center gap-2 p-4 text-center">
            <Phone className="h-6 w-6 text-primary" /><p className="font-semibold">Phone</p><p className="text-xs text-muted-foreground">1800-180-1551</p></CardContent></Card>
        </a>
        <Link to="/help">
          <Card className="h-full transition hover:border-primary"><CardContent className="flex flex-col items-center gap-2 p-4 text-center">
            <Headphones className="h-6 w-6 text-primary" /><p className="font-semibold">Help Center</p><p className="text-xs text-muted-foreground">Browse FAQs</p></CardContent></Card>
        </Link>
      </div>

      <div className="mx-auto mt-8 max-w-4xl">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="ticket">Raise a ticket</TabsTrigger>
            <TabsTrigger value="my">My tickets {tickets.length > 0 && <Badge variant="secondary" className="ml-2">{tickets.length}</Badge>}</TabsTrigger>
          </TabsList>

          <TabsContent value="ticket">
            <Card>
              <CardHeader><CardTitle>Open a support ticket</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {!user && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    Please <Link to="/login" className="underline font-medium">sign in</Link> to raise a ticket so we can track it for you.
                  </div>
                )}
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Name *</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
                  </div>
                  <div>
                    <Label>Email *</Label>
                    <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
                  </div>
                  <div>
                    <Label>Phone (optional)</Label>
                    <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </div>
                  <div>
                    <Label>Category *</Label>
                    <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                      <SelectTrigger><SelectValue placeholder="Choose a category" /></SelectTrigger>
                      <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                    {errors.category && <p className="mt-1 text-xs text-destructive">{errors.category}</p>}
                  </div>
                </div>
                <div>
                  <Label>Subject *</Label>
                  <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
                  {errors.subject && <p className="mt-1 text-xs text-destructive">{errors.subject}</p>}
                </div>
                <div>
                  <Label>Message *</Label>
                  <Textarea rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
                  {errors.message && <p className="mt-1 text-xs text-destructive">{errors.message}</p>}
                </div>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground"><Clock className="mr-1 inline h-3 w-3" />Average response time: 24 hours</p>
                  <Button onClick={submit} disabled={submitting || !user}><Send className="mr-2 h-4 w-4" />{submitting ? "Submitting…" : "Submit ticket"}</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="my">
            <Card>
              <CardHeader><CardTitle>My tickets</CardTitle></CardHeader>
              <CardContent>
                {loadingTickets ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>
                ) : !user ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">Sign in to view your tickets.</p>
                ) : tickets.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">You haven't raised any tickets yet.</p>
                ) : (
                  <div className="space-y-3">
                    {tickets.map((t) => {
                      const m = STATUS_META[t.status];
                      return (
                        <div key={t.id} className="flex flex-col gap-2 rounded-lg border p-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-semibold text-primary">{t.ticket_number}</span>
                              <Badge variant="outline">{t.category}</Badge>
                            </div>
                            <p className="mt-1 font-medium">{t.subject}</p>
                            <p className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString()}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground"><Clock className="mr-1 inline h-3 w-3" />ETA {t.response_eta_hours}h</span>
                            <Badge variant="outline" className={m.cls}><m.Icon className="mr-1 h-3 w-3" />{m.label}</Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
