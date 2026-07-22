/**
 * Lightweight i18n: load locale JSON and apply to [data-i18n] nodes.
 */

import { storage } from "./utils.js";

const STORAGE_KEY = "nfmt-lang";
const SUPPORTED = ["en", "de", "ua", "pl"];

/** @type {Record<string, string>} */
let strings = {};
let currentLang = "en";
/** @type {Map<string, Record<string, string>>} */
const localeCache = new Map();

/**
 * @param {string} lang
 * @returns {Promise<Record<string, string>>}
 */
async function fetchLocale(lang) {
  if (localeCache.has(lang)) return localeCache.get(lang);
  const res = await fetch(`locales/${lang}.json`);
  if (!res.ok) throw new Error(`Locale not found: ${lang}`);
  const data = await res.json();
  localeCache.set(lang, data);
  return data;
}

/**
 * Initialize language from storage or browser preference.
 * @returns {Promise<string>}
 */
export async function initI18n() {
  const saved = storage.get(STORAGE_KEY, null);
  let lang = saved && SUPPORTED.includes(saved) ? saved : null;

  if (!lang) {
    const nav = (navigator.language || "en").toLowerCase();
    if (nav.startsWith("de")) lang = "de";
    else if (nav.startsWith("uk") || nav.startsWith("ua")) lang = "ua";
    else if (nav.startsWith("pl")) lang = "pl";
    else lang = "en";
  }

  await setLanguage(lang);
  return currentLang;
}

/**
 * @param {string} lang
 */
export async function setLanguage(lang) {
  if (!SUPPORTED.includes(lang)) lang = "en";
  try {
    strings = await fetchLocale(lang);
  } catch {
    if (lang !== "en") {
      try {
        strings = await fetchLocale("en");
        lang = "en";
      } catch {
        strings = {};
      }
    } else {
      strings = {};
    }
  }
  currentLang = lang;
  storage.set(STORAGE_KEY, lang);
  document.documentElement.lang = lang === "ua" ? "uk" : lang;
  applyTranslations();
}

/**
 * Apply translations to all [data-i18n] elements and placeholders.
 */
export function applyTranslations() {
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    const key = node.getAttribute("data-i18n");
    if (!key || strings[key] == null) return;

    if (node.tagName === "OPTION") {
      node.textContent = strings[key];
    } else if (node.hasAttribute("data-i18n-placeholder")) {
      node.setAttribute("placeholder", strings[key]);
    } else if (node.hasAttribute("data-i18n-title")) {
      node.setAttribute("title", strings[key]);
      node.textContent = strings[key];
    } else if (node.hasAttribute("data-i18n-aria")) {
      node.setAttribute("aria-label", strings[key]);
    } else {
      node.textContent = strings[key];
    }
  });

  document.querySelectorAll("[data-i18n-aria]").forEach((node) => {
    const key = node.getAttribute("data-i18n-aria");
    if (key && strings[key] != null) {
      node.setAttribute("aria-label", strings[key]);
    }
  });

  document.querySelectorAll("[data-i18n-title-only]").forEach((node) => {
    const key = node.getAttribute("data-i18n-title-only");
    if (key && strings[key] != null) {
      node.setAttribute("title", strings[key]);
    }
  });

  if (strings.appTitle) {
    document.title = `${strings.appTitle}`;
  }
}

/**
 * Translate a key with optional simple {var} interpolation.
 * @param {string} key
 * @param {Record<string, string|number>} [vars]
 * @returns {string}
 */
export function t(key, vars) {
  let str = strings[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }
  return str;
}

export function getLanguage() {
  return currentLang;
}

export { SUPPORTED as SUPPORTED_LANGS };
