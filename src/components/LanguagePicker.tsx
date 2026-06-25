import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Languages } from "lucide-react";
import { LANGUAGES, LANGUAGE_CODES, type LanguageCode } from "@/locales";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY_PICKED = "sdh_language_picked";
const STORAGE_KEY_LANG = "i18nextLng";

export default function LanguagePicker() {
  const { t, i18n } = useTranslation();
  const { user, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<LanguageCode>("en");

  // Show the picker ONLY after the user signs in for the first time and has
  // not chosen a language yet. Anonymous visitors are never prompted.
  useEffect(() => {
    if (!user) return;
    const picked = localStorage.getItem(STORAGE_KEY_PICKED);
    const profileLang = (profile as any)?.language as LanguageCode | undefined;
    if (profileLang && (LANGUAGE_CODES as string[]).includes(profileLang)) {
      // Apply the saved language instantly on every login — no refresh needed.
      if (i18n.language?.slice(0, 2) !== profileLang) i18n.changeLanguage(profileLang);
      localStorage.setItem(STORAGE_KEY_PICKED, "1");
      localStorage.setItem(STORAGE_KEY_LANG, profileLang);
      return;
    }
    if (!picked) {
      const nav = (navigator.language || "en").slice(0, 2).toLowerCase() as LanguageCode;
      const initial = (LANGUAGE_CODES as string[]).includes(nav) ? nav : "en";
      setSelected(initial as LanguageCode);
      setOpen(true);
    }
  }, [user, profile, i18n]);

  const confirm = async () => {
    await i18n.changeLanguage(selected);
    localStorage.setItem(STORAGE_KEY_PICKED, "1");
    localStorage.setItem(STORAGE_KEY_LANG, selected);
    if (user) {
      // Persist to profile so the choice follows the user across devices.
      await supabase.from("profiles").update({ language: selected } as any).eq("user_id", user.id);
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-xl">
            <Languages className="h-5 w-5 text-primary" /> {t("picker.title")}
          </DialogTitle>
          <DialogDescription>{t("picker.subtitle")}</DialogDescription>
        </DialogHeader>

        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {LANGUAGES.map((lng) => {
            const active = selected === lng.code;
            return (
              <button
                key={lng.code}
                type="button"
                onClick={() => setSelected(lng.code)}
                aria-pressed={active}
                className={`flex flex-col items-start gap-0.5 rounded-lg border-2 px-3 py-3 text-left transition-colors ${
                  active
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-primary/50 hover:bg-muted"
                }`}
              >
                <span className="flex w-full items-center justify-between text-base font-semibold">
                  {lng.native}
                  {active && <Check className="h-4 w-4 text-primary" />}
                </span>
                <span className="text-xs text-muted-foreground">{lng.label}</span>
              </button>
            );
          })}
        </div>

        <Button onClick={confirm} size="lg" className="mt-4 w-full">
          {t("picker.continue")}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
