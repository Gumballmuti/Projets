/**
 * Types du contenu Sport Mental.
 *
 * Tout le contenu (messages, exercices, situations, programmes) vit dans
 * src/content/*.ts pour être relu et corrigé par un coach sans toucher au code.
 *
 * Règle multi-sports : chaque élément porte un champ `sports`.
 *  - ["all"]                → contenu « core », valable pour tous les sports ;
 *  - ["padel"] / ["volley"] → contenu spécifique à ce sport ;
 *  - ["padel", "volley"]    → partagé par ces deux sports (jamais affiché à « Autre sport »).
 * Ajouter un sport = ajouter son identifiant ici, sa fiche dans sports.ts et son contenu.
 */

/** Sports qui ont du contenu spécifique. */
export type SportId = "padel" | "volley";

/** Choix possibles dans le profil (« autre » n'affiche que le contenu core). */
export type SportChoice = SportId | "autre";

export type SportTag = "all" | SportId;

/**
 * Les 13 principes de contenu (usage interne uniquement, jamais affichés).
 * Ils servent à vérifier que chaque contenu applique une base solide.
 */
export type Principe =
  | "process" // 1. Process avant résultat
  | "positif" // 2. Formuler en positif
  | "erreur-information" // 3. Reconnaître → Relâcher → Recentrer
  | "routine-4-temps" // 4. Relâcher · Lire · Décider · Engager
  | "activation" // 5. Pression = activation
  | "respiration" // 6. Expiration plus longue que l'inspiration
  | "visualisation" // 7. Multi-sensorielle, avec erreur puis récupération
  | "attention" // 8. Attention large / étroite
  | "confiance-preuves" // 9. Confiance fondée sur des faits
  | "autodialogue" // 10. Instructionnel et bienveillant
  | "communication" // 11. Phrases courtes, positives, rituelles
  | "humilite" // 12. Aucune promesse de résultat
  | "non-medical"; // 13. Pas de dispositif médical

/** Texte court avec ses sports et le principe appliqué. */
export type TaggedText = {
  id: string;
  text: string;
  sports: SportTag[];
  principe: Principe;
};

export type ExerciseCategory =
  | "confiance"
  | "concentration"
  | "pression"
  | "respiration"
  | "erreurs"
  | "motivation"
  | "communication"
  | "avant-match"
  | "apres-match";

export type ExerciseMoment = "avant" | "pendant" | "apres" | "hors-terrain";

export type Difficulty = "facile" | "moyen" | "avance";

/** Façon de guider l'exercice quand le joueur appuie sur « Commencer ». */
export type ExerciseGuide =
  | { type: "etapes" } // pas à pas, le joueur avance à son rythme
  | { type: "minuteur"; secondes: number } // minuteur global + étapes affichées
  | { type: "respiration"; inspire: number; pause: number; expire: number; cycles: number };

export type Exercise = {
  id: string;
  titre: string;
  categorie: ExerciseCategory;
  /** Durée indicative en minutes. */
  duree: number;
  difficulte: Difficulty;
  quand: ExerciseMoment[];
  objectif: string;
  description: string;
  /** Étapes numérotées, formulées pour être dites mot pour mot. */
  etapes: string[];
  /** Variante express utilisable sur le terrain (≤ 20 secondes). */
  express?: { texte: string; secondes: number };
  guide: ExerciseGuide;
  sports: SportTag[];
  principe: Principe;
};

/** Mini-routine « Je suis sous pression » : 5 écrans courts. */
export type PressureSituation = {
  id: string;
  titre: string;
  /** Sous-titre affiché dans la liste des situations. */
  accroche: string;
  sports: SportTag[];
  /** Écran 1 — Normalise : l'activation est de l'énergie disponible. */
  normalise: string[];
  /** Écran 2 — Corps : une expiration longue + relâchement ciblé. */
  corps: string;
  /** Écran 3 — Cible d'attention : une chose concrète. */
  cible: { titre: string; texte: string };
  /** Écran 4 — Plan : une question et des choix tactiques simples. */
  plan: {
    question: string;
    options: Array<{ texte: string; sports: SportTag[] }>;
  };
  /** Écran 5 — Engage : phrase qui précède le mot-clé et « C'EST PARTI ». */
  engage: string;
  /** Phrase facultative à dire au partenaire ou à l'équipe. */
  phrasePartenaire?: Partial<Record<SportTag, string>>;
  principe: Principe;
};

/** Texte qui varie selon le sport ; `all` sert de valeur par défaut. */
export type BySport<T = string> = { all: T } & Partial<Record<SportId, T>>;

export type ProgramDay = {
  jour: number;
  theme: string;
  /** Pourquoi ce jour compte, en deux phrases maximum. */
  intro: string;
  /** Exercice hors terrain (5 à 10 minutes). */
  exercice: { titre: string; duree: number; etapes: string[]; exerciceId?: string };
  /** Mission à tester au prochain entraînement ou match. */
  mission: BySport;
  /** Question de bilan en une ligne. */
  bilan: string;
};

export type ProgramId = "erreurs" | "confiance" | "pression" | "concentration";

export type Program = {
  id: ProgramId;
  titre: string;
  sousTitre: string;
  description: string;
  jours: ProgramDay[];
};
