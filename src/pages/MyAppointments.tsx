import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { CalendarClock, Stethoscope, MapPin, Phone, RefreshCw } from "lucide-react";

type Appointment = {
  id: string;
  vet_id: string | null;
  directory_vet_id?: string | null;
  farmer_id: string;
  animal_type: string | null;
  symptoms: string;
  mode: string;
  status: "pending" | "accepted" | "rejected" | "completed" | "cancelled" | string;
  scheduled_at: string | null;
  contact_phone: string | null;
  location: string | null;
  notes: string | null;
  prescription: string | null;
  created_at: string;
  updated_at: string;
};

const statusVariant: Record<string, string> = {
  pending: "bg-amber-100 text-amber-900 border-amber-200",
  accepted: "bg-emerald-100 text-emerald-900 border-emerald-200",
  rejected: "bg-red-100 text-red-900 border-red-200",
  completed: "bg-blue-100 text-blue-900 border-blue-200",
  cancelled: "bg-muted text-muted-foreground border-border",
};

const fmt = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—";

export default function MyAppointments() {
  const { user } = useAuth();
  const [items, setItems] = useState<Appointment[]>([]);
  const [vetNames, setVetNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");

  const APPT_COLS = "id,farmer_id,vet_id,directory_vet_id,animal_type,symptoms,mode,status,scheduled_at,location,notes,prescription,created_at,updated_at";

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("appointments")
      .select(APPT_COLS)
      .eq("farmer_id", user.id)
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Failed to load appointments", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }
    const baseRows = (data ?? []) as unknown as Appointment[];
    // Fetch contact phone for each appointment via secure RPC (farmer's own phone)
    const phones = await Promise.all(
      baseRows.map((r) =>
        supabase.rpc("get_appointment_contact_phone" as any, { _appointment_id: r.id } as any).then(({ data }) => data as unknown as string | null),
      ),
    );
    const rows = baseRows.map((r, i) => ({ ...r, contact_phone: phones[i] ?? null }));
    setItems(rows);
    const map: Record<string, string> = {};
    const ids = Array.from(new Set(rows.map((r) => r.vet_id).filter((v): v is string => !!v)));
    if (ids.length) {
      const { data: names } = await supabase.rpc("get_display_names", { _ids: ids });
      (names ?? []).forEach((n: any) => (map[n.user_id] = n.full_name || "Veterinarian"));
    }
    const dirIds = Array.from(new Set(rows.map((r) => r.directory_vet_id).filter((v): v is string => !!v)));
    if (dirIds.length) {
      const { data: dirVets } = await supabase
        .from("vet_doctors_public" as any)
        .select("id,name,hospital_name")
        .in("id", dirIds);
      (dirVets ?? []).forEach((v: any) => (map[v.id] = v.name || v.hospital_name || "Veterinarian"));
    }
    setVetNames(map);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user?.id]);

  // Realtime: appointments + notifications
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("farmer-appointments")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments", filter: `farmer_id=eq.${user.id}` },
        (payload) => {
          setItems((prev) => {
            if (payload.eventType === "INSERT") return [payload.new as Appointment, ...prev];
            if (payload.eventType === "UPDATE") {
              const next = payload.new as Appointment;
              if (next.status !== (payload.old as Appointment).status) {
                toast({
                  title: `Appointment ${next.status}`,
                  description: `Your request was ${next.status}.`,
                });
              }
              return prev.map((a) => (a.id === next.id ? next : a));
            }
            if (payload.eventType === "DELETE") return prev.filter((a) => a.id !== (payload.old as Appointment).id);
            return prev;
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload: any) => {
          if (payload.new?.title?.toLowerCase().includes("appointment")) {
            toast({ title: payload.new.title, description: payload.new.body });
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const filtered = useMemo(() => {
    if (tab === "all") return items;
    return items.filter((a) => a.status === tab);
  }, [items, tab]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length, pending: 0, accepted: 0, rejected: 0, completed: 0 };
    items.forEach((a) => {
      c[a.status] = (c[a.status] || 0) + 1;
    });
    return c;
  }, [items]);

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold">My Appointments</h1>
          <p className="text-sm text-muted-foreground">Track requests to veterinarians. Updates appear in realtime.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button asChild size="sm">
            <Link to="/book-vet">Book a vet</Link>
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({counts.pending || 0})</TabsTrigger>
          <TabsTrigger value="accepted">Accepted ({counts.accepted || 0})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({counts.rejected || 0})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({counts.completed || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-6 space-y-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-1/3" />
                </CardHeader>
                <CardContent className="space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No appointments here yet.{" "}
                <Link to="/book-vet" className="text-primary underline">
                  Book your first consultation
                </Link>
                .
              </CardContent>
            </Card>
          ) : (
            filtered.map((a) => (
              <Card key={a.id} className="overflow-hidden">
                <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Stethoscope className="h-5 w-5 text-primary" />
                      {vetNames[a.directory_vet_id || a.vet_id || ""] || "Veterinarian"}
                    </CardTitle>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Requested {fmt(a.created_at)}
                      {a.updated_at && a.updated_at !== a.created_at ? ` • Updated ${fmt(a.updated_at)}` : ""}
                    </p>
                  </div>
                  <Badge variant="outline" className={`capitalize ${statusVariant[a.status] || ""}`}>
                    {a.status}
                  </Badge>
                </CardHeader>
                <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="h-4 w-4 text-muted-foreground" />
                    <span>Preferred: {fmt(a.scheduled_at)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-muted px-2 py-0.5 text-xs capitalize">{a.mode.replace("_", " ")}</span>
                    {a.animal_type && <span className="text-muted-foreground">• {a.animal_type}</span>}
                  </div>
                  {a.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{a.location}</span>
                    </div>
                  )}
                  {a.contact_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{a.contact_phone}</span>
                    </div>
                  )}
                  <div className="sm:col-span-2">
                    <p className="text-xs font-medium text-muted-foreground">Symptoms / Notes</p>
                    <p className="whitespace-pre-wrap">{a.symptoms}</p>
                  </div>
                  {a.notes && (
                    <div className="sm:col-span-2 rounded-md bg-muted/50 p-3">
                      <p className="text-xs font-medium text-muted-foreground">Vet notes</p>
                      <p className="whitespace-pre-wrap text-sm">{a.notes}</p>
                    </div>
                  )}
                  {a.prescription && (
                    <div className="sm:col-span-2 rounded-md border border-primary/20 bg-primary/5 p-3">
                      <p className="text-xs font-medium text-primary">Prescription</p>
                      <p className="whitespace-pre-wrap text-sm">{a.prescription}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
