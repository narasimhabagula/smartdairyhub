import type { JerryLangCode, JerryMessage, JerrySuggestion } from "@/types/jerry";

export function uid(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `m_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }
}

/** Simple client-side debounce used by the composer. */
export function debounce<A extends unknown[]>(fn: (...args: A) => void, wait = 250) {
  let t: number | undefined;
  return (...args: A) => {
    if (t) window.clearTimeout(t);
    t = window.setTimeout(() => fn(...args), wait);
  };
}

/** Token-bucket style rate limiter: max N sends per window. */
export function createRateLimiter(max = 12, windowMs = 60_000) {
  const hits: number[] = [];
  return {
    take(): boolean {
      const now = Date.now();
      while (hits.length && now - hits[0] > windowMs) hits.shift();
      if (hits.length >= max) return false;
      hits.push(now);
      return true;
    },
  };
}

/** Detect the language of a message from its script so Jerry replies in kind. */
export function detectLangCode(text: string): JerryLangCode {
  if (/[\u0C00-\u0C7F]/.test(text)) return "te";
  if (/[\u0B80-\u0BFF]/.test(text)) return "ta";
  if (/[\u0C80-\u0CFF]/.test(text)) return "kn";
  if (/[\u0D00-\u0D7F]/.test(text)) return "ml";
  if (/[\u0900-\u097F]/.test(text)) return "hi";
  return "en";
}

export const JERRY_HISTORY_KEY = "jerry_history_v1";
export const JERRY_LANG_KEY = "jerry_lang_v1";
export const MAX_INPUT_CHARS = 2000;
export const MAX_HISTORY = 40;

export function loadHistory(): JerryMessage[] {
  try {
    const raw = sessionStorage.getItem(JERRY_HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.slice(-MAX_HISTORY) : [];
  } catch {
    return [];
  }
}

export function saveHistory(messages: JerryMessage[]) {
  try {
    sessionStorage.setItem(JERRY_HISTORY_KEY, JSON.stringify(messages.slice(-MAX_HISTORY)));
  } catch {
    /* storage full or blocked — chat still works in memory */
  }
}

export const JERRY_SUGGESTIONS: JerrySuggestion[] = [
  { id: "milk-rates", label: "Milk Rates", prompt: "What are today's milk rates and how are they decided?" },
  { id: "disease", label: "Disease Detection", prompt: "My cow has fever and is not eating. What could it be?" },
  { id: "marketplace", label: "Marketplace", prompt: "How do I buy or sell a cow or buffalo on Smart Dairy Hub?" },
  { id: "schemes", label: "Government Schemes", prompt: "Which government dairy subsidies and loans can I apply for?" },
  { id: "feed", label: "Feed Price", prompt: "Suggest a cost-effective daily feed plan and current feed prices." },
  { id: "vet", label: "Nearby Vet", prompt: "How do I find and book a nearby veterinary doctor?" },
  { id: "weather", label: "Weather", prompt: "Give me weather-based care tips for my dairy animals this season." },
  { id: "medical", label: "Medical Store", prompt: "Where can I buy cattle medicines and mineral mixtures?" },
  { id: "fat-snf", label: "AI Help", prompt: "Calculate milk price for FAT 4.2 and SNF 8.6 and explain the formula." },
  { id: "support", label: "Customer Care", prompt: "I need help with my account. How do I contact customer support?" },
];
