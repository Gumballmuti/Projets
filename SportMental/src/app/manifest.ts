import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION } from "@/lib/site";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Sport Mental",
    short_name: "Sport Mental",
    description: SITE_DESCRIPTION,
    lang: "fr",
    dir: "ltr",
    start_url: "/accueil",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f5faf6",
    theme_color: "#1f5f3f",
    categories: ["sports", "health", "lifestyle"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Point suivant", url: "/match/point-suivant", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "J'ai fait une erreur", url: "/match/erreur", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Je suis sous pression", url: "/match/pression", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
