import { Link } from "react-router-dom";
import { Milk } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t bg-card">
      <div className="container py-8">
        <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
          <div className="flex items-center gap-2 font-display text-lg font-bold text-primary">
            <Milk className="h-5 w-5" />
            DairyPro
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link to="/schemes" className="hover:text-foreground">Schemes</Link>
            <Link to="/vet-contacts" className="hover:text-foreground">Vet Contacts</Link>
            <Link to="/cattle-market" className="hover:text-foreground">Cattle Market</Link>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 DairyPro. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
