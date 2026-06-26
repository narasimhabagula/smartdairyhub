import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Search, Mic, MicOff, X, LifeBuoy, MessageCircle, Mail, Phone, AlertCircle, Clock, Trash2, TrendingUp, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

const FAQS: { q: string; a: string; tags: string[] }[] = [
  { q: "How do I create an account?", a: "Tap Login, choose your role (Farmer or Industry), then sign up with email & password or Google. Phone OTP is also supported.", tags: ["account", "signup", "register"] },
  { q: "How do I buy cattle?", a: "Open Cattle Market, filter by animal type, breed and location, open a listing and use Call or WhatsApp to contact the seller.", tags: ["cattle", "buy"] },
  { q: "How do I sell cattle?", a: "Go to Cattle Market → Sell. Pick the animal (Cow, Buffalo, Hen, Cock), fill the dynamic form with photos and price, and publish.", tags: ["cattle", "sell", "listing"] },
  { q: "How do I buy cattle feed?", a: "Open the Marketplace, browse Cattle Feed, view details and contact the seller or place an order.", tags: ["feed", "marketplace", "buy"] },
  { q: "How do I sell cattle feed?", a: "Open Seller Dashboard → Add Product, add up to 3 photos, pricing and seller details. Listings go live after admin approval.", tags: ["feed", "sell", "seller"] },
  { q: "How do I update milk rates? (Industry only)", a: "After your Industry account is verified by admin, open Industry Panel → Milk Rates to publish morning/evening rates for cow and buffalo milk.", tags: ["milk", "rates", "industry"] },
  { q: "How do I contact a veterinarian?", a: "Open Vet Contacts, allow location, choose an animal type and search nearby. Use Call, WhatsApp or Directions on any doctor card.", tags: ["vet", "doctor"] },
  { q: "How do I reset my password?", a: "On the Login screen, tap Forgot password and follow the email link to set a new password.", tags: ["password", "reset"] },
  { q: "How do I verify my account?", a: "Industry accounts: submit GST and business details from Industry Panel — admin reviews and approves. Email accounts are verified via the confirmation email.", tags: ["verify", "industry"] },
  { q: "How do I report a fake listing?", a: "Open the listing, scroll to the bottom and use Report — or raise a ticket from Customer Support → Report Fake Listings.", tags: ["report", "fraud", "fake"] },
];

const LANG_TO_SR_LOCALE: Record<string, string> = {
  en: "en-IN",
  te: "te-IN",
  hi: "hi-IN",
  ta: "ta-IN",
  kn: "kn-IN",
  ml: "ml-IN",
  mr: "mr-IN",
  bn: "bn-IN",
  pa: "pa-IN",
};

const RECENT_KEY = "sdh-help-searches";
const MAX_RECENT = 10;

function getSpeechLocale(i18nLang: string) {
  const base = i18nLang?.slice(0, 2).toLowerCase() || "en";
  return LANG_TO_SR_LOCALE[base] || "en-IN";
}

function loadRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistRecent(list: string[]) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, MAX_RECENT)));
  } catch {
    // ignore storage errors (e.g. private mode)
  }
}

