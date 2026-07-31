import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { lookup, onTranslationsUpdated, requestTranslation } from "@/lib/autoTranslate";

const SKIP_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "NOSCRIPT",
  "CODE",
  "PRE",
  "TEXTAREA",
  "SVG",
  "PATH",
  "CANVAS",
]);

const ATTRS = ["placeholder", "aria-label", "title", "alt"] as const;

// Only translate strings that actually look like English UI copy.
const HAS_LETTERS = /[A-Za-z]{2,}/;
const NON_LATIN = /[\u0900-\u0DFF\u0B00-\u0B7F]/;

const originals = new WeakMap<Node, string>();
const attrOriginals = new WeakMap<Element, Record<string, string>>();

function translatable(value: string) {
  const text = value.trim();
  if (!text || text.length > 600) return false;
  if (!HAS_LETTERS.test(text)) return false;
  if (NON_LATIN.test(text)) return false;
  return true;
}

function skip(el: Element | null): boolean {
  let node: Element | null = el;
  while (node) {
    if (SKIP_TAGS.has(node.tagName)) return true;
    if (node.hasAttribute?.("data-no-translate")) return true;
    if (node.getAttribute?.("translate") === "no") return true;
    node = node.parentElement;
  }
  return false;
}

function applyText(node: Text, lang: string) {
  const source = originals.get(node) ?? node.nodeValue ?? "";
  if (!translatable(source)) return;
  if (!originals.has(node)) originals.set(node, source);

  if (lang === "en") {
    if (node.nodeValue !== source) node.nodeValue = source;
    return;
  }
  const key = source.trim();
  const hit = lookup(lang, key);
  if (hit) {
    const next = source.replace(key, hit);
    if (node.nodeValue !== next) node.nodeValue = next;
  } else {
    requestTranslation(lang, key);
  }
}

function applyAttrs(el: Element, lang: string) {
  let store = attrOriginals.get(el);
  for (const attr of ATTRS) {
    const current = el.getAttribute(attr);
    if (current == null) continue;
    const source = store?.[attr] ?? current;
    if (!translatable(source)) continue;
    if (!store) {
      store = {};
      attrOriginals.set(el, store);
    }
    if (store[attr] === undefined) store[attr] = source;

    if (lang === "en") {
      if (current !== source) el.setAttribute(attr, source);
      continue;
    }
    const hit = lookup(lang, source.trim());
    if (hit) {
      if (current !== hit) el.setAttribute(attr, hit);
    } else {
      requestTranslation(lang, source.trim());
    }
  }
}

function walk(root: Node, lang: string) {
  if (root.nodeType === Node.TEXT_NODE) {
    const text = root as Text;
    if (!skip(text.parentElement)) applyText(text, lang);
    return;
  }
  if (root.nodeType !== Node.ELEMENT_NODE) return;
  const el = root as Element;
  if (skip(el)) return;

  applyAttrs(el, lang);
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let node = walker.nextNode();
  while (node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node as Text;
      if (!skip(text.parentElement)) applyText(text, lang);
    } else {
      const child = node as Element;
      if (SKIP_TAGS.has(child.tagName) || child.hasAttribute("data-no-translate")) {
        // Skip the whole subtree.
        let next = walker.nextSibling();
        while (!next && walker.parentNode()) next = walker.nextSibling();
        node = next;
        continue;
      }
      applyAttrs(child, lang);
    }
    node = walker.nextNode();
  }
}

/**
 * Whole-page translation safety net: any string that the locale files miss is
 * machine-translated, cached, and swapped into the DOM — so nothing stays English.
 */
export default function AutoTranslate() {
  const { i18n } = useTranslation();
  const lang = (i18n.language || "en").slice(0, 2);

  useEffect(() => {
    document.documentElement.lang = lang;

    let frame = 0;
    const run = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => walk(document.body, lang));
    };

    run();
    const offUpdates = onTranslationsUpdated(run);

    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === "characterData") {
          const text = record.target as Text;
          if (!skip(text.parentElement)) applyText(text, lang);
        } else {
          record.addedNodes.forEach((n) => walk(n, lang));
        }
      }
    });
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributeFilter: ATTRS as unknown as string[],
    });

    return () => {
      observer.disconnect();
      offUpdates();
      cancelAnimationFrame(frame);
    };
  }, [lang]);

  // Smooth fade whenever the language changes.
  useEffect(() => {
    const root = document.getElementById("root");
    if (!root) return;
    root.style.transition = "opacity 320ms ease";
    root.style.opacity = "0.35";
    const t = window.setTimeout(() => {
      root.style.opacity = "1";
    }, 320);
    return () => window.clearTimeout(t);
  }, [lang]);

  return null;
}
