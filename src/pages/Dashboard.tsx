import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Milk, TrendingUp, Calculator, ArrowRight, Plus, Trash2, IndianRupee, Stethoscope, ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [scans, setScans] = useState<any[]>([]);
  const [scansLoading, setScansLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  // Form state
  const [shift, setShift] = useState("morning");
  const [liters, setLiters] = useState("");
  const [fat, setFat] = useState("");
  const [snf, setSnf] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [saving, setSaving] = useState(false);

  const fetchRecords = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("milk_records")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .order("shift", { ascending: true })
      .limit(50);
    if (!error) setRecords(data || []);
    setLoading(false);
  };

  const fetchScans = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("disease_reports")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setScans(data || []);
    setScansLoading(false);
  };

  useEffect(() => {
    fetchRecords();
    fetchScans();
  }, [user]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const l = parseFloat(liters), f = parseFloat(fat), s = parseFloat(snf);
    if (isNaN(l) || isNaN(f) || isNaN(s) || l <= 0 || f < 0 || f > 15 || s < 0 || s > 15) {
      toast.error("Please enter valid values");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("milk_records").insert({
      user_id: user.id, date, shift, liters: l, fat: f, snf: s,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Milk entry added!");
    setAddOpen(false);
    setLiters(""); setFat(""); setSnf("");
    fetchRecords();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("milk_records").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Entry deleted");
    fetchRecords();
  };

  // Stats
  const today = new Date().toISOString().split("T")[0];
  const todayRecords = records.filter((r) => r.date === today);
  const todayLiters = todayRecords.reduce((s, r) => s + Number(r.liters), 0);
  const todayEarnings = todayRecords.reduce((s, r) => s + Number(r.amount || 0), 0);
  const avgFat = todayRecords.length > 0 ? todayRecords.reduce((s, r) => s + Number(r.fat), 0) / todayRecords.length : 0;
  const avgSnf = todayRecords.length > 0 ? todayRecords.reduce((s, r) => s + Number(r.snf), 0) / todayRecords.length : 0;

  // Chart data - last 7 days
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const ds = d.toISOString().split("T")[0];
    const dayRecords = records.filter((r) => r.date === ds);
    return {
      date: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      liters: dayRecords.reduce((s, r) => s + Number(r.liters), 0),
      earnings: dayRecords.reduce((s, r) => s + Number(r.amount || 0), 0),
    };
  });

  const stats = [
    { label: "Today's Collection", value: `${todayLiters.toFixed(1)} L`, icon: Milk },
    { label: "Avg. FAT", value: `${avgFat.toFixed(1)}%`, icon: TrendingUp },
    { label: "Avg. SNF", value: `${avgSnf.toFixed(1)}%`, icon: TrendingUp },
    { label: "Today's Earning", value: `₹${todayEarnings.toFixed(0)}`, icon: Calculator },
  ];

  return (
    <div className="container py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Welcome back, {profile?.full_name || "Farmer"}!
          </p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Add Milk Entry</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display">Add Milk Entry</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date</Label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1.5" />
                </div>
                <div>
                  <Label>Shift</Label>
                  <Select value={shift} onValueChange={setShift}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">Morning</SelectItem>
                      <SelectItem value="evening">Evening</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Liters</Label>
                  <Input type="number" step="0.1" placeholder="10" value={liters} onChange={(e) => setLiters(e.target.value)} required className="mt-1.5" />
                </div>
                <div>
                  <Label>FAT %</Label>
                  <Input type="number" step="0.1" placeholder="4.5" value={fat} onChange={(e) => setFat(e.target.value)} required className="mt-1.5" />
                </div>
                <div>
                  <Label>SNF %</Label>
                  <Input type="number" step="0.1" placeholder="8.5" value={snf} onChange={(e) => setSnf(e.target.value)} required className="mt-1.5" />
                </div>
              </div>
              {fat && snf && liters && (
                <div className="rounded-lg border bg-muted/50 p-3 text-sm">
                  <p>Rate: ₹{(parseFloat(fat || "0") * 6 + parseFloat(snf || "0") * 3).toFixed(2)}/L</p>
                  <p className="font-semibold text-primary">Total: ₹{((parseFloat(fat || "0") * 6 + parseFloat(snf || "0") * 3) * parseFloat(liters || "0")).toFixed(2)}</p>
                </div>
              )}
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? "Saving..." : "Save Entry"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="font-display text-xl font-bold">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        {/* Chart */}
        <Card>
          <CardHeader><CardTitle className="font-display">7-Day Collection</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="liters" fill="hsl(142, 45%, 28%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="font-display">7-Day Earnings</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="earnings" stroke="hsl(36, 80%, 55%)" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent entries */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="font-display">Recent Milk Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : records.length === 0 ? (
            <p className="text-muted-foreground">No entries yet. Add your first milk entry!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Shift</th>
                    <th className="pb-3 font-medium text-right">Liters</th>
                    <th className="pb-3 font-medium text-right">FAT%</th>
                    <th className="pb-3 font-medium text-right">SNF%</th>
                    <th className="pb-3 font-medium text-right">Rate</th>
                    <th className="pb-3 font-medium text-right">Amount</th>
                    <th className="pb-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="py-3">{new Date(r.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                      <td className="py-3 capitalize">{r.shift}</td>
                      <td className="py-3 text-right">{Number(r.liters).toFixed(1)}</td>
                      <td className="py-3 text-right">{Number(r.fat).toFixed(1)}</td>
                      <td className="py-3 text-right">{Number(r.snf).toFixed(1)}</td>
                      <td className="py-3 text-right">₹{Number(r.rate).toFixed(2)}</td>
                      <td className="py-3 text-right font-semibold text-primary">₹{Number(r.amount).toFixed(2)}</td>
                      <td className="py-3 text-right">
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(r.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
