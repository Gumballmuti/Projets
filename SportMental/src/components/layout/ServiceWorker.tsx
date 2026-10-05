"use client";

import { useEffect } from "react";

/** Enregistre le service worker (production uniquement) et demande une synchronisation du cache. */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => {
          reg.active?.postMessage("sync");
        })
        .catch(() => {
          /* sans service worker, l'app fonctionne toujours en ligne */
        });
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);
  return null;
}
