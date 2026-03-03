import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Milk, TrendingUp, ShoppingCart, Stethoscope, Landmark, Calculator, ArrowRight } from "lucide-react";

const stats = [
  { label: "Today's Collection", value: "42 L", icon: Milk, change: "+5%" },
  { label: "Avg. FAT", value: "4.2%", icon: TrendingUp, change: "+0.3%" },
  { label: "Avg. SNF", value: "8.6%", icon: TrendingUp, change: "+0.1%" },
  { label: "Today's Earning", value: "₹1,470", icon: Calculator, change: "+8%" },
];

const quickLinks = [
  { title: "Milk Calculator", desc: "Calculate today's rate", icon: Calculator, to: "/milk-calculator", color: "bg-primary/10 text-primary" },
  { title: "Cattle Market", desc: "Buy & sell cattle", icon: ShoppingCart, to: "/cattle-market", color: "bg-accent/20 text-accent-foreground" },
  { title: "Vet Contacts", desc: "Find a doctor", icon: Stethoscope, to: "/vet-contacts", color: "bg-success/10 text-success" },
  { title: "Govt. Schemes", desc: "View subsidies", icon: Landmark, to: "/schemes", color: "bg-warning/20 text-warning-foreground" },
];

const recentEntries = [
  { date: "03 Mar 2026", shift: "Morning", liters: 22, fat: 4.3, snf: 8.7, amount: 792 },
  { date: "03 Mar 2026", shift: "Evening", liters: 20, fat: 4.1, snf: 8.5, amount: 678 },
  { date: "02 Mar 2026", shift: "Morning", liters: 24, fat: 4.5, snf: 8.8, amount: 885 },
  { date: "02 Mar 2026", shift: "Evening", liters: 18, fat: 4.0, snf: 8.4, amount: 610 },
];

export default function Dashboard() {
  return (
    <div className="container py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">Welcome back, Farmer! Here's your dairy overview.</p>
        </div>
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
                <div className="flex items-baseline gap-2">
                  <p className="font-display text-xl font-bold">{s.value}</p>
                  <span className="text-xs font-medium text-success">{s.change}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Quick Links */}
        <div className="lg:col-span-1">
          <h2 className="font-display text-xl font-bold">Quick Access</h2>
          <div className="mt-4 grid gap-3">
            {quickLinks.map((q) => (
              <Link key={q.to} to={q.to} className="group flex items-center gap-3 rounded-lg border bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-md">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${q.color}`}>
                  <q.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{q.title}</p>
                  <p className="text-xs text-muted-foreground">{q.desc}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            ))}
          </div>
        </div>

        {/* Recent entries */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display">Recent Milk Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Shift</th>
                    <th className="pb-3 font-medium text-right">Liters</th>
                    <th className="pb-3 font-medium text-right">FAT%</th>
                    <th className="pb-3 font-medium text-right">SNF%</th>
                    <th className="pb-3 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentEntries.map((e, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-3">{e.date}</td>
                      <td className="py-3">{e.shift}</td>
                      <td className="py-3 text-right">{e.liters}</td>
                      <td className="py-3 text-right">{e.fat}</td>
                      <td className="py-3 text-right">{e.snf}</td>
                      <td className="py-3 text-right font-semibold text-primary">₹{e.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
