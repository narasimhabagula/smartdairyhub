import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pencil, Trash2, CheckCircle2, Plus, Heart, IndianRupee, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { deleteCattleFiles } from "@/lib/cattle-media";

export default function MyListings() {
  const { user } = useAuth();
  const [tab, setTab] = useState("mine");
  const [mine, setMine] = useState<any[]>([]);
  const [favs, setFavs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: m }, { data: f }] = await Promise.all([
      supabase.from("cattle_listings").select("*").eq("seller_id", user.id).order("created_at", { ascending: false }),
      supabase.from("cattle_favorites" as any).select("listing_id, cattle_listings(*)").eq("user_id", user.id),
    ]);
    setMine(m || []);
    setFavs(((f as any[]) || []).map((r) => r.cattle_listings).filter(Boolean));
    setLoading(false);
  };
  useEffect(() => { load(); }, [user]);

  const markSold = async (id: string) => {
    const { error } = await supabase.from("cattle_listings").update({ status: "sold" }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Marked as sold"); load(); }
  };
  const reactivate = async (id: string) => {
    const { error } = await supabase.from("cattle_listings").update({ status: "active" }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Listing active"); load(); }
  };
  const remove = async (row: any) => {
    const urls = [...(row.photos || []), row.video_url].filter(Boolean);
    const { error } = await supabase.from("cattle_listings").delete().eq("id", row.id);
    if (error) { toast.error(error.message); return; }
    await deleteCattleFiles(urls);
    toast.success("Listing deleted"); load();
  };
  const unfav = async (listingId: string) => {
    await supabase.from("cattle_favorites" as any).delete().eq("user_id", user!.id).eq("listing_id", listingId);
    load();
  };

  return (
    <div className="container py-10">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">My Cattle</h1>
          <p className="mt-1 text-muted-foreground">Manage your listings and saved animals.</p>
        </div>
        <Button asChild className="gap-2"><Link to="/cattle-market/new"><Plus className="h-4 w-4" /> New Listing</Link></Button>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mt-6">
        <TabsList>
          <TabsTrigger value="mine">My Listings ({mine.length})</TabsTrigger>
          <TabsTrigger value="favs"><Heart className="mr-1.5 h-3.5 w-3.5" /> Saved ({favs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="mine" className="mt-6">
          {loading ? <Loader2 className="mx-auto h-6 w-6 animate-spin" /> :
            mine.length === 0 ? <Empty msg="You haven't listed any animals yet." /> :
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {mine.map((c) => (
                <Card key={c.id} className="overflow-hidden">
                  <Link to={`/cattle-market/${c.id}`} className="block aspect-[4/3] bg-muted">
                    {c.photos?.[0] || c.image_url ? <img src={c.photos?.[0] || c.image_url} alt={c.name} loading="lazy" className="h-full w-full object-cover" /> : null}
                  </Link>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <Link to={`/cattle-market/${c.id}`} className="font-semibold hover:underline">{c.name}</Link>
                      <Badge variant={c.status === "sold" ? "secondary" : "default"}>{c.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{c.breed}</p>
                    <p className="flex items-center font-semibold text-primary"><IndianRupee className="h-4 w-4" />{Number(c.price).toLocaleString("en-IN")}</p>
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button size="sm" variant="outline" asChild><Link to={`/cattle-market/${c.id}/edit`}><Pencil className="mr-1 h-3.5 w-3.5" />Edit</Link></Button>
                      {c.status === "sold" ? (
                        <Button size="sm" variant="outline" onClick={() => reactivate(c.id)}>Reactivate</Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => markSold(c.id)}><CheckCircle2 className="mr-1 h-3.5 w-3.5" />Mark Sold</Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive"><Trash2 className="mr-1 h-3.5 w-3.5" />Delete</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this listing?</AlertDialogTitle>
                            <AlertDialogDescription>This will permanently remove the listing and its uploaded photos/video.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => remove(c)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>}
        </TabsContent>

        <TabsContent value="favs" className="mt-6">
          {loading ? <Loader2 className="mx-auto h-6 w-6 animate-spin" /> :
            favs.length === 0 ? <Empty msg="No saved animals yet." /> :
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {favs.map((c) => (
                <Card key={c.id} className="overflow-hidden">
                  <Link to={`/cattle-market/${c.id}`} className="block aspect-[4/3] bg-muted">
                    {c.photos?.[0] || c.image_url ? <img src={c.photos?.[0] || c.image_url} alt={c.name} loading="lazy" className="h-full w-full object-cover" /> : null}
                  </Link>
                  <CardContent className="p-4 space-y-1">
                    <Link to={`/cattle-market/${c.id}`} className="font-semibold hover:underline">{c.name}</Link>
                    <p className="text-sm text-muted-foreground">{c.breed}</p>
                    <p className="flex items-center font-semibold text-primary"><IndianRupee className="h-4 w-4" />{Number(c.price).toLocaleString("en-IN")}</p>
                    <Button size="sm" variant="ghost" className="mt-2 text-muted-foreground" onClick={() => unfav(c.id)}>
                      <Heart className="mr-1 h-3.5 w-3.5 fill-current" /> Remove
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return <p className="text-center text-muted-foreground py-12">{msg}</p>;
}
