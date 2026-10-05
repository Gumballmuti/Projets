import type { SportChoice } from "./types";

/**
 * Fiches sport : nom affiché et vocabulaire utilisé dans l'interface.
 * « autre » utilise un vocabulaire neutre (action, point, match).
 */
export type SportProfile = {
  id: SportChoice;
  label: string;
  description: string;
  vocab: {
    /** « ton partenaire » / « ton équipe » */
    partenaire: string;
    /** Pour les libellés de choix : « mon partenaire » / « mon équipe » */
    monPartenaire: string;
    /** Où poser le regard pour relâcher : cordage, mains, point fixe. */
    regardReset: string;
    /** Geste de clôture après une erreur. */
    gesteCloture: string;
    /** Rituel de communication entre deux points. */
    rituel: string;
    /** Le temps mort naturel du sport. */
    tempsMort: string;
  };
};

export const SPORTS: Record<SportChoice, SportProfile> = {
  padel: {
    id: "padel",
    label: "Padel",
    description: "Points rapides, jeu en duo, vitres, tie-break.",
    vocab: {
      partenaire: "ton partenaire",
      monPartenaire: "mon partenaire",
      regardReset: "ton cordage",
      gesteCloture: "Passe la main sur ton cordage, comme pour l'essuyer.",
      rituel: "Tape de raquettes avec ton partenaire.",
      tempsMort: "les 20 secondes entre deux points",
    },
  },
  volley: {
    id: "volley",
    label: "Volley-ball",
    description: "Six contre six, rotations, séries de points, sets serrés.",
    vocab: {
      partenaire: "ton équipe",
      monPartenaire: "mon équipe",
      regardReset: "tes mains",
      gesteCloture: "Frotte tes paumes l'une contre l'autre, puis ouvre les mains.",
      rituel: "Regroupement rapide, une main tendue : « On repart. »",
      tempsMort: "les quelques secondes avant le service",
    },
  },
  autre: {
    id: "autre",
    label: "Autre sport",
    description: "Contenu commun à tous les sports de match.",
    vocab: {
      partenaire: "ton partenaire ou ton équipe",
      monPartenaire: "mon partenaire ou mon équipe",
      regardReset: "un point fixe devant toi",
      gesteCloture: "Serre le poing trois secondes, puis ouvre la main.",
      rituel: "Un signe ou un mot court avec tes coéquipiers.",
      tempsMort: "le temps entre deux actions",
    },
  },
};

export const SPORT_CHOICES: SportChoice[] = ["padel", "volley", "autre"];

/** Postes au volley-ball (profil, intentions et mots-clés adaptés). */
export type VolleyPoste = "passeur" | "libero" | "attaquant" | "receptionneur-attaquant" | "central" | "polyvalent";

export const VOLLEY_POSTES: Array<{
  id: VolleyPoste;
  label: string;
  intention: string;
  motsCles: string[];
}> = [
  {
    id: "passeur",
    label: "Passeur / passeuse",
    intention: "Je lis le bloc et je sers mon attaquant dans sa zone.",
    motsCles: ["Lire", "Doux", "Tempo"],
  },
  {
    id: "libero",
    label: "Libéro",
    intention: "Je me place tôt, j'appelle fort, je donne une balle jouable.",
    motsCles: ["Appel", "Bas", "Stable"],
  },
  {
    id: "attaquant",
    label: "Attaquant / attaquante (pointu)",
    intention: "Je prends mon élan à fond et je choisis ma zone avant le saut.",
    motsCles: ["Élan", "Zone", "Haut"],
  },
  {
    id: "receptionneur-attaquant",
    label: "Réceptionneur-attaquant (R4)",
    intention: "Je règle ma réception, puis je me rends disponible pour attaquer.",
    motsCles: ["Plateau", "Dispo", "Bras"],
  },
  {
    id: "central",
    label: "Central / centrale",
    intention: "Je lis la passe adverse et je ferme mon bloc avec mes mains hautes.",
    motsCles: ["Lire", "Mains", "Vite"],
  },
  {
    id: "polyvalent",
    label: "Plusieurs postes",
    intention: "Je fais ma tâche du moment, à fond, puis la suivante.",
    motsCles: ["Ici", "Simple", "Prêt"],
  },
];
