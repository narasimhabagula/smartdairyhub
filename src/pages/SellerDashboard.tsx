import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Plus, Pencil, Trash2, Image as ImageIcon, Video, X, Package, IndianRupee,
  ShoppingBag, TrendingUp, Eye, Boxes, Beef, Loader2,
} from "lucide-react";

type Product = {
  id: string;
  seller_id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  unit: string | null;
  stock: number;
  image_url: string | null;
  photos: string[] | null;
  video_url: string | null;
  approved: boolean | null;
  approval_status: "pending" | "approved" | "rejected" | null;
  rejection_reason: string | null;
  reviewed_at: string | null;
  created_at: string;
};

type Cattle = {
  id: string;
  name: string;
  breed: string | null;
  price: number;
  status: string | null;
  photos: string[] | null;
  image_url: string | null;
  district: string | null;
  state: string | null;
  created_at: string;
};

type EnquiryRow = {
  order_id: string;
  status: string;
  created_at: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
};

const CATEGORIES = [
  "milk", "ghee", "butter", "paneer", "curd",
  "feed", "medicine", "dairy_equipment", "farm_equipment", "supplements", "other",
];
const UNITS = ["kg", "L", "piece", "pack", "bag", "bottle"];
const emptyForm = {
  id: "" as string,
  name: "",
  description: "",
  category: "milk",
  price: "",
  unit: "kg",
  stock: "",
  image_url: "",
  photos: [] as string[],
  video_url: "",
};

