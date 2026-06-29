import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { X } from "lucide-react";

type Banner = { id: string; title: string; message: string; variant: string; link: string | null };

const VARIANT_CLASS: Record<string, string> = {
  info: "bg-primary/10 text-primary border-primary/20",
  success: "bg-green-100 text-green-900 border-green-200 dark:bg-green-900/30 dark:text-green-100",
  warning: "bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-900/30 dark:text-amber-100",
  promo: "bg-purple-100 text-purple-900 border-purple-200 dark:bg-purple-900/30 dark:text-purple-100",
};

export default function NotificationBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem("sdh_dismissed_banners") || "[]")); } catch { return new Set(); }
  });

  useEffect(() => {
    (async () => {
      const nowIso = new Date().toISOString();
      const { data } = await supabase
        .from("notification_banners")
        .select("id,title,message,variant,link,starts_at,expires_at,active")
        .eq("active", true)
        .lte("starts_at", nowIso)
        .order("starts_at", { ascending: false });
      const valid = (data || []).filter((b: any) => !b.expires_at || new Date(b.expires_at) > new Date());
      setBanners(valid as Banner[]);
    })();
  }, []);

  const dismiss = (id: string) => {
    const next = new Set(dismissed); next.add(id); setDismissed(next);
    try { localStorage.setItem("sdh_dismissed_banners", JSON.stringify([...next])); } catch {}
  };

  const visible = banners.filter((b) => !dismissed.has(b.id));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-1">
      {visible.map((b) => {
        const inner = (
          <div className="flex-1 min-w-0">
            <span className="font-semibold">{b.title}</span>
            <span className="ml-2 opacity-90">{b.message}</span>
          </div>
        );
        return (
          <div key={b.id} className={`flex items-center gap-3 border-b px-4 py-2 text-sm ${VARIANT_CLASS[b.variant] || VARIANT_CLASS.info}`}>
            {b.link ? <Link to={b.link} className="contents hover:underline">{inner}</Link> : inner}
            <button onClick={() => dismiss(b.id)} aria-label="Dismiss" className="shrink-0 rounded p-1 hover:bg-black/10">
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
