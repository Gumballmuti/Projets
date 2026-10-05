/** URL publique du site (sitemap, robots, Open Graph). */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000")
).replace(/\/$/, "");

export const SITE_NAME = "Sport Mental";
export const SITE_TITLE = "Sport Mental — Préparation mentale pour padel, volley et sports de match";
export const SITE_DESCRIPTION =
  "Prépare ton mental, gère la pression et progresse dans ton sport, notamment le padel et le volley, avec Sport Mental.";
export const BASELINE = "Ton meilleur jeu commence dans ta tête.";
