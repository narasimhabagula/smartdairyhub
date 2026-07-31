// Jerry website control: turns natural-language (multilingual) commands into
// in-app navigation. Runs fully client-side so navigation is instant and free.
import type { JerryLangCode } from "@/types/jerry";

export type NavCommand = {
  path: string;
  /** Label spoken/shown back to the farmer, per language (falls back to `en`). */
  labels: Partial<Record<JerryLangCode, string>> & { en: string };
  /** Lower-cased keyword triggers across supported languages. */
  keywords: string[];
};

export const NAV_COMMANDS: NavCommand[] = [
  {
    path: "/milk-rates",
    labels: { en: "Milk Rates", te: "పాల ధరలు", hi: "दूध के रेट", ta: "பால் விலை", kn: "ಹಾಲಿನ ದರ", ml: "പാൽ വില" },
    keywords: ["milk rate", "milk rates", "milk price", "milk prices", "today rate", "పాల ధర", "పాల రేట", "दूध रेट", "दूध का रेट", "दूध की कीमत", "பால் விலை", "ಹಾಲಿನ ದರ", "പാൽ വില"],
  },
  {
    path: "/milk-calculator",
    labels: { en: "Milk Calculator", te: "పాల కాలిక్యులేటర్", hi: "दूध कैलकुलेटर" },
    keywords: ["calculator", "fat snf", "fat and snf", "calculate milk", "కాలిక్యులేటర్", "కాలిక్యులేట", "कैलकुलेटर", "गणना"],
  },
  {
    path: "/marketplace",
    labels: { en: "Marketplace", te: "మార్కెట్‌ప్లేస్", hi: "मार्केटप्लेस", ta: "சந்தை", kn: "ಮಾರುಕಟ್ಟೆ", ml: "മാർക്കറ്റ്" },
    keywords: ["marketplace", "market place", "shop", "store", "products", "buy feed", "మార్కెట్", "దుకాణం", "मार्केट", "बाज़ार", "दुकान", "சந்தை", "ಮಾರುಕಟ್ಟೆ", "മാർക്കറ്റ്"],
  },
  {
    path: "/cattle-market",
    labels: { en: "Cattle Market", te: "పశువుల మార్కెట్", hi: "पशु बाज़ार" },
    keywords: ["cattle", "cow", "buffalo", "livestock", "sell cow", "buy cow", "పశువు", "ఆవు", "గేదె", "गाय", "भैंस", "पशु", "மாடு", "ಹಸು", "പശു"],
  },
  {
    path: "/disease-detection",
    labels: { en: "AI Disease Scan", te: "వ్యాధి స్కాన్", hi: "रोग जाँच" },
    keywords: ["disease", "disease detection", "scan", "sick animal", "upload photo", "check animal", "వ్యాధి", "జబ్బు", "बीमारी", "रोग", "जाँच", "நோய்", "ರೋಗ", "രോഗം"],
  },
  {
    path: "/vet-contacts",
    labels: { en: "Veterinary Doctors", te: "పశువైద్యులు", hi: "पशु चिकित्सक" },
    keywords: ["vet", "vets", "veterinary", "doctor", "doctors", "పశువైద్య", "డాక్టర్", "पशु चिकित्सक", "डॉक्टर", "மருத்துவர்", "ವೈದ್ಯ", "ഡോക്ടർ"],
  },
  {
    path: "/book-vet",
    labels: { en: "Book a Vet", te: "పశువైద్యుని బుక్ చేయండి", hi: "वेट बुक करें" },
    keywords: ["book vet", "book a doctor", "appointment", "అపాయింట్‌మెంట్", "बुक", "अपॉइंटमेंट"],
  },
  {
    path: "/schemes",
    labels: { en: "Government Schemes", te: "ప్రభుత్వ పథకాలు", hi: "सरकारी योजनाएँ" },
    keywords: ["scheme", "schemes", "subsidy", "subsidies", "loan", "insurance", "పథక", "సబ్సిడీ", "రుణ", "योजना", "सब्सिडी", "ऋण", "लोन", "திட்டம்", "ಯೋಜನೆ", "പദ്ധതി"],
  },
  {
    path: "/dashboard",
    labels: { en: "Dashboard", te: "డాష్‌బోర్డ్", hi: "डैशबोर्ड" },
    keywords: ["dashboard", "my farm", "డాష్‌బోర్డ్", "डैशबोर्ड"],
  },
  {
    path: "/profile",
    labels: { en: "Profile", te: "ప్రొఫైల్", hi: "प्रोफ़ाइल" },
    keywords: ["profile", "my account", "ప్రొఫైల్", "प्रोफाइल", "प्रोफ़ाइल"],
  },
  {
    path: "/notifications",
    labels: { en: "Notifications", te: "నోటిఫికేషన్లు", hi: "सूचनाएँ" },
    keywords: ["notification", "notifications", "alerts", "నోటిఫికేష", "सूचना", "अलर्ट"],
  },
  {
    path: "/settings",
    labels: { en: "Settings", te: "సెట్టింగ్‌లు", hi: "सेटिंग्स" },
    keywords: ["settings", "setting", "సెట్టింగ", "सेटिंग"],
  },
  {
    path: "/orders",
    labels: { en: "My Orders", te: "నా ఆర్డర్లు", hi: "मेरे ऑर्डर" },
    keywords: ["orders", "my order", "ఆర్డర్", "ऑर्डर"],
  },
  {
    path: "/cart",
    labels: { en: "Cart", te: "కార్ట్", hi: "कार्ट" },
    keywords: ["cart", "basket", "కార్ట్", "कार्ट"],
  },
  {
    path: "/my-listings",
    labels: { en: "My Listings", te: "నా జాబితాలు", hi: "मेरी लिस्टिंग" },
    keywords: ["my listings", "my listing", "నా జాబితా", "मेरी लिस्टिंग"],
  },
  {
    path: "/help",
    labels: { en: "Help Center", te: "సహాయ కేంద్రం", hi: "सहायता केंद्र" },
    keywords: ["help", "help center", "faq", "సహాయ", "मदद", "सहायता"],
  },
  {
    path: "/support",
    labels: { en: "Customer Support", te: "కస్టమర్ సపోర్ట్", hi: "ग्राहक सहायता" },
    keywords: ["support", "raise ticket", "complaint", "సపోర్ట్", "फिर्याद", "शिकायत", "सपोर्ट"],
  },
];

