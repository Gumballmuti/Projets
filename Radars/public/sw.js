// Service worker : garde l'app (pas la carte) disponible même sans réseau.
// Les fichiers de l'app sont servis depuis le réseau quand il répond, sinon depuis le cache.
const VERSION = "ma-route-v1";
const APP = [
  "/",
  "/index.html",
  "/app.css",
  "/manifest.json",
  "/icone-192.png",
  "/vendor/maplibre-gl.js",
  "/vendor/maplibre-gl.css",
  "/js/app.js",
  "/js/alertes.js",
  "/js/geo.js",
  "/js/limites.js",
  "/js/navigation.js",
  "/js/overpass.js",
  "/js/radars.js",
  "/js/signalements.js",
  "/js/voix.js",
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(APP)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches
      .keys()
      .then(cles => Promise.all(cles.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then(rep => {
        if (rep.ok) {
          const copie = rep.clone();
          caches.open(VERSION).then(c => c.put(e.request, copie));
        }
        return rep;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match("/index.html"))),
  );
});
