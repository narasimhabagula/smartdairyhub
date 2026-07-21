import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, IndianRupee, FileText, Search, CalendarClock, Share2, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { isSafeHttpUrl } from "@/lib/safe-url";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import MobilePageHero from "@/components/MobilePageHero";
import heroSchemes from "@/assets/banner-schemes.jpg";

const categories = ["all", "subsidy", "loan", "insurance", "training", "other"];

const categoryColor: Record<string, string> = {
  subsidy: "bg-emerald-100 text-emerald-800 border-emerald-200",
  loan: "bg-amber-100 text-amber-800 border-amber-200",
  insurance: "bg-sky-100 text-sky-800 border-sky-200",
  training: "bg-violet-100 text-violet-800 border-violet-200",
  other: "bg-slate-100 text-slate-800 border-slate-200",
};

function shareScheme(s: any) {
  const url = isSafeHttpUrl(s.apply_url) ? s.apply_url : window.location.href;
  const text = `${s.title} — ${s.description?.slice(0, 120) ?? ""}`;
  if (navigator.share) {
    navigator.share({ title: s.title, text, url }).catch(() => {});
  } else {
    navigator.clipboard?.writeText(`${s.title}\n${url}`).then(
      () => toast.success("Link copied"),
      () => toast.error("Could not copy link"),
    );
  }
}

export default function Schemes() {
  const { t } = useTranslation();
  const [schemes, setSchemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchSchemes = async () => {
      setLoading(true);
      let query = supabase.from("schemes").select("*").eq("active", true);
      if (category !== "all") query = query.eq("category", category);
      if (search) query = query.ilike("title", `%${search}%`);
      const { data } = await query.order("updated_at", { ascending: false });
      setSchemes(data || []);
      setLoading(false);
    };
    fetchSchemes();
  }, [category, search]);

  return (
    <>
      <MobilePageHero image={heroSchemes} eyebrow="Government" title="Schemes & Subsidies" subtitle="Loans, insurance and grants for dairy farmers" />
    <div className="container py-10">
      <div className="mx-auto hidden max-w-3xl text-center md:block">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">{t("schemes.title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("schemes.subtitle")}</p>
      </div>

      <div className="mx-auto mt-8 flex max-w-3xl flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("schemes.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            aria-label={t("schemes.search")}
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[180px]" aria-label="Category"><SelectValue /></SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c} value={c} className="capitalize">
                {c === "all" ? t("schemes.all") : c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!loading && schemes.length > 0 && (
        <p className="mx-auto mt-4 max-w-3xl text-sm text-muted-foreground">
          {schemes.length} scheme{schemes.length === 1 ? "" : "s"}
        </p>
      )}

      <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <div className="col-span-full flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : schemes.length === 0 ? (
          <p className="col-span-full py-12 text-center text-muted-foreground">{t("schemes.empty")}</p>
        ) : (
          schemes.map((s) => {
            const safeUrl = isSafeHttpUrl(s.apply_url) ? s.apply_url : null;
            const chip = categoryColor[s.category] || categoryColor.other;
            const updated = s.updated_at ? new Date(s.updated_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : null;
            return (
              <Card key={s.id} className="group flex flex-col overflow-hidden border-border/60 transition-all hover:-translate-y-0.5 hover:shadow-xl">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="font-display text-lg leading-snug">{s.title}</CardTitle>
                    <Badge variant="outline" className={`shrink-0 capitalize ${chip}`}>{s.category}</Badge>
                  </div>
                  {updated && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <CalendarClock className="h-3 w-3" /> Updated {updated}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-3">
                  {s.description && <p className="text-sm text-foreground/80">{s.description}</p>}
                  <div className="space-y-2 rounded-lg border bg-muted/40 p-3 text-sm">
                    {s.benefits && (
                      <div className="flex items-start gap-2">
                        <IndianRupee className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                        <p><span className="font-semibold">{t("schemes.benefit")}:</span> {s.benefits}</p>
                      </div>
                    )}
                    {s.eligibility && (
                      <div className="flex items-start gap-2">
                        <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                        <p><span className="font-semibold">{t("schemes.eligibility")}:</span> {s.eligibility}</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-auto flex flex-wrap gap-2 pt-2">
                    {safeUrl ? (
                      <Button size="sm" className="flex-1 gap-1.5" asChild>
                        <a href={safeUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" /> {t("schemes.apply")}
                        </a>
                      </Button>
                    ) : (
                      <Button size="sm" disabled className="flex-1">No link</Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => shareScheme(s)} aria-label="Share scheme">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
    </>
  );
}
