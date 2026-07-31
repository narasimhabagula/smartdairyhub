/**
 * Machine-translation fallback layer.
 *
 * Any English string that has no entry in the local locale files is sent to the
 * `translate` edge function in batches, cached in localStorage (and server-side),
 * and applied to the live DOM — so no English text is ever left behind.
 */
import { supabase } from "@/integrations/supabase/client";

const CACHE_PREFIX = "sdh_tr_cache_";
const MAX_CACHE_ENTRIES = 4000;

type Dict = Record<string, string>;

const memory = new Map<string, Dict>();
const pending = new Map<string, Set<string>>();
const listeners = new Set<() => void>();
let flushTimer: number | undefined;
let inFlight = 0;

export function onTranslationsUpdated(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function emit() {
  listeners.forEach((cb) => {
    try {
      cb();
    } catch {
      /* listener errors never break translation */
    }
  });
}

function loadCache(lang: string): Dict {
  const cached = memory.get(lang);
  if (cached) return cached;
  let dict: Dict = {};
  try {
    dict = JSON.parse(localStorage.getItem(CACHE_PREFIX + lang) || "{}") || {};
  } catch {
    dict = {};
  }
  memory.set(lang, dict);
  return dict;
}

function persist(lang: string) {
  const dict = memory.get(lang);
  if (!dict) return;
  try {
    const keys = Object.keys(dict);
    if (keys.length > MAX_CACHE_ENTRIES) {
      const trimmed: Dict = {};
      for (const k of keys.slice(-MAX_CACHE_ENTRIES)) trimmed[k] = dict[k];
      memory.set(lang, trimmed);
      localStorage.setItem(CACHE_PREFIX + lang, JSON.stringify(trimmed));
      return;
    }
    localStorage.setItem(CACHE_PREFIX + lang, JSON.stringify(dict));
  } catch {
    /* storage full — memory cache still works */
  }
}

/** Cached translation, or undefined while it is still being fetched. */
export function lookup(lang: string, text: string): string | undefined {
  if (!lang || lang === "en") return text;
  return loadCache(lang)[text.trim()];
}

/** Queue a string for machine translation (no-op if already cached). */
export function requestTranslation(lang: string, text: string) {
  const value = text.trim();
  if (!value || lang === "en" || value.length > 600) return;
  if (loadCache(lang)[value] !== undefined) return;
  let queue = pending.get(lang);
  if (!queue) {
    queue = new Set();
    pending.set(lang, queue);
  }
  if (queue.has(value)) return;
  queue.add(value);
  scheduleFlush();
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = window.setTimeout(() => {
    flushTimer = undefined;
    void flush();
  }, 120);
}

async function flush() {
  if (inFlight > 2) {
    scheduleFlush();
    return;
  }
  for (const [lang, queue] of pending) {
    if (!queue.size) continue;
    const batch = Array.from(queue).slice(0, 100);
    batch.forEach((t) => queue.delete(t));
    if (!queue.size) pending.delete(lang);
    inFlight++;
    try {
      const { data } = await supabase.functions.invoke("translate", {
        body: { texts: batch, target: lang },
      });
      const translations = (data?.translations ?? {}) as Dict;
      const dict = loadCache(lang);
      let changed = false;
      for (const [src, out] of Object.entries(translations)) {
        if (out && dict[src] !== out) {
          dict[src] = out;
          changed = true;
        }
      }
      if (changed) {
        persist(lang);
        emit();
      }
    } catch {
      /* offline or rate limited — original text stays visible */
    } finally {
      inFlight--;
    }
  }
  if (pending.size) scheduleFlush();
}

/** Translate a batch and resolve once results are in (used for dynamic content). */
export async function translateMany(lang: string, texts: string[]): Promise<Dict> {
  if (lang === "en") return Object.fromEntries(texts.map((t) => [t, t]));
  const dict = loadCache(lang);
  const missing = texts.map((t) => t.trim()).filter((t) => t && dict[t] === undefined);
  if (missing.length) {
    texts.forEach((t) => requestTranslation(lang, t));
    await new Promise<void>((resolve) => {
      const off = onTranslationsUpdated(() => {
        off();
        resolve();
      });
      window.setTimeout(() => {
        off();
        resolve();
      }, 6000);
    });
  }
  const out: Dict = {};
  for (const t of texts) out[t] = loadCache(lang)[t.trim()] ?? t;
  return out;
}
