import { Card } from "@/components/ui/card";
import { Phone, MessageCircle, ClipboardList, Siren } from "lucide-react";

const HELPLINE = "1800 123 4567";
const WHATSAPP = "918001234567";

const actions = [
  {
    icon: Phone,
    title: "Call Us",
    sub: HELPLINE,
    href: `tel:${HELPLINE.replace(/\s/g, "")}`,
    tint: "bg-primary/10 text-primary",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp",
    sub: "Chat with us",
    href: `https://wa.me/${WHATSAPP}`,
    tint: "bg-success/10 text-success",
  },
  {
    icon: ClipboardList,
    title: "Checkups",
    sub: "Health checkups",
    href: "#vet-listings",
    tint: "bg-accent/10 text-accent",
  },
  {
    icon: Siren,
    title: "Emergency",
    sub: "24/7 support",
    href: `tel:${HELPLINE.replace(/\s/g, "")}`,
    tint: "bg-warning/15 text-warning-foreground",
  },
];

/** Contact & Quick Actions row — sits below the search/GPS + filter area and above vet listings. */
export default function VetQuickActions() {
  return (
    <Card className="overflow-hidden border-border/60 p-4 sm:p-5">
      <h2 className="mb-3 font-display text-base font-semibold text-primary">Contact &amp; Quick Actions</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map(({ icon: Icon, title, sub, href, tint }) => (
          <a
            key={title}
            href={href}
            target={href.startsWith("http") ? "_blank" : undefined}
            rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
            className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background p-3.5 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-soft"
          >
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tint}`}>
              <Icon className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{title}</span>
              <span className="block truncate text-xs text-muted-foreground">{sub}</span>
            </span>
          </a>
        ))}
      </div>
    </Card>
  );
}