export default function SellerDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState("overview");
  const [products, setProducts] = useState<Product[]>([]);
  const [cattle, setCattle] = useState<Cattle[]>([]);
  const [enquiries, setEnquiries] = useState<EnquiryRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [editorOpen, setEditorOpen] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: p }, { data: c }] = await Promise.all([
      supabase.from("products").select("*").eq("seller_id", user.id).order("created_at", { ascending: false }),
      supabase.from("cattle_listings").select("id,name,breed,price,status,photos,image_url,district,state,created_at")
        .eq("seller_id", user.id).order("created_at", { ascending: false }),
    ]);
    setProducts((p || []) as Product[]);
    setCattle((c || []) as Cattle[]);

    // Enquiries = orders that contain this seller's products
    const productIds = (p || []).map((x: any) => x.id);
    if (productIds.length) {
      const { data: items } = await supabase
        .from("order_items")
        .select("order_id, product_id, quantity, price, orders!inner(status, created_at)")
        .in("product_id", productIds);
      const rows: EnquiryRow[] = (items || []).map((it: any) => ({
        order_id: it.order_id,
        product_id: it.product_id,
        product_name: (p || []).find((x: any) => x.id === it.product_id)?.name || "Product",
        quantity: it.quantity,
        price: Number(it.price),
        status: it.orders?.status ?? "pending",
        created_at: it.orders?.created_at ?? new Date().toISOString(),
      }));
      rows.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setEnquiries(rows);
    } else {
      setEnquiries([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user?.id]);

  const stats = useMemo(() => {
    const live = products.filter((p) => p.approval_status === "approved" && p.stock > 0).length;
    const pending = products.filter((p) => (p.approval_status ?? "pending") === "pending").length;
    const rejected = products.filter((p) => p.approval_status === "rejected").length;
    const lowStock = products.filter((p) => p.approval_status === "approved" && p.stock > 0 && p.stock <= 5).length;
    const revenue = enquiries
      .filter((e) => e.status === "completed" || e.status === "delivered")
      .reduce((s, e) => s + e.price * e.quantity, 0);
    return { live, pending, rejected, lowStock, revenue, enquiries: enquiries.length };
  }, [products, enquiries]);

  const openCreate = () => {
    setForm({ ...emptyForm });
    setEditorOpen(true);
  };
  const openEdit = (p: Product) => {
    setForm({
      id: p.id,
      name: p.name,
      description: p.description ?? "",
      category: p.category,
      price: String(p.price),
      unit: p.unit ?? "kg",
      stock: String(p.stock ?? 0),
      image_url: p.image_url ?? "",
      photos: p.photos ?? [],
      video_url: p.video_url ?? "",
    });
    setEditorOpen(true);
  };

  const uploadFile = async (file: File, kind: "image" | "video") => {
    if (!user) return null;
    const ext = file.name.split(".").pop() || (kind === "image" ? "jpg" : "mp4");
    const path = `${user.id}/products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from("images").upload(path, file, {
      cacheControl: "3600", upsert: false, contentType: file.type,
    });
    if (error) {
      toast.error(error.message);
      return null;
    }
    return supabase.storage.from("images").getPublicUrl(path).data.publicUrl;
  };

  const handleImages = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setUploading(true);
    const remaining = Math.max(0, 6 - form.photos.length);
    const list = Array.from(files).slice(0, remaining);
    const urls: string[] = [];
    for (const f of list) {
      if (f.size > 5 * 1024 * 1024) { toast.error(`${f.name} exceeds 5MB`); continue; }
      const url = await uploadFile(f, "image");
      if (url) urls.push(url);
    }
    setForm((prev) => ({
      ...prev,
      photos: [...prev.photos, ...urls],
      image_url: prev.image_url || urls[0] || "",
    }));
    setUploading(false);
  };

  const handleVideo = async (file?: File) => {
    if (!file) return;
    if (file.size > 30 * 1024 * 1024) { toast.error("Video must be under 30MB"); return; }
    setUploading(true);
    const url = await uploadFile(file, "video");
    setUploading(false);
    if (url) setForm((prev) => ({ ...prev, video_url: url }));
  };

  const removePhoto = (i: number) => {
    setForm((prev) => {
      const photos = prev.photos.filter((_, idx) => idx !== i);
      return { ...prev, photos, image_url: photos[0] || "" };
    });
  };

  const saveProduct = async () => {
    if (!user) return;
    if (!form.name.trim() || !form.price) { toast.error("Name and price are required"); return; }
    const price = Number(form.price);
    const stock = parseInt(form.stock || "0", 10);
    if (!(price > 0)) { toast.error("Price must be greater than 0"); return; }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      category: form.category,
      price,
      unit: form.unit,
      stock,
      image_url: form.image_url || form.photos[0] || null,
      photos: form.photos,
      video_url: form.video_url || null,
    };
    let error;
    if (form.id) {
      ({ error } = await supabase.from("products").update(payload).eq("id", form.id).eq("seller_id", user.id));
    } else {
      ({ error } = await supabase.from("products").insert({ ...payload, seller_id: user.id }));
    }
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(form.id ? "Listing updated" : "Listing submitted for approval");
    setEditorOpen(false);
    load();
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Listing deleted"); load(); }
  };

  const quickUpdate = async (id: string, patch: Partial<Pick<Product, "price" | "stock">>) => {
    const { error } = await supabase.from("products").update(patch).eq("id", id);
    if (error) toast.error(error.message);
    else load();
  };

  return (
    <div className="container py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-bold">Seller Dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage your marketplace listings, inventory and enquiries.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/cattle-market/new"><Beef className="mr-1.5 h-4 w-4" /> New cattle</Link>
          </Button>
          <Button onClick={openCreate}><Plus className="mr-1.5 h-4 w-4" /> New product</Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Products ({products.length})</TabsTrigger>
          <TabsTrigger value="cattle">Cattle ({cattle.length})</TabsTrigger>
          <TabsTrigger value="enquiries">Enquiries ({enquiries.length})</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="mt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard icon={Eye} label="Live listings" value={stats.live} />
            <StatCard icon={Boxes} label="Pending review" value={stats.pending} />
            <StatCard icon={X} label="Rejected" value={stats.rejected} />
            <StatCard icon={Package} label="Low stock (≤5)" value={stats.lowStock} />
            <StatCard
              icon={TrendingUp}
              label="Revenue (completed)"
              value={`₹${stats.revenue.toLocaleString("en-IN")}`}
            />
          </div>

          <Card className="mt-6">
            <CardHeader><CardTitle className="text-base">Recent enquiries</CardTitle></CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-24 w-full" />
              ) : enquiries.length === 0 ? (
                <p className="text-sm text-muted-foreground">No enquiries yet. Share your listings to get started.</p>
              ) : (
                <ul className="divide-y">
                  {enquiries.slice(0, 5).map((e) => (
                    <li key={`${e.order_id}-${e.product_id}`} className="flex items-center justify-between py-2 text-sm">
                      <div>
                        <div className="font-medium">{e.product_name}</div>
                        <div className="text-xs text-muted-foreground">
                          Qty {e.quantity} • {new Date(e.created_at).toLocaleString()}
                        </div>
                      </div>
                      <Badge variant="outline" className="capitalize">{e.status}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Products */}
        <TabsContent value="products" className="mt-6 space-y-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
          ) : products.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No products yet"
              description="Add your first dairy product, feed, medicine or equipment."
              cta={<Button onClick={openCreate}><Plus className="mr-1.5 h-4 w-4" /> New product</Button>}
            />
          ) : (
            products.map((p) => (
              <Card key={p.id}>
                <CardContent className="flex flex-wrap items-center gap-4 p-4">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <ImageIcon className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-[180px] flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{p.name}</h3>
                      {p.approved ? (
                        <Badge variant="secondary">Live</Badge>
                      ) : (
                        <Badge className="bg-amber-500 hover:bg-amber-500">Pending</Badge>
                      )}
                      <Badge variant="outline" className="capitalize">{p.category}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Posted {new Date(p.created_at).toLocaleDateString()} • {p.photos?.length || (p.image_url ? 1 : 0)} photo(s)
                      {p.video_url ? " • 1 video" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground">₹</Label>
                    <Input
                      type="number"
                      defaultValue={p.price}
                      onBlur={(e) => {
                        const v = Number(e.target.value);
                        if (v > 0 && v !== p.price) quickUpdate(p.id, { price: v });
                      }}
                      className="h-9 w-24"
                    />
                    <Label className="text-xs text-muted-foreground">Stock</Label>
                    <Input
                      type="number"
                      defaultValue={p.stock}
                      onBlur={(e) => {
                        const v = parseInt(e.target.value || "0", 10);
                        if (v !== p.stock) quickUpdate(p.id, { stock: v });
                      }}
                      className="h-9 w-20"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEdit(p)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete {p.name}?</AlertDialogTitle>
                          <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteProduct(p.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Cattle */}
        <TabsContent value="cattle" className="mt-6 space-y-3">
          {loading ? (
            <Skeleton className="h-24 w-full" />
          ) : cattle.length === 0 ? (
            <EmptyState
              icon={Beef}
              title="No cattle listed"
              description="Sell cows, buffaloes or calves on the marketplace."
              cta={<Button asChild><Link to="/cattle-market/new"><Plus className="mr-1.5 h-4 w-4" /> New cattle listing</Link></Button>}
            />
          ) : (
            cattle.map((c) => (
              <Card key={c.id}>
                <CardContent className="flex flex-wrap items-center gap-4 p-4">
                  <div className="h-20 w-20 overflow-hidden rounded-md bg-muted">
                    {(c.photos?.[0] || c.image_url) ? (
                      <img src={c.photos?.[0] || c.image_url || ""} alt={c.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <Beef className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-[160px] flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{c.name}</h3>
                      <Badge variant="outline">{c.status || "active"}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {c.breed || "—"} • {[c.district, c.state].filter(Boolean).join(", ") || "Location not set"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-primary">
                    <IndianRupee className="h-4 w-4" />
                    <span className="font-bold">{Number(c.price).toLocaleString("en-IN")}</span>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link to={`/cattle-market/${c.id}/edit`}><Pencil className="mr-1.5 h-4 w-4" /> Edit</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link to="/my-listings">Manage</Link>
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Enquiries */}
        <TabsContent value="enquiries" className="mt-6 space-y-3">
          {loading ? (
            <Skeleton className="h-24 w-full" />
          ) : enquiries.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title="No enquiries yet"
              description="Buyer enquiries on your products show up here."
            />
          ) : (
            <Card>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Product</th>
                      <th className="px-4 py-3">Qty</th>
                      <th className="px-4 py-3">Total</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enquiries.map((e) => (
                      <tr key={`${e.order_id}-${e.product_id}`} className="border-t">
                        <td className="px-4 py-3 font-medium">{e.product_name}</td>
                        <td className="px-4 py-3">{e.quantity}</td>
                        <td className="px-4 py-3">₹{(e.price * e.quantity).toLocaleString("en-IN")}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="capitalize">{e.status}</Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(e.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Editor */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit product" : "New product"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1.5" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="mt-1.5"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c} className="capitalize">{c.replace("_", " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Unit</Label>
                <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Price (₹)</Label>
                <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="mt-1.5" />
              </div>
              <div>
                <Label>Stock</Label>
                <Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="mt-1.5" />
              </div>
            </div>

            {/* Photos */}
            <div>
              <div className="flex items-center justify-between">
                <Label>Photos ({form.photos.length}/6)</Label>
                <label className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-primary hover:underline">
                  <ImageIcon className="h-4 w-4" />
                  Add images
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    disabled={uploading || form.photos.length >= 6}
                    onChange={(e) => handleImages(e.target.files)}
                  />
                </label>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
                {form.photos.map((p, i) => (
                  <div key={p} className="group relative aspect-square overflow-hidden rounded-md bg-muted">
                    <img src={p} alt={`photo ${i + 1}`} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="absolute right-1 top-1 rounded-full bg-background/90 p-0.5 opacity-0 transition group-hover:opacity-100"
                      aria-label="Remove photo"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                {form.photos.length === 0 && (
                  <p className="col-span-full text-xs text-muted-foreground">PNG/JPG, up to 5MB each.</p>
                )}
              </div>
            </div>

            {/* Video */}
            <div>
              <div className="flex items-center justify-between">
                <Label>Video (optional)</Label>
                <label className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-primary hover:underline">
                  <Video className="h-4 w-4" />
                  {form.video_url ? "Replace" : "Upload video"}
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => handleVideo(e.target.files?.[0])}
                  />
                </label>
              </div>
              {form.video_url ? (
                <video src={form.video_url} controls className="mt-2 max-h-40 w-full rounded-md bg-black" />
              ) : (
                <p className="mt-1 text-xs text-muted-foreground">MP4 up to 30MB.</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditorOpen(false)}>Cancel</Button>
            <Button onClick={saveProduct} disabled={saving || uploading}>
              {(saving || uploading) && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              {form.id ? "Save changes" : "Submit for approval"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: number | string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="rounded-md bg-primary/10 p-2 text-primary"><Icon className="h-5 w-5" /></div>
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-xl font-bold">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({
  icon: Icon, title, description, cta,
}: { icon: any; title: string; description: string; cta?: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
        <Icon className="h-10 w-10 text-muted-foreground/60" />
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
        {cta}
      </CardContent>
    </Card>
  );
}
