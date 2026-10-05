import { EXERCICES } from "@/content/exercices";
import { SITUATIONS_PRESSION } from "@/content/pression";
import { PROGRAMMES } from "@/content/programmes";

// Liste générée au build : toutes les pages à garder hors ligne.
export const dynamic = "force-static";

export function GET() {
  const urls = [
    "/",
    "/accueil",
    "/bienvenue",
    "/routine",
    "/exercices",
    "/programmes",
    "/progression",
    "/bilan",
    "/preuves",
    "/profil",
    "/match/point-suivant",
    "/match/erreur",
    "/match/pression",
    "/confidentialite",
    "/conditions",
    "/mentions-legales",
    ...EXERCICES.map((e) => `/exercices/${e.id}`),
    ...PROGRAMMES.map((p) => `/programmes/${p.id}`),
    ...SITUATIONS_PRESSION.map((s) => `/match/pression/${s.id}`),
    "/manifest.webmanifest",
    "/icon.svg",
    "/apple-icon.png",
    "/icons/icon-192.png",
    "/icons/icon-512.png",
  ];
  return Response.json({ version: process.env.APP_VERSION ?? "dev", urls });
}
