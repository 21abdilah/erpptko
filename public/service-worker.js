const CACHE_NAME = "erp-cache-v1";
const urlsToCache = [
  "/",
  "/favicon.ico",
  "/manifest.json",
  "/_nuxt/app.js",
  "/_nuxt/app.css"
];

// Install
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

// Activate
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Fetch
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});
