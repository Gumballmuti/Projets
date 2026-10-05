import type { BySport, ProgramId } from "./types";

/** Analyse post-match : les 6 dimensions notées de 1 à 10. */
export type DimensionId =
  | "confiance"
  | "concentration"
  | "erreurs"
  | "pression"
  | "communication"
  | "plaisir";

export const DIMENSIONS: Array<{ id: DimensionId; label: BySport; court: string }> = [
  { id: "confiance", label: { all: "Confiance" }, court: "Confiance" },
  { id: "concentration", label: { all: "Concentration" }, court: "Concentration" },
  { id: "erreurs", label: { all: "Gestion des erreurs" }, court: "Erreurs" },
  { id: "pression", label: { all: "Gestion de la pression" }, court: "Pression" },
  {
    id: "communication",
    label: {
      all: "Communication avec ton partenaire ou ton équipe",
      padel: "Communication avec ton partenaire",
      volley: "Communication avec ton équipe",
    },
    court: "Communication",
  },
  { id: "plaisir", label: { all: "Plaisir" }, court: "Plaisir" },
];

export const MOMENTS_REBOND = [
  "Après une erreur facile",
  "Après une série de points perdus",
  "Sur un moment clé (fin de set, balle importante)",
  "Après un désaccord ou un moment tendu",
  "En début de match, après un départ difficile",
];

export const POINTS_FORTS = [
  "Ma respiration entre les points",
  "Mon engagement sur chaque balle",
  "Ma communication",
  "Mes choix tactiques",
  "Mon calme sur les moments clés",
  "Mon plaisir de jouer",
];

export const A_AMELIORER = [
  "Rebondir plus vite après une erreur",
  "Garder ma routine entre les points",
  "Rester présent sur les moments clés",
  "Parler plus à mon partenaire ou mon équipe",
  "Gérer mon énergie sur tout le match",
  "Oser mes coups sur les bonnes balles",
];

export const OUTILS_UTILISES = [
  { id: "routine", label: "Routine pré-match" },
  { id: "point-suivant", label: "Point suivant" },
  { id: "erreur", label: "J'ai fait une erreur" },
  { id: "pression", label: "Je suis sous pression" },
  { id: "aucun", label: "Aucun" },
] as const;

export type OutilId = (typeof OUTILS_UTILISES)[number]["id"];

export const RESSENTIS = [
  { id: "satisfait", label: "Satisfait" },
  { id: "calme", label: "Calme" },
  { id: "fatigue", label: "Fatigué" },
  { id: "frustre", label: "Frustré" },
  { id: "decu", label: "Déçu" },
  { id: "fier", label: "Fier" },
] as const;

export type RessentiId = (typeof RESSENTIS)[number]["id"];

/** Recommandation basée sur la dimension la plus basse (règles locales, sans IA). */
export const RECOMMANDATIONS: Record<DimensionId, { texte: string; programme: ProgramId | null; exerciceId: string }> = {
  confiance: {
    texte: "Ta confiance peut s'appuyer sur plus de preuves. Le programme Confiance t'aide à les rassembler.",
    programme: "confiance",
    exerciceId: "carnet-preuves",
  },
  concentration: {
    texte: "Ton attention a eu du mal à rester dans le point. Le programme Concentration entraîne ce retour au présent.",
    programme: "concentration",
    exerciceId: "large-etroit",
  },
  erreurs: {
    texte: "Les erreurs t'ont pesé aujourd'hui. Le programme Erreurs t'apprend à rebondir plus vite.",
    programme: "erreurs",
    exerciceId: "reset-3r",
  },
  pression: {
    texte: "Les moments clés étaient exigeants. Le programme Pression t'aide à transformer cette énergie.",
    programme: "pression",
    exerciceId: "si-alors",
  },
  communication: {
    texte: "La communication peut devenir une force. Essaie de préparer tes phrases de soutien avant le prochain match.",
    programme: null,
    exerciceId: "phrases-soutien",
  },
  plaisir: {
    texte: "Le plaisir a manqué aujourd'hui. Reconnecte-toi à ce que tu aimes dans ton sport : c'est un vrai moteur.",
    programme: null,
    exerciceId: "pourquoi-je-joue",
  },
};

/** Point positif mis en avant : la dimension la mieux notée. */
export const POINTS_POSITIFS: Record<DimensionId, string> = {
  confiance: "Ta confiance a été ton point d'appui aujourd'hui.",
  concentration: "Ta concentration a tenu : c'est une vraie base.",
  erreurs: "Tu as bien géré tes erreurs : c'est une compétence précieuse.",
  pression: "Tu as bien vécu les moments de pression.",
  communication: "Ta communication a été une force.",
  plaisir: "Tu as pris du plaisir : c'est ce qui fait durer l'engagement.",
};