export default function HelpCenter() {
  const { i18n } = useTranslation();
  const [typedQuery, setTypedQuery] = useState("");
  const [recent, setRecent] = useState<string[]>(loadRecent);
  const {
    transcript,
    interimTranscript,
    listening,
    supported,
    error,
    start,
    stop,
    reset,
  } = useSpeechRecognition(getSpeechLocale(i18n.language));

  const addRecent = useCallback((term: string) => {
    const trimmed = term.trim();
    if (trimmed.length < 2) return;
    setRecent((prev) => {
      const next = [trimmed, ...prev.filter((s) => s.toLowerCase() !== trimmed.toLowerCase())].slice(0, MAX_RECENT);
      persistRecent(next);
      return next;
    });
  }, []);

  // Append dictated transcript to the typed query.
  useEffect(() => {
    if (transcript) {
      setTypedQuery((prev) => {
        const separator = prev && !prev.endsWith(" ") ? " " : "";
        return prev + separator + transcript;
      });
    }
  }, [transcript]);

  // Auto-save recent searches and log a search event after the user pauses.
  useEffect(() => {
    const trimmed = typedQuery.trim();
    if (!trimmed || listening) return;
    const timer = setTimeout(() => {
      addRecent(trimmed);
      void supabase
        .from("help_search_events")
        .insert({ event_type: "search", term: trimmed.slice(0, 120) });
    }, 1500);
    return () => clearTimeout(timer);
  }, [typedQuery, listening, addRecent]);

  // Surface permission/network errors as a toast (once per error)
  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  // Analytics: top searches and top FAQs (last 30 days)
  const [topSearches, setTopSearches] = useState<{ term: string; hits: number }[]>([]);
  const [topFaqs, setTopFaqs] = useState<{ faq_index: number; hits: number }[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  const loadStats = useCallback(async () => {
    setLoadingStats(true);
    const [s, f] = await Promise.all([
      supabase.rpc("get_top_help_searches", { _limit: 8 }),
      supabase.rpc("get_top_help_faqs", { _limit: 5 }),
    ]);
    if (!s.error && Array.isArray(s.data)) setTopSearches(s.data as any);
    if (!f.error && Array.isArray(f.data)) setTopFaqs(f.data as any);
    setLoadingStats(false);
  }, []);

  useEffect(() => {
    void loadStats();
    const id = setInterval(() => void loadStats(), 60_000);
    return () => clearInterval(id);
  }, [loadStats]);

  function logFaqOpen(index: number) {
    void supabase
      .from("help_search_events")
      .insert({ event_type: "faq_open", faq_index: index });
  }


  const query = typedQuery + interimTranscript;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FAQS;
    return FAQS.filter(
      (f) => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q) || f.tags.some((t) => t.includes(q))
    );
  }, [query]);

  function clearQuery() {
    setTypedQuery("");
    reset();
  }

  function runRecent(term: string) {
    stop();
    setTypedQuery(term);
    reset();
    addRecent(term);
  }

  function clearRecent() {
    setRecent([]);
    persistRecent([]);
  }

  function toggleVoice() {
    if (!supported) {
      toast.error("Voice search isn't supported in this browser. Try Chrome or Edge on Android/Windows.");
      return;
    }
    if (listening) {
      stop();
    } else {
      start();
      toast.info("Listening… speak your question now");
    }
  }

  const displayValue = typedQuery + interimTranscript;
  const placeholder = listening ? "Listening… speak your question" : "Search help articles…";

  return (
    <div className="container py-8">
      <div className="mx-auto max-w-3xl text-center">
        <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <LifeBuoy className="h-6 w-6" />
        </div>
        <h1 className="font-display text-3xl font-bold md:text-4xl">Help Center</h1>
        <p className="mt-2 text-muted-foreground">Find quick answers to common questions about Smart Dairy Hub.</p>

        <div className="mt-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={displayValue}
                onChange={(e) => {
                  setTypedQuery(e.target.value);
                  if (!e.target.value) reset();
                }}
                placeholder={placeholder}
                className={cn("pl-10 pr-24 h-12 transition-shadow", listening && "ring-2 ring-primary/50")}
                aria-label="Search help articles"
              />
              <div className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center gap-1">
                {displayValue && (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={clearQuery}
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  type="button"
                  size="icon"
                  variant={listening ? "default" : "ghost"}
                  className={cn("h-8 w-8", listening && "animate-pulse")}
                  onClick={toggleVoice}
                  aria-label={listening ? "Stop voice search" : "Start voice search"}
                  title={supported ? "Tap to speak" : "Voice search not supported in this browser"}
                >
                  {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          {listening && (
            <div className="mt-2 flex items-center justify-center gap-2 text-sm text-primary">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              Listening in {LANG_TO_SR_LOCALE[i18n.language?.slice(0, 2).toLowerCase() || "en"] || "English"} — tap the mic again to stop
            </div>
          )}

          {!supported && !listening && (
            <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <AlertCircle className="h-3 w-3" />
              Voice search works best in Chrome or Edge.
            </p>
          )}
        </div>
      </div>

      {recent.length > 0 && (
        <div className="mx-auto mt-4 max-w-3xl">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Recent searches</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearRecent}
              className="h-7 text-xs text-muted-foreground hover:text-destructive"
              aria-label="Clear recent searches"
            >
              <Trash2 className="mr-1 h-3 w-3" /> Clear all
            </Button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {recent.map((term, idx) => (
              <Button
                key={idx}
                type="button"
                variant="secondary"
                size="sm"
                className="h-8 text-xs"
                onClick={() => runRecent(term)}
                title="Re-run this search"
              >
                <Clock className="mr-1.5 h-3 w-3 text-muted-foreground" /> {term}
              </Button>
            ))}
          </div>
        </div>
      )}

      <Card id="faqs" className="mx-auto mt-8 max-w-3xl">
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No articles matched your search.</p>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {filtered.map((f, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>

      <div className="mx-auto mt-8 grid max-w-3xl gap-4 md:grid-cols-3">
        <Link to="/support"><Card className="h-full transition hover:border-primary"><CardContent className="flex items-center gap-3 p-4"><MessageCircle className="h-5 w-5 text-primary" /><div><p className="font-semibold">Live Support</p><p className="text-xs text-muted-foreground">Chat with our team</p></div></CardContent></Card></Link>
        <a href="mailto:support@smartdairyhub.in"><Card className="h-full transition hover:border-primary"><CardContent className="flex items-center gap-3 p-4"><Mail className="h-5 w-5 text-primary" /><div><p className="font-semibold">Email us</p><p className="text-xs text-muted-foreground">support@smartdairyhub.in</p></div></CardContent></Card></a>
        <a href="tel:18001801551"><Card className="h-full transition hover:border-primary"><CardContent className="flex items-center gap-3 p-4"><Phone className="h-5 w-5 text-primary" /><div><p className="font-semibold">Call Helpline</p><p className="text-xs text-muted-foreground">1800-180-1551</p></div></CardContent></Card></a>
      </div>
    </div>
  );
}
