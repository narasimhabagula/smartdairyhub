import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Landmark, IndianRupee, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

const schemes = [
  {
    title: "Rashtriya Gokul Mission",
    ministry: "Ministry of Fisheries, Animal Husbandry & Dairying",
    desc: "Development and conservation of indigenous bovine breeds to increase milk productivity.",
    benefit: "Up to ₹5 Lakh subsidy for breeding centres",
    eligibility: "Registered dairy farmers and cooperatives",
    category: "Subsidy",
  },
  {
    title: "National Dairy Plan (NDP-II)",
    ministry: "NDDB / Dept. of Animal Husbandry",
    desc: "Aims to increase milk productivity through scientific breeding and nutrition programs.",
    benefit: "Technical and financial support for dairy development",
    eligibility: "Dairy cooperatives and producer companies",
    category: "Development",
  },
  {
    title: "Dairy Entrepreneurship Development Scheme",
    ministry: "NABARD",
    desc: "Provides financial assistance for setting up modern dairy farms with 2 to 10 animals.",
    benefit: "25-33% subsidy (up to ₹7 Lakh) on project cost",
    eligibility: "Individuals, SHGs, NGOs, companies",
    category: "Loan + Subsidy",
  },
  {
    title: "Kisan Credit Card (KCC) for Animal Husbandry",
    ministry: "Ministry of Finance / NABARD",
    desc: "Working capital loan for dairy farmers at subsidized interest rates for animal upkeep.",
    benefit: "Up to ₹3 Lakh at 4% interest (with subvention)",
    eligibility: "Farmers owning cattle or involved in dairying",
    category: "Loan",
  },
  {
    title: "Animal Husbandry Infrastructure Development Fund",
    ministry: "Dept. of Animal Husbandry",
    desc: "Incentivizes private investment in dairy processing, value addition, and cattle feed infrastructure.",
    benefit: "3% interest subvention on loans up to ₹10 Cr",
    eligibility: "MSMEs, private companies, Section 8 companies",
    category: "Infrastructure",
  },
  {
    title: "PM Matsya Sampada & Dairy Support",
    ministry: "Dept. of Animal Husbandry & Dairying",
    desc: "Provides integrated support for dairy farmers including insurance, nutrition, and market access.",
    benefit: "Insurance coverage + subsidized feed",
    eligibility: "Small and marginal dairy farmers",
    category: "Support",
  },
];

export default function Schemes() {
  return (
    <div className="container py-10">
      <h1 className="font-display text-3xl font-bold">Government Schemes</h1>
      <p className="mt-2 text-muted-foreground">
        Subsidies, loans, and programs available for dairy farmers in India.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {schemes.map((s) => (
          <Card key={s.title} className="transition-shadow hover:shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="font-display text-lg leading-snug">{s.title}</CardTitle>
                <Badge variant="secondary" className="shrink-0">{s.category}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{s.ministry}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm">{s.desc}</p>
              <div className="grid gap-2 rounded-lg border bg-muted/50 p-3 text-sm">
                <div className="flex items-start gap-2">
                  <IndianRupee className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  <div><strong>Benefit:</strong> {s.benefit}</div>
                </div>
                <div className="flex items-start gap-2">
                  <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  <div><strong>Eligibility:</strong> {s.eligibility}</div>
                </div>
              </div>
              <Button variant="outline" size="sm" className="gap-1.5">
                <ExternalLink className="h-3.5 w-3.5" />
                Learn More
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
