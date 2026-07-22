/**
 * Lightweight toast notifications (no deps).
 */

import { el } from "./utils.js";

const CONTAINER_ID = "toastContainer";
const DEFAULT_MS = 3800;

/**
 * Ensure the toast host exists.
 * @returns {HTMLElement}
 */
function getContainer() {
  let root = document.getElementById(CONTAINER_ID);
  if (!root) {
    root = el("div", {
      className: "toast-container",
      attrs: { id: CONTAINER_ID, role: "status", "aria-live": "polite", "aria-relevant": "additions" },
    });
    document.body.appendChild(root);
  }
  return root;
}

/**
 * @param {string} message
 * @param {'info'|'success'|'error'|'warning'} [type='info']
 * @param {number} [durationMs]
 */
export function showToast(message, type = "info", durationMs = DEFAULT_MS) {
  if (!message) return;

  const root = getContainer();
  const toast = el("div", {
    className: `toast toast--${type}`,
    attrs: { role: type === "error" ? "alert" : "status" },
  });

  const text = el("p", { className: "toast__text", text: message });
  const close = el("button", {
    className: "toast__close",
    attrs: { type: "button", "aria-label": "Dismiss" },
    text: "×",
  });

  toast.appendChild(text);
  toast.appendChild(close);
  root.appendChild(toast);

  // Enter animation
  requestAnimationFrame(() => toast.classList.add("toast--in"));

  const dismiss = () => {
    toast.classList.remove("toast--in");
    toast.classList.add("toast--out");
    window.setTimeout(() => toast.remove(), 220);
  };

  close.addEventListener("click", dismiss);
  const timer = window.setTimeout(dismiss, durationMs);
  toast.addEventListener("mouseenter", () => clearTimeout(timer), { once: true });
}

export const toast = {
  info: (msg, ms) => showToast(msg, "info", ms),
  success: (msg, ms) => showToast(msg, "success", ms),
  error: (msg, ms) => showToast(msg, "error", ms),
  warning: (msg, ms) => showToast(msg, "warning", ms),
};
