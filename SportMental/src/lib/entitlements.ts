/**
 * Couche « entitlements » (gratuit / premium) — NON ACTIVÉE en V1.
 *
 * Elle isole la future offre payante sans rien bloquer aujourd'hui :
 * tant que PREMIUM_ACTIF vaut false, toutes les fonctionnalités sont accessibles.
 * Aucun paiement n'est intégré.
 */
export type Plan = "gratuit" | "premium";

export type Feature =
  | "programmes-avances"
  | "statistiques-detaillees"
  | "routines-personnalisees"
  | "historique-complet";

/** Fonctionnalités prévues pour une éventuelle offre premium. */
export const FEATURES_PREMIUM: readonly Feature[] = [
  "programmes-avances",
  "statistiques-detaillees",
  "routines-personnalisees",
  "historique-complet",
];

const PREMIUM_ACTIF = false;

export function currentPlan(): Plan {
  return "gratuit";
}

export function hasFeature(feature: Feature, plan: Plan = currentPlan()): boolean {
  if (!PREMIUM_ACTIF) return true;
  return plan === "premium" || !FEATURES_PREMIUM.includes(feature);
}
