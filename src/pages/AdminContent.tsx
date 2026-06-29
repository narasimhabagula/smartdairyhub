import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, BookOpen, HelpCircle, Megaphone, Loader2, Database } from "lucide-react";
import { toast } from "sonner";

type Knowledge = { id: string; title: string; content: string; category: string; priority: number; active: boolean; updated_at: string };
type Faq = { id: string; question: string; answer: string; category: string; display_order: number; active: boolean; updated_at: string };
type Banner = { id: string; title: string; message: string; variant: string; link: string | null; active: boolean; starts_at: string; expires_at: string | null; updated_at: string };

const VARIANTS = ["info", "success", "warning", "promo"] as const;

export default function AdminContent() {
  const [tab, setTab] = useState("knowledge");
  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Content Management</h1>
        <p className="text-muted-foreground">Manage chatbot knowledge, FAQs, and notification banners.</p>
      </div>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="knowledge"><BookOpen className="mr-2 h-4 w-4" />Chatbot Knowledge</TabsTrigger>
          <TabsTrigger value="rag"><Database className="mr-2 h-4 w-4" />RAG / Website KB</TabsTrigger>
          <TabsTrigger value="faqs"><HelpCircle className="mr-2 h-4 w-4" />FAQs</TabsTrigger>
          <TabsTrigger value="banners"><Megaphone className="mr-2 h-4 w-4" />Notification Banners</TabsTrigger>
        </TabsList>
        <TabsContent value="knowledge" className="mt-6"><KnowledgePanel /></TabsContent>
        <TabsContent value="rag" className="mt-6"><RagPanel /></TabsContent>
        <TabsContent value="faqs" className="mt-6"><FaqPanel /></TabsContent>
        <TabsContent value="banners" className="mt-6"><BannerPanel /></TabsContent>
      </Tabs>
    </div>
  );
}

