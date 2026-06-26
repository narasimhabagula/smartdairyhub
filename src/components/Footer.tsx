import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Facebook, Twitter, Instagram, Youtube, Linkedin } from "lucide-react";

const linkCls = "text-sm text-muted-foreground hover:text-primary transition-colors";
const INSTAGRAM_URL = "https://www.instagram.com/smart_dairy_hub";

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="mt-12 border-t bg-card">
      <div className="container py-10">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 font-display text-lg font-bold text-primary">
              <img src="/logo.png" alt="Smart Dairy Hub logo" className="h-12 w-12 object-contain" />
              {t("brand")}
            </div>
            <p className="mt-3 max-w-sm text-sm text-muted-foreground">
              Empowering farmers, industries and veterinarians with a trusted dairy ecosystem — marketplace, milk rates, vet care and more.
            </p>
            <div className="mt-4 flex gap-3 text-muted-foreground">
              <a href="https://facebook.com" aria-label="Facebook" target="_blank" rel="noopener noreferrer" className="hover:text-primary"><Facebook className="h-5 w-5" /></a>
              <a href="https://twitter.com" aria-label="Twitter" target="_blank" rel="noopener noreferrer" className="hover:text-primary"><Twitter className="h-5 w-5" /></a>
              <a
                href={INSTAGRAM_URL}
                aria-label="Instagram"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full p-1 text-foreground/70 transition-all hover:scale-110 hover:text-white"
                style={{ background: "transparent" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "";
                }}
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a href="https://youtube.com" aria-label="YouTube" target="_blank" rel="noopener noreferrer" className="hover:text-primary"><Youtube className="h-5 w-5" /></a>
              <a href="https://linkedin.com" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer" className="hover:text-primary"><Linkedin className="h-5 w-5" /></a>
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold">Company</h4>
            <ul className="space-y-2">
              <li><Link to="/about" className={linkCls}>About Us</Link></li>
              <li><Link to="/contact" className={linkCls}>Contact Us</Link></li>
              <li><Link to="/careers" className={linkCls}>Careers</Link></li>
              <li><Link to="/feedback" className={linkCls}>Feedback</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold">Support</h4>
            <ul className="space-y-2">
              <li><Link to="/help" className={linkCls}>Help Center</Link></li>
              <li><Link to="/support" className={linkCls}>Customer Support</Link></li>
              <li><Link to="/support?tab=report" className={linkCls}>Report a Problem</Link></li>
              <li><Link to="/help#faqs" className={linkCls}>FAQs</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold">Legal</h4>
            <ul className="space-y-2">
              <li><Link to="/privacy" className={linkCls}>Privacy Policy</Link></li>
              <li><Link to="/terms" className={linkCls}>Terms &amp; Conditions</Link></li>
              <li><Link to="/refund" className={linkCls}>Refund Policy</Link></li>
              <li><Link to="/schemes" className={linkCls}>Government Schemes</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t pt-6 text-sm text-muted-foreground md:flex-row">
          <p>© {new Date().getFullYear()} {t("brand")}. All rights reserved.</p>
          <p>Made with care for India's dairy farmers 🐄</p>
        </div>
      </div>
    </footer>
  );
}
