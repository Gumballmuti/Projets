import type { BySport } from "./types";

/**
 * Mode « J'ai fait une erreur » : Reconnaître → Relâcher → Recentrer.
 * Une erreur est une information, pas un verdict.
 */

export const ERREUR_ETAPES = {
  respire: {
    titre: "Respire",
    texte: "Une longue expiration. Laisse sortir l'air jusqu'au bout.",
    secondes: 6,
  },
  accepte: {
    titre: "C'est fait.",
    texte: "Ce point est terminé.",
    consigne: "Touche l'écran pour fermer le point.",
    apres: "Point fermé. Tu es déjà dans le suivant.",
  },
  recentre: {
    titre: "Qu'est-ce que tu peux contrôler maintenant ?",
  },
};

export type ControleId = "placement" | "respiration" | "communication" | "intention" | "prochain-coup";

/** Choix « Recentre » et micro-consigne affichée ensuite. */
export const CONTROLES: Array<{ id: ControleId; label: BySport; consigne: BySport }> = [
  {
    id: "placement",
    label: { all: "Mon placement" },
    consigne: {
      all: "Reviens en position, jambes actives, regarde l'adversaire.",
      padel: "Reviens au centre de ta moitié, jambes fléchies, regard sur les adversaires.",
      volley: "Retrouve ta zone, appuis fléchis, regard sur le passeur adverse.",
    },
  },
  {
    id: "respiration",
    label: { all: "Ma respiration" },
    consigne: {
      all: "Encore une expiration longue. Épaules basses, mâchoire souple.",
    },
  },
  {
    id: "communication",
    label: {
      all: "Ma communication",
      padel: "Ma communication avec mon partenaire",
      volley: "Ma communication avec l'équipe",
    },
    consigne: {
      all: "Un mot positif à ton partenaire ou à ton équipe : « Suivant. On y va. »",
      padel: "Tape de raquettes et un mot : « À nous, le prochain. »",
      volley: "Regroupement, un regard, un mot : « On repart. »",
    },
  },
  {
    id: "intention",
    label: { all: "Mon intention" },
    consigne: {
      all: "Une seule intention simple pour la prochaine action. Dis-la dans ta tête.",
      padel: "Une seule intention : par exemple « lob profond » ou « volée au centre ».",
      volley: "Une seule intention : par exemple « plateau stable » ou « service en zone 1 ».",
    },
  },
  {
    id: "prochain-coup",
    label: {
      all: "Ma prochaine action",
      padel: "Mon prochain coup",
      volley: "Ma prochaine balle",
    },
    consigne: {
      all: "Choisis ta prochaine action maintenant. Vois-la une seconde, puis joue-la.",
      padel: "Choisis ton prochain coup maintenant : zone et hauteur. Vois-le, puis joue-le.",
      volley: "Choisis ta tâche sur la prochaine balle. Vois-la, puis fais-la.",
    },
  },
];

export type TypeErreur = "technique" | "tactique" | "decision" | "energie";

export const TYPES_ERREUR: Array<{ id: TypeErreur; label: string }> = [
  { id: "technique", label: "Technique" },
  { id: "tactique", label: "Tactique" },
  { id: "decision", label: "Décision" },
  { id: "energie", label: "Énergie" },
];

export const ERREUR_TYPE_QUESTION = "Si tu veux, note le type d'erreur pour ton bilan (facultatif) :";