/* ---------------- Knowledge ---------------- */
function KnowledgePanel() {
  const [rows, setRows] = useState<Knowledge[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Knowledge | null>(null);
  const [form, setForm] = useState({ title: "", content: "", category: "general", priority: 0, active: true });

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("chatbot_knowledge").select("*").order("priority", { ascending: false }).order("updated_at", { ascending: false });
    if (error) toast.error(error.message); else setRows((data as Knowledge[]) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm({ title: "", content: "", category: "general", priority: 0, active: true }); setOpen(true); };
  const openEdit = (r: Knowledge) => { setEditing(r); setForm({ title: r.title, content: r.content, category: r.category, priority: r.priority, active: r.active }); setOpen(true); };

  const save = async () => {
    if (!form.title.trim() || !form.content.trim()) { toast.error("Title and content are required"); return; }
    const payload = { ...form, title: form.title.trim(), content: form.content.trim(), category: form.category.trim() || "general" };
    const { error } = editing
      ? await supabase.from("chatbot_knowledge").update(payload).eq("id", editing.id)
      : await supabase.from("chatbot_knowledge").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success(editing ? "Updated" : "Added"); setOpen(false); load();
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this knowledge entry?")) return;
    const { error } = await supabase.from("chatbot_knowledge").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); load(); }
  };
  const toggle = async (r: Knowledge) => {
    const { error } = await supabase.from("chatbot_knowledge").update({ active: !r.active }).eq("id", r.id);
    if (error) toast.error(error.message); else load();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Chatbot Knowledge Base</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Custom snippets injected into Dairy Mitra's context.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Add</Button></DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} Knowledge</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Category</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. milk, diseases, schemes" /></div>
                <div><Label>Priority</Label><Input type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) || 0 })} /></div>
              </div>
              <div><Label>Content</Label><Textarea rows={8} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Facts, instructions, or domain knowledge for the AI to use." /></div>
              <div className="flex items-center gap-2"><Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} /><Label>Active</Label></div>
            </div>
            <DialogFooter><Button onClick={save}>Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : rows.length === 0 ? <p className="text-sm text-muted-foreground">No knowledge entries yet.</p> : (
          <div className="space-y-3">
            {rows.map((r) => (
              <div key={r.id} className="flex items-start justify-between gap-3 rounded-lg border p-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2"><h3 className="font-semibold truncate">{r.title}</h3><Badge variant="outline">{r.category}</Badge>{!r.active && <Badge variant="secondary">Inactive</Badge>}{r.priority > 0 && <Badge>P{r.priority}</Badge>}</div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{r.content}</p>
                </div>
                <div className="flex items-center gap-1"><Switch checked={r.active} onCheckedChange={() => toggle(r)} /><Button size="icon" variant="ghost" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button><Button size="icon" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ---------------- FAQs ---------------- */
function FaqPanel() {
  const [rows, setRows] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Faq | null>(null);
  const [form, setForm] = useState({ question: "", answer: "", category: "general", display_order: 0, active: true });

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("faqs").select("*").order("display_order").order("updated_at", { ascending: false });
    if (error) toast.error(error.message); else setRows((data as Faq[]) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm({ question: "", answer: "", category: "general", display_order: 0, active: true }); setOpen(true); };
  const openEdit = (r: Faq) => { setEditing(r); setForm({ question: r.question, answer: r.answer, category: r.category, display_order: r.display_order, active: r.active }); setOpen(true); };

  const save = async () => {
    if (!form.question.trim() || !form.answer.trim()) { toast.error("Question and answer are required"); return; }
    const payload = { ...form, question: form.question.trim(), answer: form.answer.trim(), category: form.category.trim() || "general" };
    const { error } = editing
      ? await supabase.from("faqs").update(payload).eq("id", editing.id)
      : await supabase.from("faqs").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success(editing ? "Updated" : "Added"); setOpen(false); load();
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this FAQ?")) return;
    const { error } = await supabase.from("faqs").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); load(); }
  };
  const toggle = async (r: Faq) => {
    const { error } = await supabase.from("faqs").update({ active: !r.active }).eq("id", r.id);
    if (error) toast.error(error.message); else load();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>FAQs</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Shown in Help Center and used by the chatbot for grounded answers.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Add</Button></DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} FAQ</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Question</Label><Input value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} /></div>
              <div><Label>Answer</Label><Textarea rows={6} value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Category</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
                <div><Label>Display order</Label><Input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) || 0 })} /></div>
              </div>
              <div className="flex items-center gap-2"><Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} /><Label>Active</Label></div>
            </div>
            <DialogFooter><Button onClick={save}>Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : rows.length === 0 ? <p className="text-sm text-muted-foreground">No FAQs yet.</p> : (
          <div className="space-y-3">
            {rows.map((r) => (
              <div key={r.id} className="flex items-start justify-between gap-3 rounded-lg border p-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2"><h3 className="font-semibold truncate">{r.question}</h3><Badge variant="outline">{r.category}</Badge>{!r.active && <Badge variant="secondary">Inactive</Badge>}</div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{r.answer}</p>
                </div>
                <div className="flex items-center gap-1"><Switch checked={r.active} onCheckedChange={() => toggle(r)} /><Button size="icon" variant="ghost" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button><Button size="icon" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ---------------- Banners ---------------- */
function BannerPanel() {
  const [rows, setRows] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [form, setForm] = useState({ title: "", message: "", variant: "info", link: "", active: true, starts_at: "", expires_at: "" });

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("notification_banners").select("*").order("starts_at", { ascending: false });
    if (error) toast.error(error.message); else setRows((data as Banner[]) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ title: "", message: "", variant: "info", link: "", active: true, starts_at: new Date().toISOString().slice(0, 16), expires_at: "" });
    setOpen(true);
  };
  const openEdit = (r: Banner) => {
    setEditing(r);
    setForm({
      title: r.title, message: r.message, variant: r.variant, link: r.link || "", active: r.active,
      starts_at: r.starts_at ? new Date(r.starts_at).toISOString().slice(0, 16) : "",
      expires_at: r.expires_at ? new Date(r.expires_at).toISOString().slice(0, 16) : "",
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.title.trim() || !form.message.trim()) { toast.error("Title and message are required"); return; }
    const payload: any = {
      title: form.title.trim(),
      message: form.message.trim(),
      variant: form.variant,
      link: form.link.trim() || null,
      active: form.active,
      starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : new Date().toISOString(),
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
    };
    const { error } = editing
      ? await supabase.from("notification_banners").update(payload).eq("id", editing.id)
      : await supabase.from("notification_banners").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success(editing ? "Updated" : "Added"); setOpen(false); load();
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this banner?")) return;
    const { error } = await supabase.from("notification_banners").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); load(); }
  };
  const toggle = async (r: Banner) => {
    const { error } = await supabase.from("notification_banners").update({ active: !r.active }).eq("id", r.id);
    if (error) toast.error(error.message); else load();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Notification Banners</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Sitewide announcements shown to all visitors during the active window.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Add</Button></DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} Banner</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div><Label>Message</Label><Textarea rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Variant</Label>
                  <Select value={form.variant} onValueChange={(v) => setForm({ ...form, variant: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{VARIANTS.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Link (optional)</Label><Input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="/milk-rates" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Starts</Label><Input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} /></div>
                <div><Label>Expires (optional)</Label><Input type="datetime-local" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} /></div>
              </div>
              <div className="flex items-center gap-2"><Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} /><Label>Active</Label></div>
            </div>
            <DialogFooter><Button onClick={save}>Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : rows.length === 0 ? <p className="text-sm text-muted-foreground">No banners yet.</p> : (
          <div className="space-y-3">
            {rows.map((r) => (
              <div key={r.id} className="flex items-start justify-between gap-3 rounded-lg border p-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2"><h3 className="font-semibold truncate">{r.title}</h3><Badge variant="outline">{r.variant}</Badge>{!r.active && <Badge variant="secondary">Inactive</Badge>}</div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{r.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(r.starts_at).toLocaleString()} {r.expires_at ? `→ ${new Date(r.expires_at).toLocaleString()}` : "(no expiry)"}
                  </p>
                </div>
                <div className="flex items-center gap-1"><Switch checked={r.active} onCheckedChange={() => toggle(r)} /><Button size="icon" variant="ghost" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button><Button size="icon" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
