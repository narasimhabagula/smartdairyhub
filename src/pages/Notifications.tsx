import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, CheckCheck, Check, Trash2, Inbox, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

type Notif = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
};

type Filter = "all" | "approval" | "unread";

function categoryOf(n: Notif): "approved" | "rejected" | "pending" | "other" {
  const t = (n.title || "").toLowerCase();
  if (t.includes("approved") || t.includes("live")) return "approved";
  if (t.includes("rejected")) return "rejected";
  if (t.includes("pending") || t.includes("review")) return "pending";
  return "other";
}

function timeAgo(iso: string) {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function Notifications() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("notifications")
      .select("id,title,body,link,read,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) toast.error(error.message);
    setItems((data as Notif[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    load();
    const ch = supabase
      .channel(`notif-page-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        load
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const counts = useMemo(() => {
    const approval = items.filter((n) => categoryOf(n) !== "other").length;
    const unread = items.filter((n) => !n.read).length;
    return { all: items.length, approval, unread };
  }, [items]);

  const visible = useMemo(() => {
    if (filter === "unread") return items.filter((n) => !n.read);
    if (filter === "approval") return items.filter((n) => categoryOf(n) !== "other");
    return items;
  }, [items, filter]);

  const markRead = async (id: string, read = true) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read } : n)));
    const { error } = await supabase.from("notifications").update({ read }).eq("id", id);
    if (error) {
      toast.error(error.message);
      load();
    }
  };

  const markAllRead = async () => {
    if (!user) return;
    const unreadIds = items.filter((n) => !n.read).map((n) => n.id);
    if (!unreadIds.length) return;
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);
    if (error) {
      toast.error(error.message);
      load();
    } else {
      toast.success(`${unreadIds.length} marked as read`);
    }
  };

  const remove = async (id: string) => {
    setItems((prev) => prev.filter((n) => n.id !== id));
    const { error } = await supabase.from("notifications").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      load();
    }
  };

  return (
    <div className="container max-w-3xl py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-bold flex items-center gap-2">
            <Bell className="h-7 w-7 text-primary" /> Notification center
          </h1>
          <p className="text-sm text-muted-foreground">
            Approval updates, enquiries and platform alerts in one place.
          </p>
        </div>
        <Button onClick={markAllRead} disabled={counts.unread === 0} variant="outline" className="gap-1.5">
          <CheckCheck className="h-4 w-4" /> Mark all read
        </Button>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
        <TabsList>
          <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
          <TabsTrigger value="approval">Approvals ({counts.approval})</TabsTrigger>
          <TabsTrigger value="unread">Unread ({counts.unread})</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-4">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
                <Inbox className="h-10 w-10 text-muted-foreground" />
                <p className="font-medium">You're all caught up</p>
                <p className="text-sm text-muted-foreground">
                  New approval decisions and enquiries will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {visible.map((n) => {
                const cat = categoryOf(n);
                const Icon =
                  cat === "approved" ? CheckCircle2 : cat === "rejected" ? AlertCircle : cat === "pending" ? Clock : Bell;
                const tone =
                  cat === "approved"
                    ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30"
                    : cat === "rejected"
                    ? "text-destructive bg-destructive/10"
                    : cat === "pending"
                    ? "text-amber-600 bg-amber-50 dark:bg-amber-950/30"
                    : "text-primary bg-primary/10";
                return (
                  <Card key={n.id} className={!n.read ? "border-primary/40 bg-primary/5" : ""}>
                    <CardContent className="flex gap-3 p-4">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${tone}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-medium leading-tight">{n.title}</h3>
                          {!n.read && <Badge className="h-5 px-1.5 text-[10px]">New</Badge>}
                          {cat !== "other" && (
                            <Badge variant="outline" className="h-5 px-1.5 text-[10px] capitalize">
                              {cat}
                            </Badge>
                          )}
                        </div>
                        {n.body && <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>}
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span>{timeAgo(n.created_at)}</span>
                          {n.link && (
                            <Link
                              to={n.link}
                              onClick={() => !n.read && markRead(n.id, true)}
                              className="font-medium text-primary hover:underline"
                            >
                              Open
                            </Link>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={n.read ? "Mark unread" : "Mark read"}
                          onClick={() => markRead(n.id, !n.read)}
                        >
                          <Check className={`h-4 w-4 ${n.read ? "opacity-40" : ""}`} />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Delete"
                          onClick={() => remove(n.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
