import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Mic, MicOff, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

type Entry = {
  label: string;
  to: string;
  keywords: string[];
};

const ENTRIES: Entry[] = [
  { label: "Milk Rates", to: "/milk-rates", keywords: ["milk", "rate", "price", "today", "fat", "snf", "పాలు", "దర", "दूध", "रेट", "कीमत"] },
  { label: "Milk Calculator", to: "/milk-calculator", keywords: ["calculator", "calc", "fat snf", "milk price calculator"] },
  { label: "Veterinary Doctors", to: "/vet-contacts", keywords: ["vet", "veterinary", "doctor", "near me", "hospital", "clinic", "డాక్టర్", "पशु", "डॉक्टर"] },
  { label: "Book a Vet", to: "/book-vet", keywords: ["book vet", "appointment", "consult", "vet appointment"] },
  { label: "Cattle Market", to: "/cattle-market", keywords: ["cattle", "cow", "buffalo", "buy", "sell", "jersey", "hen", "cock", "ఆవు", "గేదె", "गाय", "भैंस"] },
  { label: "Sell Cattle", to: "/cattle/new", keywords: ["sell cow", "sell buffalo", "list cattle", "post cattle"] },
  { label: "Marketplace", to: "/marketplace", keywords: ["marketplace", "feed", "cattle feed", "shop", "products", "price"] },
  { label: "Government Schemes", to: "/schemes", keywords: ["scheme", "subsidy", "loan", "government", "pm kisan", "nabard", "సబ్సిడీ", "योजना", "सब्सिडी"] },
  { label: "Customer Care", to: "/support", keywords: ["support", "customer care", "help", "contact", "ticket"] },
  { label: "Help Center", to: "/help", keywords: ["help", "faq", "questions"] },
  { label: "Orders", to: "/orders", keywords: ["orders", "my orders", "purchases"] },
  { label: "My Profile", to: "/profile", keywords: ["profile", "my account", "account"] },
  { label: "Notifications", to: "/notifications", keywords: ["notifications", "alerts"] },
  { label: "Dashboard", to: "/dashboard", keywords: ["dashboard", "home", "overview"] },
  { label: "My Listings", to: "/my-listings", keywords: ["my listings", "listings"] },
  { label: "My Appointments", to: "/my-appointments", keywords: ["appointments", "my appointments"] },
  { label: "Seller Dashboard", to: "/seller", keywords: ["seller", "sell", "inventory"] },
  { label: "Feedback", to: "/feedback", keywords: ["feedback", "review", "rate us"] },
];

function score(entry: Entry, q: string): number {
  const text = (entry.label + " " + entry.keywords.join(" ")).toLowerCase();
  const query = q.toLowerCase().trim();
  if (!query) return 0;
  if (text.includes(query)) return 100;
  const tokens = query.split(/\s+/).filter(Boolean);
  let s = 0;
  for (const t of tokens) {
    if (text.includes(t)) s += 10;
  }
  return s;
}

export default function SmartHeroSearch() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const langMap: Record<string, string> = { en: "en-IN", te: "te-IN", hi: "hi-IN" };
  const speechLang = langMap[i18n.language?.slice(0, 2) ?? "en"] ?? "en-IN";
  const { transcript, listening, supported, start, stop, reset, error } = useSpeechRecognition(speechLang);

  useEffect(() => {
    if (transcript) setQuery(transcript);
  }, [transcript]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const results = useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    return ENTRIES.map((e) => ({ e, s: score(e, q) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 6)
      .map((r) => r.e);
  }, [query]);

  const go = (to: string) => {
    setOpen(false);
    stop();
    reset();
    setQuery("");
    navigate(to);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (results[0]) go(results[0].to);
  };

  return (
    <div ref={wrapRef} className="relative w-full max-w-xl">
      <form
        onSubmit={onSubmit}
        className="flex items-center gap-2 rounded-full bg-white/95 px-4 py-2.5 shadow-lg shadow-black/20 ring-1 ring-black/5 backdrop-blur-md focus-within:ring-2 focus-within:ring-accent"
      >
        <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search milk rates, vets, cattle, schemes…"
          className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none sm:text-base"
          aria-label="Search Smart Dairy Hub"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              reset();
            }}
            className="rounded-full p-1 text-muted-foreground hover:bg-muted"
            aria-label="Clear"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {supported && (
          <button
            type="button"
            onClick={() => (listening ? stop() : start())}
            className={`rounded-full p-2 transition-colors ${
              listening ? "bg-destructive text-destructive-foreground animate-pulse" : "bg-accent text-accent-foreground hover:opacity-90"
            }`}
            aria-label={listening ? "Stop voice search" : "Start voice search"}
          >
            {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>
        )}
      </form>

      {open && (results.length > 0 || error) && (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-xl">
          {error && <div className="px-4 py-2 text-xs text-destructive">{error}</div>}
          {results.map((r) => (
            <button
              key={r.to}
              type="button"
              onClick={() => go(r.to)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-muted"
            >
              <span className="font-medium">{r.label}</span>
              <span className="text-xs text-muted-foreground">{r.to}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
