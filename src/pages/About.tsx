import { Card, CardContent } from "@/components/ui/card";
import { Sprout, Factory, Stethoscope, ShoppingCart, BarChart3, ShieldCheck, Globe2, HeartHandshake } from "lucide-react";

const FEATURES = [
  { Icon: ShoppingCart, t: "Unified Marketplace", d: "Buy and sell cattle feed and livestock in one trusted place." },
  { Icon: BarChart3, t: "Live Milk Rates", d: "Verified industry-published rates updated in real-time." },
  { Icon: Stethoscope, t: "Vet Network", d: "Find nearby veterinarians by animal type with one tap." },
  { Icon: ShieldCheck, t: "Verified Accounts", d: "Industry accounts go through admin verification for trust." },
  { Icon: Globe2, t: "Multi-language", d: "Available in 9 Indian languages for every farmer." },
  { Icon: HeartHandshake, t: "Government Schemes", d: "Direct links to subsidies and loans like PM Kisan & NABARD." },
];

export default function About() {
  return (
    <div className="container max-w-5xl py-10">
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold md:text-4xl">About Smart Dairy Hub</h1>
        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
          We're building India's most trusted digital ecosystem for dairy — connecting farmers, industries and veterinarians on a single, easy-to-use platform.
        </p>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        <Card><CardContent className="p-6">
          <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary"><Sprout className="h-5 w-5" /></div>
          <h2 className="text-xl font-semibold">Our Mission</h2>
          <p className="mt-2 text-muted-foreground">Empower every dairy farmer with technology — fair prices, transparent markets and timely veterinary care, in their own language.</p>
        </CardContent></Card>
        <Card><CardContent className="p-6">
          <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary"><Factory className="h-5 w-5" /></div>
          <h2 className="text-xl font-semibold">Our Vision</h2>
          <p className="mt-2 text-muted-foreground">A connected dairy India where every farmer, mediator and industry transacts with trust, speed and dignity.</p>
        </CardContent></Card>
      </div>

      <h2 className="mt-12 text-center font-display text-2xl font-bold">What we offer</h2>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {FEATURES.map((f) => (
          <Card key={f.t}><CardContent className="p-5">
            <f.Icon className="h-6 w-6 text-primary" />
            <p className="mt-2 font-semibold">{f.t}</p>
            <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
          </CardContent></Card>
        ))}
      </div>

      <div className="mt-12 grid gap-4 md:grid-cols-2">
        <Card><CardContent className="p-6">
          <h3 className="text-lg font-semibold">Benefits for Farmers</h3>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Sell cattle & feed directly — no middleman charges</li>
            <li>Compare milk rates across companies in your district</li>
            <li>Book veterinarians nearby in minutes</li>
            <li>Access government schemes and loan info</li>
          </ul>
        </CardContent></Card>
        <Card><CardContent className="p-6">
          <h3 className="text-lg font-semibold">Benefits for Industries</h3>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Reach verified farmers across states</li>
            <li>Publish daily milk rates with morning/evening sessions</li>
            <li>Build trust with verified business profiles</li>
            <li>Real-time notifications and analytics</li>
          </ul>
        </CardContent></Card>
      </div>

      <Card className="mt-12">
        <CardContent className="p-6 text-center">
          <h3 className="text-lg font-semibold">Contact</h3>
          <p className="mt-2 text-muted-foreground">support@smartdairyhub.in · 1800-180-1551 · Hyderabad, Telangana, India</p>
        </CardContent>
      </Card>
    </div>
  );
}
