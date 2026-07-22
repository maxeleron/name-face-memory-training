/**
 * Minimal service worker: cache shell for offline UI.
 * Face images still require network (CDN).
 */

const CACHE = "nfmt-v2";
const PRECACHE = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/app.js",
  "./js/game.js",
  "./js/data.js",
  "./js/settings.js",
  "./js/utils.js",
  "./js/i18n.js",
  "./js/stats.js",
  "./js/toast.js",
  "./js/theme.js",
  "./js/announce.js",
  "./js/boot.js",
  "./locales/en.json",
  "./locales/de.json",
  "./locales/ua.json",
  "./locales/pl.json",
  "./data/names/american.json",
  "./data/names/west-eu.json",
  "./data/names/east-eu.json",
  "./manifest.webmanifest",
  "./favicon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
      .catch((err) => console.warn("Precache failed", err))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Never cache cross-origin face CDN in SW (opaque/cache bloat)
  if (url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.ok && response.type === "basic") {
            const clone = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => cached);

      // Stale-while-revalidate for same-origin
      return cached || network;
    })
  );
});
