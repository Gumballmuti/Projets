/*
 * Service worker de Sport Mental (sans dépendance).
 *
 * - Installation : télécharge /precache.json (liste de toutes les pages, générée au build),
 *   met en cache chaque page et les fichiers /_next/static qu'elle référence.
 * - Pages : réseau d'abord (contenu à jour), cache en secours → l'app marche hors ligne.
 * - /_next/static : cache d'abord (fichiers immuables, nommés par empreinte).
 * - Mise à jour : à chaque ouverture, la page envoie « sync » ; si la version du build
 *   a changé, le cache est reconstruit en arrière-plan.
 */
const CACHE = "sport-mental-v1";
const META = "/__sw-version";
const STATIC_RE = /\/_next\/static\/[^"'\s)\\]+/g;

/** Exécute `fn` sur chaque élément, `limit` à la fois (évite de saturer le réseau). */
async function pool(items, limit, fn) {
  const queue = [...items];
  const workers = Array.from({ length: Math.min(limit, queue.length) }, async () => {
    while (queue.length) await fn(queue.shift());
  });
  await Promise.all(workers);
}

async function precache() {
  const res = await fetch("/precache.json", { cache: "no-store" });
  if (!res.ok) throw new Error("precache.json indisponible");
  const { version, urls } = await res.json();
  const cache = await caches.open(CACHE);
  const assets = new Set();
  await pool(urls, 4, async (url) => {
    try {
      const r = await fetch(url, { cache: "no-store" });
      if (!r.ok) {
        await r.body?.cancel();
        return;
      }
      if ((r.headers.get("content-type") || "").includes("text/html")) {
        const html = await r.clone().text();
        for (const m of html.match(STATIC_RE) || []) assets.add(m);
      }
      await cache.put(url, r);
    } catch {
      /* une page manquante ne bloque pas l'installation */
    }
  });
  await pool([...assets], 4, async (url) => {
    if (await cache.match(url)) return;
    try {
      const r = await fetch(url);
      if (r.ok) await cache.put(url, r);
      else await r.body?.cancel();
    } catch {
      /* ignoré */
    }
  });
  await cache.put(META, new Response(version));
  return version;
}

self.addEventListener("install", (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data !== "sync") return;
  event.waitUntil(
    (async () => {
      try {
        const res = await fetch("/precache.json", { cache: "no-store" });
        const { version } = await res.json();
        const cache = await caches.open(CACHE);
        const current = await cache.match(META);
        if (!current || (await current.text()) !== version) await precache();
      } catch {
        /* hors ligne : on garde le cache actuel */
      }
    })(),
  );
});

function isRsc(request, url) {
  return request.headers.get("RSC") === "1" || url.searchParams.has("_rsc");
}

async function networkFirst(request, cacheKey) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (response.ok && response.type === "basic") cache.put(cacheKey, response.clone());
    return response;
  } catch {
    const cached = (await cache.match(cacheKey)) || (await cache.match(cacheKey, { ignoreSearch: true }));
    if (cached) return cached;
    if (request.mode === "navigate") {
      const fallback = await cache.match("/accueil");
      if (fallback) return fallback;
    }
    return Response.error();
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname === "/sw.js" || url.pathname === "/precache.json") return;

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request));
    return;
  }
  if (request.mode === "navigate") {
    // Clé sans paramètres : /match/point-suivant?go=1 retombe sur la page en cache.
    event.respondWith(networkFirst(request, url.pathname));
    return;
  }
  if (isRsc(request, url)) {
    event.respondWith(networkFirst(request, request));
    return;
  }
  if (/\.(png|svg|webmanifest|ico|json)$/.test(url.pathname)) {
    event.respondWith(networkFirst(request, url.pathname));
  }
});
