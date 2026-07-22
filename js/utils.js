/**
 * Shared utility helpers
 */

/**
 * Clamp a number between min and max.
 * @param {number} n
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

/**
 * Fisher–Yates shuffle (returns a new array).
 * @template T
 * @param {T[]} array
 * @returns {T[]}
 */
export function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Pick n unique random items from an array.
 * @template T
 * @param {T[]} array
 * @param {number} n
 * @returns {T[]}
 */
export function sample(array, n) {
  if (n <= 0) return [];
  if (n >= array.length) return shuffle(array);
  return shuffle(array).slice(0, n);
}

/**
 * Normalize a name for comparison (trim, lowercase, collapse spaces, strip diacritics).
 * @param {string} name
 * @returns {string}
 */
export function normalizeName(name) {
  return String(name ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

/**
 * Compare two names for equality (case/diacritic insensitive).
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
export function namesMatch(a, b) {
  const na = normalizeName(a);
  return na !== "" && na === normalizeName(b);
}

/**
 * Format seconds as M:SS.
 * @param {number} totalSeconds
 * @returns {string}
 */
export function formatTime(totalSeconds) {
  const s = Math.max(0, Math.ceil(totalSeconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

/**
 * Format a duration in ms as a short human string (e.g. "1m 12s").
 * @param {number} ms
 * @returns {string}
 */
export function formatDuration(ms) {
  const totalSec = Math.max(0, Math.round(ms / 1000));
  if (totalSec < 60) return `${totalSec}s`;
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  if (m < 60) return s ? `${m}m ${s}s` : `${m}m`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return rm ? `${h}h ${rm}m` : `${h}h`;
}

/**
 * Debounce a function.
 * @template {(...args: any[]) => any} F
 * @param {F} fn
 * @param {number} [ms=150]
 * @returns {(...args: Parameters<F>) => void}
 */
export function debounce(fn, ms = 150) {
  /** @type {ReturnType<typeof setTimeout>|undefined} */
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

/**
 * Safe localStorage get/set with JSON.
 */
export const storage = {
  /**
   * @param {string} key
   * @param {unknown} [fallback=null]
   */
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      if (raw == null) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  /**
   * @param {string} key
   * @param {unknown} value
   * @returns {boolean} whether write succeeded
   */
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },
  /**
   * @param {string} key
   */
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};

/**
 * Escape HTML special characters.
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Create a DOM element with optional attrs, classes, and children.
 * @param {string} tag
 * @param {object} [opts]
 * @returns {HTMLElement}
 */
export function el(tag, opts = {}) {
  const node = document.createElement(tag);
  if (opts.className) node.className = opts.className;
  if (opts.attrs) {
    for (const [k, v] of Object.entries(opts.attrs)) {
      if (v === false || v == null) continue;
      if (v === true) node.setAttribute(k, "");
      else node.setAttribute(k, String(v));
    }
  }
  if (opts.text != null) node.textContent = opts.text;
  if (opts.html != null) node.innerHTML = opts.html;
  if (opts.children) {
    for (const child of opts.children) {
      if (child) node.appendChild(child);
    }
  }
  return node;
}

/**
 * Show/hide an element (uses hidden attribute).
 * @param {HTMLElement|null} element
 * @param {boolean} visible
 */
export function setVisible(element, visible) {
  if (!element) return;
  element.hidden = !visible;
}

/**
 * SVG data-URL avatar placeholder (initials or gender glyph).
 * @param {string} label
 * @param {'male'|'female'|string} [gender]
 * @returns {string}
 */
export function placeholderAvatar(label = "?", gender = "") {
  const initial = escapeHtml(
    String(label).trim().charAt(0).toUpperCase() || "?"
  );
  const bg = gender === "female" ? "#7c3aed" : gender === "male" ? "#2563eb" : "#475569";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
    <rect fill="${bg}" width="200" height="200"/>
    <circle cx="100" cy="78" r="36" fill="rgba(255,255,255,0.25)"/>
    <ellipse cx="100" cy="168" rx="58" ry="48" fill="rgba(255,255,255,0.25)"/>
    <text x="100" y="92" text-anchor="middle" fill="#fff" font-family="system-ui,sans-serif" font-size="42" font-weight="700">${initial}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * Attach onerror fallback once for an img element.
 * @param {HTMLImageElement} img
 * @param {string} fallbackUrl
 */
export function withImageFallback(img, fallbackUrl) {
  img.addEventListener(
    "error",
    () => {
      if (img.src !== fallbackUrl) img.src = fallbackUrl;
    },
    { once: true }
  );
}

/**
 * Download a string as a file in the browser.
 * @param {string} filename
 * @param {string} content
 * @param {string} [mime='application/json']
 */
export function downloadText(filename, content, mime = "application/json") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * @param {unknown} err
 * @returns {boolean}
 */
export function isAbortError(err) {
  return (
    (err instanceof DOMException && err.name === "AbortError") ||
    (err instanceof Error && err.name === "AbortError")
  );
}
