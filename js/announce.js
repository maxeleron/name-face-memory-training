/**
 * Screen-reader live announcements.
 */

const REGION_ID = "ariaLiveRegion";

/**
 * @returns {HTMLElement}
 */
function getRegion() {
  let el = document.getElementById(REGION_ID);
  if (!el) {
    el = document.createElement("div");
    el.id = REGION_ID;
    el.className = "sr-only";
    el.setAttribute("aria-live", "polite");
    el.setAttribute("aria-atomic", "true");
    document.body.appendChild(el);
  }
  return el;
}

/**
 * Announce a message to assistive technology.
 * @param {string} message
 * @param {'polite'|'assertive'} [priority='polite']
 */
export function announce(message, priority = "polite") {
  if (!message) return;
  const region = getRegion();
  region.setAttribute("aria-live", priority);
  // Clear then set so repeated messages are re-announced
  region.textContent = "";
  requestAnimationFrame(() => {
    region.textContent = message;
  });
}
