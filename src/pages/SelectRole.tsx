import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Sprout, Handshake, Factory, Stethoscope, ArrowRight } from "lucide-react";

const ROLES = [
  {
    id: "farmer",
    title: "Farmer",
    desc: "Manage milk records, compare daily rates, list cattle, and access vet & schemes.",
    Icon: Sprout,
    accent: "from-emerald-500/15 to-emerald-500/0 border-emerald-500/30",
    iconBg: "bg-emerald-500/15 text-emerald-700",
  },
  {
    id: "mediator",
    title: "Mediator / Trader",
    desc: "Connect farmers and dairy industries, trade livestock, view all milk rates.",
    Icon: Handshake,
    accent: "from-amber-500/15 to-amber-500/0 border-amber-500/30",
    iconBg: "bg-amber-500/15 text-amber-700",
  },
  {
    id: "industry",
    title: "Dairy Industry / Collection Center",
    desc: "Publish your daily procurement rates, manage your company profile and centers.",
    Icon: Factory,
    accent: "from-sky-500/15 to-sky-500/0 border-sky-500/30",
    iconBg: "bg-sky-500/15 text-sky-700",
  },
  {
    id: "vet",
    title: "Veterinary Doctor",
    desc: "Get verified, accept consultation requests, manage appointments and emergency calls.",
    Icon: Stethoscope,
    accent: "from-rose-500/15 to-rose-500/0 border-rose-500/30",
    iconBg: "bg-rose-500/15 text-rose-700",
  },
] as const;

export default function SelectRole() {
  const navigate = useNavigate();

  const choose = (role: string) => {
    localStorage.setItem("sdh_chosen_role", role);
    navigate(`/login?role=${role}`);
  };

  return (
    <div className="container py-12">
      <div className="mx-auto max-w-4xl text-center">
        <img src="/logo.png" alt="Smart Dairy Hub" className="mx-auto mb-4 h-16 w-16 rounded-xl object-contain" />
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Select your role to continue</h1>
        <p className="mt-3 text-muted-foreground">Smart Dairy Hub adapts the experience to who you are. You can change this later from your profile.</p>
      </div>

      <div className="mx-auto mt-10 grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {ROLES.map(({ id, title, desc, Icon, accent, iconBg }) => (
          <button
            key={id}
            onClick={() => choose(id)}
            className="text-left transition-transform focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-xl hover:-translate-y-0.5"
          >
            <Card className={`group relative h-full overflow-hidden border bg-gradient-to-br ${accent} p-6`}>
              <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg ${iconBg}`}>
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="font-display text-xl font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
              <div className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-primary">
                Continue <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Card>
          </button>
        ))}
      </div>

      <p className="mx-auto mt-8 max-w-2xl text-center text-xs text-muted-foreground">
        More roles coming soon: Veterinary Doctor, Feed Supplier, Medicine Supplier, Government Officer, Dairy Cooperative.
      </p>
    </div>
  );
}
