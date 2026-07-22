/**
 * Theme: light / dark with system preference fallback.
 */

import { storage } from "./utils.js";

const THEME_KEY = "nfmt-theme";

/** @typedef {'light'|'dark'} Theme */

/**
 * @returns {Theme}
 */
export function getPreferredTheme() {
  const saved = storage.get(THEME_KEY, null);
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

/**
 * @returns {Theme}
 */
export function getTheme() {
  const attr = document.documentElement.getAttribute("data-theme");
  return attr === "light" ? "light" : "dark";
}

/**
 * @param {Theme} theme
 */
export function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", theme === "light" ? "#f4f6fa" : "#0c1017");
  }
}

/**
 * Initialize theme from storage / system preference.
 * @returns {Theme}
 */
export function initTheme() {
  const theme = getPreferredTheme();
  applyTheme(theme);
  return theme;
}

/**
 * Toggle between light and dark; persists choice.
 * @returns {Theme}
 */
export function toggleTheme() {
  const next = getTheme() === "light" ? "dark" : "light";
  applyTheme(next);
  storage.set(THEME_KEY, next);
  return next;
}

/**
 * Watch system preference only when user has not set an explicit theme.
 * @param {(theme: Theme) => void} [onChange]
 * @returns {() => void} unsubscribe
 */
export function watchSystemTheme(onChange) {
  const mq = window.matchMedia("(prefers-color-scheme: light)");
  const handler = () => {
    const saved = storage.get(THEME_KEY, null);
    if (saved === "light" || saved === "dark") return;
    const theme = mq.matches ? "light" : "dark";
    applyTheme(theme);
    onChange?.(theme);
  };
  mq.addEventListener("change", handler);
  return () => mq.removeEventListener("change", handler);
}
