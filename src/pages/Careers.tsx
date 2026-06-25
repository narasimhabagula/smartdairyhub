import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, Mail } from "lucide-react";

const ROLES = [
  { t: "Frontend Engineer (React)", loc: "Remote · India", type: "Full-time" },
  { t: "Backend Engineer (Node / Postgres)", loc: "Hyderabad / Remote", type: "Full-time" },
  { t: "Field Operations Lead", loc: "Telangana / Andhra Pradesh", type: "Full-time" },
  { t: "Community Manager", loc: "Remote · India", type: "Contract" },
];

export default function Careers() {
  return (
    <div className="container max-w-4xl py-10">
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold md:text-4xl">Careers at Smart Dairy Hub</h1>
        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">Help us build the most trusted dairy platform in India. We're a small, mission-driven team that ships fast and stays close to farmers.</p>
      </div>
      <div className="mt-8 grid gap-4">
        {ROLES.map((r) => (
          <Card key={r.t}><CardContent className="flex flex-col items-start justify-between gap-3 p-5 md:flex-row md:items-center">
            <div>
              <div className="flex items-center gap-2 text-primary"><Briefcase className="h-4 w-4" /><span className="text-xs font-medium">{r.type}</span></div>
              <p className="mt-1 font-semibold">{r.t}</p>
              <p className="text-sm text-muted-foreground">{r.loc}</p>
            </div>
            <a href={`mailto:careers@smartdairyhub.in?subject=${encodeURIComponent("Application: " + r.t)}`} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"><Mail className="h-4 w-4" />Apply</a>
          </CardContent></Card>
        ))}
      </div>
      <p className="mt-8 text-center text-sm text-muted-foreground">Don't see a role that fits? Email <a className="text-primary hover:underline" href="mailto:careers@smartdairyhub.in">careers@smartdairyhub.in</a>.</p>
    </div>
  );
}
