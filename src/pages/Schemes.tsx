import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, IndianRupee, FileText, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { isSafeHttpUrl } from "@/lib/safe-url";
import { useTranslation } from "react-i18next";

const categories = ["all", "subsidy", "loan", "insurance", "training", "other"];

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
      const { data } = await query.order("created_at", { ascending: false });
      setSchemes(data || []);
      setLoading(false);
    };
    fetchSchemes();
  }, [category, search]);

  return (
    <div className="container py-10">
      <h1 className="font-display text-3xl font-bold">{t("schemes.title")}</h1>
      <p className="mt-2 text-muted-foreground">{t("schemes.subtitle")}</p>

      <div className="mt-6 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder={t("schemes.search")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c} value={c} className="capitalize">
                {c === "all" ? t("schemes.all") : c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {loading ? (
          <p className="text-muted-foreground col-span-full">{t("schemes.loading")}</p>
        ) : schemes.length === 0 ? (
          <p className="text-muted-foreground col-span-full text-center py-12">{t("schemes.empty")}</p>
        ) : (
          schemes.map((s) => (
            <Card key={s.id} className="transition-shadow hover:shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="font-display text-lg leading-snug">{s.title}</CardTitle>
                  <Badge variant="secondary" className="shrink-0 capitalize">{s.category}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm">{s.description}</p>
                <div className="grid gap-2 rounded-lg border bg-muted/50 p-3 text-sm">
                  {s.benefits && (
                    <div className="flex items-start gap-2">
                      <IndianRupee className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                      <div><strong>{t("schemes.benefit")}:</strong> {s.benefits}</div>
                    </div>
                  )}
                  {s.eligibility && (
                    <div className="flex items-start gap-2">
                      <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                      <div><strong>{t("schemes.eligibility")}:</strong> {s.eligibility}</div>
                    </div>
                  )}
                </div>
                {isSafeHttpUrl(s.apply_url) && (
                  <Button size="lg" className="w-full gap-1.5 sm:w-auto" asChild>
                    <a href={s.apply_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" /> {t("schemes.apply")}
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
