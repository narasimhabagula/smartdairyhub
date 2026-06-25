import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Users, Package, ShoppingCart, Stethoscope, Landmark, Check, X, Trash2, Plus, BarChart3, IndianRupee, Search, ChevronLeft, ChevronRight, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function AdminDashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [vets, setVets] = useState<any[]>([]);
  const [schemes, setSchemes] = useState<any[]>([]);
  const [industries, setIndustries] = useState<any[]>([]);
  const [indLoading, setIndLoading] = useState(true);
  const [indError, setIndError] = useState<string | null>(null);
  const [adminNames, setAdminNames] = useState<Record<string, string>>({});
  const [currentAdminId, setCurrentAdminId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Vet form
  const [vetForm, setVetForm] = useState({ name: "", qualification: "", specialization: "", phone: "", location: "", email: "" });
  const [vetOpen, setVetOpen] = useState(false);

  // Scheme form
  const [schemeForm, setSchemeForm] = useState({ title: "", description: "", eligibility: "", benefits: "", category: "subsidy", apply_url: "" });
  const [schemeOpen, setSchemeOpen] = useState(false);

  // Industries filters
  const [indSearch, setIndSearch] = useState("");
  const [indStatus, setIndStatus] = useState<"all" | "pending" | "verified" | "rejected">("all");
  const [indState, setIndState] = useState<string>("all");
  const [indDistrict, setIndDistrict] = useState<string>("all");
  const [indPage, setIndPage] = useState(1);
  const IND_PAGE_SIZE = 10;

  const resolveAdminNames = async (ids: string[]) => {
    const unique = Array.from(new Set(ids.filter(Boolean)));
    const missing = unique.filter((id) => !adminNames[id]);
    if (missing.length === 0) return;
    const { data } = await supabase.rpc("get_display_names", { _ids: missing });
    if (data) {
      setAdminNames((prev) => {
        const next = { ...prev };
        (data as any[]).forEach((r) => { next[r.user_id] = r.full_name || "Admin"; });
        missing.forEach((id) => { if (!next[id]) next[id] = "Admin"; });
        return next;
      });
    }
  };

  const fetchIndustries = async () => {
    setIndLoading(true);
    setIndError(null);
    try {
      const { data, error } = await supabase.from("dairy_companies").select("*").order("submitted_at", { ascending: false });
      if (error) throw error;
      setIndustries(data || []);
      const reviewerIds = (data || []).map((c: any) => c.reviewed_by).filter(Boolean);
      if (reviewerIds.length) resolveAdminNames(reviewerIds);
    } catch (err: any) {
      setIndError(err.message || "Failed to load dairy companies.");
    } finally {
      setIndLoading(false);
    }
  };

  useEffect(() => {
    const fetchAll = async () => {
      const [u, p, o, v, s] = await Promise.all([
        supabase.from("profiles").select("*, user_roles(role)"),
        supabase.from("products").select("*").order("created_at", { ascending: false }),
        supabase.from("orders").select("*").order("created_at", { ascending: false }),
        supabase.from("vet_doctors").select("id,name,qualification,specialization,location,hospital_name,address,district,village,rating,total_ratings,available,status,suggested_by,created_at,updated_at").order("created_at", { ascending: false }),
        supabase.from("schemes").select("*").order("created_at", { ascending: false }),
      ]);
      setUsers(u.data || []);
      setProducts(p.data || []);
      setOrders(o.data || []);
      setVets(v.data || []);
      setSchemes(s.data || []);
      setLoading(false);
    };
    fetchAll();
    fetchIndustries();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setCurrentAdminId(data.user.id);
        resolveAdminNames([data.user.id]);
      }
    });
  }, []);

  const approveIndustry = async (id: string) => {
    const { error } = await supabase
      .from("dairy_companies")
      .update({ verification_status: "verified", rejection_reason: null, contact_phone_verified: true, contact_email_verified: true })
      .eq("id", id);
    if (error) { toast.error(error.message); return; }
    const now = new Date().toISOString();
    setIndustries(industries.map(c => c.id === id ? { ...c, verification_status: "verified", verified: true, rejection_reason: null, reviewed_at: now, reviewed_by: currentAdminId ?? c.reviewed_by } : c));
    toast.success("Company verified — owner notified");
  };

  const rejectIndustry = async (id: string, reason: string) => {
    const trimmed = reason.trim();
    if (trimmed.length < 5) { toast.error("Please give a reason (min 5 chars)"); return; }
    const { error } = await supabase
      .from("dairy_companies")
      .update({ verification_status: "rejected", rejection_reason: trimmed })
      .eq("id", id);
    if (error) { toast.error(error.message); return; }
    const now = new Date().toISOString();
    setIndustries(industries.map(c => c.id === id ? { ...c, verification_status: "rejected", verified: false, rejection_reason: trimmed, reviewed_at: now, reviewed_by: currentAdminId ?? c.reviewed_by } : c));
    toast.success("Company rejected — owner notified");
  };

  const approveProduct = async (id: string) => {
    const { error } = await supabase.from("products").update({ approval_status: "approved", rejection_reason: null }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    setProducts(products.map(p => p.id === id ? { ...p, approval_status: "approved", approved: true, rejection_reason: null } : p));
    toast.success("Product approved");
  };

  const rejectProduct = async (id: string, reason: string) => {
    const trimmed = reason.trim();
    if (trimmed.length < 5) { toast.error("Please give a reason (min 5 chars)"); return; }
    const { error } = await supabase.from("products").update({ approval_status: "rejected", rejection_reason: trimmed }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    setProducts(products.map(p => p.id === id ? { ...p, approval_status: "rejected", approved: false, rejection_reason: trimmed } : p));
    toast.success("Product rejected — seller notified");
  };

  const deleteProduct = async (id: string) => {
    await supabase.from("products").delete().eq("id", id);
    setProducts(products.filter(p => p.id !== id));
    toast.success("Product deleted");
  };

  const updateOrderStatus = async (id: string, status: string) => {
    await supabase.from("orders").update({ status }).eq("id", id);
    setOrders(orders.map(o => o.id === id ? { ...o, status } : o));
    toast.success("Order status updated");
  };

  const addVet = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("vet_doctors").insert(vetForm);
    if (error) { toast.error(error.message); return; }
    toast.success("Vet added!");
    setVetOpen(false);
    setVetForm({ name: "", qualification: "", specialization: "", phone: "", location: "", email: "" });
    const { data } = await supabase.from("vet_doctors").select("id,name,qualification,specialization,location,hospital_name,address,district,village,rating,total_ratings,available,status,suggested_by,created_at,updated_at").order("created_at", { ascending: false });
    setVets(data || []);
  };

  const deleteVet = async (id: string) => {
    await supabase.from("vet_doctors").delete().eq("id", id);
    setVets(vets.filter(v => v.id !== id));
    toast.success("Vet deleted");
  };

  const addScheme = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("schemes").insert(schemeForm);
    if (error) { toast.error(error.message); return; }
    toast.success("Scheme added!");
    setSchemeOpen(false);
    setSchemeForm({ title: "", description: "", eligibility: "", benefits: "", category: "subsidy", apply_url: "" });
    const { data } = await supabase.from("schemes").select("*").order("created_at", { ascending: false });
    setSchemes(data || []);
  };

  const deleteScheme = async (id: string) => {
    await supabase.from("schemes").delete().eq("id", id);
    setSchemes(schemes.filter(s => s.id !== id));
    toast.success("Scheme deleted");
  };

  const totalRevenue = orders.reduce((s, o) => s + Number(o.total), 0);
  const orderStatusData = ["pending", "confirmed", "shipped", "delivered", "cancelled"].map(s => ({
    name: s, value: orders.filter(o => o.status === s).length
  })).filter(d => d.value > 0);
  const COLORS = ["hsl(36, 80%, 55%)", "hsl(142, 45%, 28%)", "hsl(200, 60%, 50%)", "hsl(142, 60%, 40%)", "hsl(0, 72%, 50%)"];

  if (loading) return <div className="container py-10"><p className="text-muted-foreground">Loading admin dashboard...</p></div>;

  return (
    <div className="container py-10">
      <h1 className="font-display text-3xl font-bold">Admin Dashboard</h1>
      <p className="mt-1 text-muted-foreground">Manage your dairy marketplace platform.</p>

      {/* Stats */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Total Users", value: users.length, icon: Users },
          { label: "Products", value: products.length, icon: Package },
          { label: "Orders", value: orders.length, icon: ShoppingCart },
          { label: "Vet Doctors", value: vets.length, icon: Stethoscope },
          { label: "Revenue", value: `₹${totalRevenue.toFixed(0)}`, icon: IndianRupee },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="font-display text-xl font-bold">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="products" className="mt-8">
        <TabsList className="flex-wrap">
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="industries">
            Industries
            {industries.filter(c => c.verification_status === "pending").length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 px-1.5 text-[10px]">
                {industries.filter(c => c.verification_status === "pending").length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="vets">Vet Doctors</TabsTrigger>
          <TabsTrigger value="schemes">Schemes</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="font-display">Product Approvals</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-3 font-medium">Name</th>
                      <th className="pb-3 font-medium">Category</th>
                      <th className="pb-3 font-medium text-right">Price</th>
                      <th className="pb-3 font-medium text-right">Stock</th>
                      <th className="pb-3 font-medium text-center">Status</th>
                      <th className="pb-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id} className="border-b last:border-0">
                        <td className="py-3 font-medium">{p.name}</td>
                        <td className="py-3 capitalize">{p.category}</td>
                        <td className="py-3 text-right">₹{Number(p.price).toFixed(0)}</td>
                        <td className="py-3 text-right">{p.stock}</td>
                        <td className="py-3 text-center">
                          {(() => {
                            const s = p.approval_status ?? (p.approved ? "approved" : "pending");
                            const variant = s === "approved" ? "default" : s === "rejected" ? "destructive" : "secondary";
                            return <Badge variant={variant as any} className="capitalize">{s}</Badge>;
                          })()}
                          {p.approval_status === "rejected" && p.rejection_reason && (
                            <div className="mt-1 text-[11px] text-muted-foreground italic">{p.rejection_reason}</div>
                          )}
                        </td>
                        <td className="py-3 text-right space-x-1">
                          {p.approval_status !== "approved" && (
                            <Button size="sm" variant="outline" onClick={() => approveProduct(p.id)} className="gap-1">
                              <Check className="h-3 w-3" /> Approve
                            </Button>
                          )}
                          {p.approval_status !== "rejected" && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline" className="gap-1 text-destructive">
                                  <X className="h-3 w-3" /> Reject
                                </Button>
                              </DialogTrigger>
                              <RejectDialog onSubmit={(reason) => rejectProduct(p.id, reason)} productName={p.name} />
                            </Dialog>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => deleteProduct(p.id)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="industries" className="mt-4">
          <IndustriesPanel
            industries={industries}
            loading={indLoading}
            error={indError}
            onRetry={fetchIndustries}
            search={indSearch} setSearch={setIndSearch}
            status={indStatus} setStatus={setIndStatus}
            stateFilter={indState} setStateFilter={setIndState}
            districtFilter={indDistrict} setDistrictFilter={setIndDistrict}
            page={indPage} setPage={setIndPage} pageSize={IND_PAGE_SIZE}
            onApprove={approveIndustry} onReject={rejectIndustry}
          />
        </TabsContent>


        <TabsContent value="orders" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="font-display">All Orders</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-3 font-medium">Order ID</th>
                      <th className="pb-3 font-medium">Date</th>
                      <th className="pb-3 font-medium text-right">Total</th>
                      <th className="pb-3 font-medium text-center">Status</th>
                      <th className="pb-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id} className="border-b last:border-0">
                        <td className="py-3 font-mono text-xs">{o.id.slice(0, 8)}</td>
                        <td className="py-3">{new Date(o.created_at).toLocaleDateString("en-IN")}</td>
                        <td className="py-3 text-right font-semibold">₹{Number(o.total).toFixed(0)}</td>
                        <td className="py-3 text-center">
                          <Badge variant="secondary" className="capitalize">{o.status}</Badge>
                        </td>
                        <td className="py-3 text-right">
                          <Select value={o.status} onValueChange={(v) => updateOrderStatus(o.id, v)}>
                            <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {["pending", "confirmed", "shipped", "delivered", "cancelled"].map(s => (
                                <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="font-display">All Users</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-3 font-medium">Name</th>
                      <th className="pb-3 font-medium">Phone</th>
                      <th className="pb-3 font-medium">Location</th>
                      <th className="pb-3 font-medium">Role</th>
                      <th className="pb-3 font-medium">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b last:border-0">
                        <td className="py-3 font-medium">{u.full_name || "—"}</td>
                        <td className="py-3">{u.phone || "—"}</td>
                        <td className="py-3">{u.location || "—"}</td>
                        <td className="py-3">
                          <Badge variant="secondary" className="capitalize">
                            {u.user_roles?.[0]?.role || "farmer"}
                          </Badge>
                        </td>
                        <td className="py-3 text-muted-foreground">{new Date(u.created_at).toLocaleDateString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vets" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-display">Vet Doctors</CardTitle>
              <Dialog open={vetOpen} onOpenChange={setVetOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Add Vet</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle className="font-display">Add Vet Doctor</DialogTitle></DialogHeader>
                  <form onSubmit={addVet} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>Name</Label><Input value={vetForm.name} onChange={(e) => setVetForm({ ...vetForm, name: e.target.value })} required className="mt-1.5" /></div>
                      <div><Label>Phone</Label><Input value={vetForm.phone} onChange={(e) => setVetForm({ ...vetForm, phone: e.target.value })} required className="mt-1.5" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>Qualification</Label><Input value={vetForm.qualification} onChange={(e) => setVetForm({ ...vetForm, qualification: e.target.value })} className="mt-1.5" /></div>
                      <div><Label>Specialization</Label><Input value={vetForm.specialization} onChange={(e) => setVetForm({ ...vetForm, specialization: e.target.value })} className="mt-1.5" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>Location</Label><Input value={vetForm.location} onChange={(e) => setVetForm({ ...vetForm, location: e.target.value })} required className="mt-1.5" /></div>
                      <div><Label>Email</Label><Input type="email" value={vetForm.email} onChange={(e) => setVetForm({ ...vetForm, email: e.target.value })} className="mt-1.5" /></div>
                    </div>
                    <Button type="submit" className="w-full">Add Vet Doctor</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {vets.map((v) => (
                  <div key={v.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-medium">{v.name}</p>
                      <p className="text-sm text-muted-foreground">{v.specialization} · {v.location}</p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => deleteVet(v.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schemes" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-display">Government Schemes</CardTitle>
              <Dialog open={schemeOpen} onOpenChange={setSchemeOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Add Scheme</Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                  <DialogHeader><DialogTitle className="font-display">Add Scheme</DialogTitle></DialogHeader>
                  <form onSubmit={addScheme} className="space-y-4">
                    <div><Label>Title</Label><Input value={schemeForm.title} onChange={(e) => setSchemeForm({ ...schemeForm, title: e.target.value })} required className="mt-1.5" /></div>
                    <div><Label>Description</Label><Textarea value={schemeForm.description} onChange={(e) => setSchemeForm({ ...schemeForm, description: e.target.value })} required className="mt-1.5" /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>Eligibility</Label><Input value={schemeForm.eligibility} onChange={(e) => setSchemeForm({ ...schemeForm, eligibility: e.target.value })} className="mt-1.5" /></div>
                      <div><Label>Benefits</Label><Input value={schemeForm.benefits} onChange={(e) => setSchemeForm({ ...schemeForm, benefits: e.target.value })} className="mt-1.5" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Category</Label>
                        <Select value={schemeForm.category} onValueChange={(v) => setSchemeForm({ ...schemeForm, category: v })}>
                          <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {["subsidy", "loan", "insurance", "training", "other"].map(c => (
                              <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div><Label>Apply URL</Label><Input value={schemeForm.apply_url} onChange={(e) => setSchemeForm({ ...schemeForm, apply_url: e.target.value })} className="mt-1.5" /></div>
                    </div>
                    <Button type="submit" className="w-full">Add Scheme</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {schemes.map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-medium">{s.title}</p>
                      <p className="text-sm text-muted-foreground capitalize">{s.category} · {s.active ? "Active" : "Inactive"}</p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => deleteScheme(s.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="font-display">Order Status</CardTitle></CardHeader>
              <CardContent>
                {orderStatusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={orderStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                        {orderStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No orders yet</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="font-display">Platform Summary</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={[
                    { name: "Users", value: users.length },
                    { name: "Products", value: products.length },
                    { name: "Orders", value: orders.length },
                    { name: "Vets", value: vets.length },
                    { name: "Schemes", value: schemes.length },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(142, 45%, 28%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RejectDialog({ productName, onSubmit }: { productName: string; onSubmit: (reason: string) => void }) {
  const [reason, setReason] = useState("");
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Reject "{productName}"</DialogTitle>
        <DialogDescription>
          Share a short reason. The seller sees this in their dashboard and gets a notification.
        </DialogDescription>
      </DialogHeader>
      <Textarea
        placeholder="e.g. Images are unclear, price seems incorrect, missing description…"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={4}
        className="mt-2"
      />
      <DialogFooter>
        <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
        <DialogClose asChild>
          <Button variant="destructive" onClick={() => onSubmit(reason)}>Reject listing</Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  );
}

function IndustryRejectDialog({ companyName, onSubmit }: { companyName: string; onSubmit: (reason: string) => void }) {
  const [reason, setReason] = useState("");
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Reject "{companyName}"</DialogTitle>
        <DialogDescription>
          Share a short reason (e.g. unreadable GST document, mismatched contact details, registration cannot be verified). The owner sees this in their Industry panel and gets a notification.
        </DialogDescription>
      </DialogHeader>
      <Textarea
        placeholder="e.g. GST number does not match registered name; please re-upload a clear certificate…"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={4}
        className="mt-2"
      />
      <DialogFooter>
        <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
        <DialogClose asChild>
          <Button variant="destructive" onClick={() => onSubmit(reason)}>Reject company</Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  );
}

type IndustryRow = {
  id: string;
  name: string;
  logo_url?: string | null;
  village?: string | null;
  district?: string | null;
  state?: string | null;
  pin_code?: string | null;
  submitted_at?: string | null;
  verification_status: "pending" | "verified" | "rejected";
  registration_number?: string | null;
  gst_number?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  business_doc_url?: string | null;
  rejection_reason?: string | null;
  contact_phone_verified?: boolean;
  contact_email_verified?: boolean;
};

function IndustriesPanel(props: {
  industries: IndustryRow[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  search: string; setSearch: (v: string) => void;
  status: "all" | "pending" | "verified" | "rejected"; setStatus: (v: "all" | "pending" | "verified" | "rejected") => void;
  stateFilter: string; setStateFilter: (v: string) => void;
  districtFilter: string; setDistrictFilter: (v: string) => void;
  page: number; setPage: (n: number) => void; pageSize: number;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
}) {
  const { industries, loading, error, onRetry, search, setSearch, status, setStatus, stateFilter, setStateFilter, districtFilter, setDistrictFilter, page, setPage, pageSize, onApprove, onReject } = props;

  const states = useMemo(() => {
    const set = new Set<string>();
    industries.forEach(c => { if (c.state) set.add(c.state); });
    return Array.from(set).sort();
  }, [industries]);

  const districts = useMemo(() => {
    const set = new Set<string>();
    industries.forEach(c => {
      if (!c.district) return;
      if (stateFilter !== "all" && c.state !== stateFilter) return;
      set.add(c.district);
    });
    return Array.from(set).sort();
  }, [industries, stateFilter]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return industries.filter(c => {
      if (status !== "all" && c.verification_status !== status) return false;
      if (stateFilter !== "all" && c.state !== stateFilter) return false;
      if (districtFilter !== "all" && c.district !== districtFilter) return false;
      if (!q) return true;
      const hay = [c.name, c.registration_number, c.gst_number, c.phone, c.email, c.village, c.district, c.state, c.pin_code]
        .filter(Boolean).join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [industries, search, status, stateFilter, districtFilter]);

  const pendingCount = industries.filter(c => c.verification_status === "pending").length;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  useEffect(() => { setPage(1); }, [search, status, stateFilter, districtFilter, setPage]);
  useEffect(() => { if (stateFilter === "all") setDistrictFilter("all"); }, [stateFilter, setDistrictFilter]);

  const resetFilters = () => {
    setSearch(""); setStatus("all"); setStateFilter("all"); setDistrictFilter("all"); setPage(1);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="font-display flex items-center gap-2">
              Industry Verification
              {pendingCount > 0 && <Badge variant="secondary">{pendingCount} pending</Badge>}
            </CardTitle>
            <p className="text-sm text-muted-foreground">Review company registration, GST, and contact details. Only verified industries can publish milk rates.</p>
          </div>
          <p className="text-xs text-muted-foreground self-end">{filtered.length} of {industries.length}</p>
        </div>

        <div className="mt-4 grid gap-2 md:grid-cols-[1fr_auto_auto_auto_auto]">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, GST, registration no., phone, email…"
              className="pl-8"
            />
          </div>
          <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
            <SelectTrigger className="md:w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Select value={stateFilter} onValueChange={setStateFilter}>
            <SelectTrigger className="md:w-[160px]"><SelectValue placeholder="State" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All states</SelectItem>
              {states.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={districtFilter} onValueChange={setDistrictFilter} disabled={districts.length === 0}>
            <SelectTrigger className="md:w-[180px]"><SelectValue placeholder="District" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All districts</SelectItem>
              {districts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="ghost" onClick={resetFilters}>Reset</Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading dairy companies…</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-4 py-14 rounded-lg border border-destructive/30 bg-destructive/5 px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <RefreshCw className="h-6 w-6" />
            </div>
            <div>
              <p className="font-medium text-destructive">Could not load companies</p>
              <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            </div>
            <Button variant="outline" onClick={onRetry} className="gap-2">
              <RefreshCw className="h-4 w-4" /> Retry
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Landmark className="h-6 w-6" />
            </div>
            <div>
              <p className="font-medium">
                {industries.length === 0 ? "No dairy companies submitted yet" : "No companies match the current filters"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {industries.length === 0
                  ? "Industry accounts will appear here once they register and submit verification details."
                  : "Try adjusting the search or filters to see more results."}
              </p>
            </div>
            {industries.length > 0 && (
              <Button variant="outline" onClick={resetFilters} className="gap-2">
                <RefreshCw className="h-4 w-4" /> Clear filters
              </Button>
            )}
          </div>
        ) : pageItems.map((c) => {
          const st = c.verification_status;
          const badgeVariant = st === "verified" ? "default" : st === "rejected" ? "destructive" : "secondary";
          return (
            <div key={c.id} className="rounded-lg border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  {c.logo_url ? (
                    <img src={c.logo_url} alt="" className="h-12 w-12 rounded-md object-cover ring-1 ring-border" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted text-muted-foreground text-xs">Logo</div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{c.name}</p>
                      <Badge variant={badgeVariant} className="capitalize">{st}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {[c.village, c.district, c.state, c.pin_code].filter(Boolean).join(", ") || "Location not provided"}
                    </p>
                    {c.submitted_at && (
                      <p className="mt-0.5 text-[11px] text-muted-foreground">Submitted {new Date(c.submitted_at).toLocaleString()}</p>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {st !== "verified" && (
                    <Button size="sm" onClick={() => onApprove(c.id)} className="gap-1">
                      <Check className="h-4 w-4" /> Approve
                    </Button>
                  )}
                  {st !== "rejected" && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="destructive" className="gap-1"><X className="h-4 w-4" /> Reject</Button>
                      </DialogTrigger>
                      <IndustryRejectDialog companyName={c.name} onSubmit={(r) => onReject(c.id, r)} />
                    </Dialog>
                  )}
                </div>
              </div>

              <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Registration no.</p>
                  <p className="font-mono">{c.registration_number || <span className="text-destructive">Missing</span>}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">GSTIN</p>
                  <p className="font-mono">{c.gst_number || <span className="text-destructive">Missing</span>}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Phone</p>
                  <p>{c.phone || <span className="text-destructive">Missing</span>} {c.contact_phone_verified && <Badge variant="outline" className="ml-1 h-4 px-1 text-[10px]">verified</Badge>}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Email</p>
                  <p>{c.email || <span className="text-destructive">Missing</span>} {c.contact_email_verified && <Badge variant="outline" className="ml-1 h-4 px-1 text-[10px]">verified</Badge>}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Address</p>
                  <p>{c.address || "—"}</p>
                </div>
                {c.business_doc_url && (
                  <div className="md:col-span-2">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Business document</p>
                    <a href={c.business_doc_url} target="_blank" rel="noopener" className="text-primary underline break-all">{c.business_doc_url}</a>
                  </div>
                )}
                {st === "rejected" && c.rejection_reason && (
                  <div className="md:col-span-2 rounded-md border border-destructive/40 bg-destructive/5 p-2 text-xs text-destructive">
                    Rejection reason: {c.rejection_reason}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filtered.length > pageSize && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-muted-foreground">
              Page {safePage} of {totalPages} • Showing {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filtered.length)}
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setPage(Math.max(1, safePage - 1))} disabled={safePage <= 1}>
                <ChevronLeft className="h-4 w-4" /> Prev
              </Button>
              <Button size="sm" variant="outline" onClick={() => setPage(Math.min(totalPages, safePage + 1))} disabled={safePage >= totalPages}>
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