/** Verbs that signal "take me there" rather than "tell me about it". */
const OPEN_VERBS = [
  "open", "go to", "goto", "show", "take me", "navigate", "visit", "launch", "start",
  "తెరవ", "చూపించు", "వెళ్ళ", "వెళ్ల",
  "खोल", "खोलो", "दिखा", "ले चलो", "पर जाओ", "चलो",
  "திற", "காட்டு",
  "ತೆರೆ", "ತೋರಿಸು",
  "തുറക്കുക", "കാണിക്കൂ",
];

const CONFIRM: Record<string, string> = {
  en: "Sure — opening {page}.",
  te: "సరే — {page} తెరుస్తున్నాను.",
  hi: "ज़रूर — {page} खोल रहा हूँ।",
  ta: "சரி — {page} திறக்கிறேன்.",
  kn: "ಸರಿ — {page} ತೆರೆಯುತ್ತಿದ್ದೇನೆ.",
  ml: "ശരി — {page} തുറക്കുന്നു.",
};

export type NavIntent = { path: string; label: string; reply: string };

/**
 * Returns a navigation intent when the farmer clearly asked to open a page.
 * Requires both an "open" verb and a page keyword so ordinary questions
 * ("what is today's milk rate?") still go to the AI.
 */
export function matchNavIntent(text: string, lang: JerryLangCode): NavIntent | null {
  const q = text.toLowerCase().trim();
  if (!q) return null;
  const hasVerb = OPEN_VERBS.some((v) => q.includes(v));
  if (!hasVerb) return null;

  let best: { cmd: NavCommand; score: number } | null = null;
  for (const cmd of NAV_COMMANDS) {
    for (const kw of cmd.keywords) {
      if (q.includes(kw) && (!best || kw.length > best.score)) {
        best = { cmd, score: kw.length };
      }
    }
  }
  if (!best) return null;

  const label = best.cmd.labels[lang] ?? best.cmd.labels.en;
  const reply = (CONFIRM[lang] ?? CONFIRM.en).replace("{page}", label);
  return { path: best.cmd.path, label, reply };
}
