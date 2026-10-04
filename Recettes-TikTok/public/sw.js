// Service worker minimal : rend l'app installable (écran d'accueil iPhone, Dock du Mac).
// Les données viennent toujours du serveur pour rester synchronisées entre appareils.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
