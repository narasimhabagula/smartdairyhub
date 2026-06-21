import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="border-t bg-card">
      <div className="container py-8">
        <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
          <div className="flex items-center gap-2 font-display text-lg font-bold text-primary">
            <img src="/logo.png" alt="Smart Dairy Hub logo" className="h-8 w-8 rounded-md object-contain" />
            {t("brand")}
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link to="/schemes" className="hover:text-foreground">{t("nav.schemes")}</Link>
            <Link to="/vet-contacts" className="hover:text-foreground">{t("nav.vet")}</Link>
            <Link to="/cattle-market" className="hover:text-foreground">{t("nav.cattle")}</Link>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 {t("brand")}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
