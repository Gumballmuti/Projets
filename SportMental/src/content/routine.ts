import type { BySport, SportTag } from "./types";

/**
 * Routine pré-match (3 à 5 minutes, chaque étape peut être passée).
 * 1. Respiration · 2. Où en es-tu ? · 3. Objectif · 4. Mot-clé et intention
 * 5. Plan de rebond · 6. Visualisation · 7. Fin
 */

export const RESPIRATION = {
  titre: "Respiration",
  intro: "On pose le souffle. Expire plus longtemps que tu inspires : c'est ce qui calme le corps.",
  inspire: 4,
  pause: 2,
  expire: 6,
  cycles: 5,
  /** Cycles quand l'énergie est trop haute : on allonge un peu. */
  cyclesEnergieHaute: 7,
  textes: { inspire: "Inspire…", pause: "Garde…", expire: "Expire…" },
  securite: "Si tu as la tête qui tourne, reprends une respiration normale.",
};

export type EnergyLevel = 1 | 2 | 3 | 4 | 5;

export const NIVEAUX_ENERGIE: Array<{ value: EnergyLevel; label: string; hint: string }> = [
  { value: 1, label: "Trop bas", hint: "Lourd, sans envie, endormi" },
  { value: 2, label: "Un peu bas", hint: "Calme, un peu mou" },
  { value: 3, label: "Juste bien", hint: "Prêt, éveillé, posé" },
  { value: 4, label: "Un peu haut", hint: "Impatient, le cœur tape" },
  { value: 5, label: "Trop haut", hint: "Tendu, crispé, ça part dans tous les sens" },
];

export const ETATS_DU_MOMENT = [
  { value: "serein", label: "Serein" },
  { value: "motive", label: "Motivé" },
  { value: "nerveux", label: "Nerveux" },
  { value: "fatigue", label: "Fatigué" },
  { value: "distrait", label: "La tête ailleurs" },
  { value: "frustre", label: "Encore sur un mauvais souvenir" },
] as const;

export type EtatDuMoment = (typeof ETATS_DU_MOMENT)[number]["value"];

/** Réponse adaptée au check-in d'énergie. */
export const ADAPTATION_ENERGIE: Record<"basse" | "juste" | "haute", { titre: string; etapes: string[] }> = {
  basse: {
    titre: "On réveille le corps",
    etapes: [
      "Redresse-toi : pieds largeur d'épaules, poitrine ouverte, regard à l'horizon.",
      "Secoue les bras et les mains pendant 5 secondes.",
      "Trois respirations toniques : inspire vite par le nez, souffle fort par la bouche.",
      "Deux petits sauts sur place. Tu sens tes appuis ? Tu es prêt à bouger.",
    ],
  },
  juste: {
    titre: "Tu es dans la bonne zone",
    etapes: [
      "Garde ce niveau. Une dernière expiration longue pour l'ancrer.",
      "Remarque ce que ça fait dans ton corps : c'est ton état de jeu.",
    ],
  },
  haute: {
    titre: "On canalise l'énergie",
    etapes: [
      "Ton corps se prépare : cette énergie va servir. On la règle, sans l'éteindre.",
      "On prolonge un peu la respiration : expire lentement, comme dans une paille.",
      "Relâche la mâchoire, puis les épaules, puis les mains.",
      "Pose ton regard sur un point fixe pendant deux respirations.",
    ],
  },
};

export const OBJECTIFS_DU_JOUR: Array<{ value: string; label: BySport }> = [
  { value: "calme", label: { all: "Rester calme" } },
  { value: "point-par-point", label: { all: "Jouer point par point" } },
  { value: "accepter-erreurs", label: { all: "Accepter les erreurs" } },
  { value: "agressif", label: { all: "Rester agressif sur les bonnes balles" } },
  {
    value: "communiquer",
    label: {
      all: "Communiquer avec mon partenaire ou mon équipe",
      padel: "Communiquer avec mon partenaire",
      volley: "Communiquer avec mon équipe",
    },
  },
  { value: "plaisir", label: { all: "Prendre du plaisir" } },
  { value: "concentre", label: { all: "Rester concentré" } },
];

export const INTENTIONS: Array<{ id: string; text: string; sports: SportTag[] }> = [
  { id: "i01", text: "Je joue le point présent.", sports: ["all"] },
  { id: "i02", text: "Je contrôle ce que je peux contrôler.", sports: ["all"] },
  { id: "i03", text: "Je fais confiance à mon jeu.", sports: ["all"] },
  { id: "i04", text: "Je m'engage sur chaque balle.", sports: ["all"] },
  { id: "i05", text: "Je respire entre chaque point.", sports: ["all"] },
  { id: "i06", text: "Je choisis un plan, je le joue jusqu'au bout.", sports: ["all"] },
  { id: "i07", text: "Après une erreur, je reviens à ma routine.", sports: ["all"] },
  { id: "i08", text: "Je soutiens mon partenaire à chaque point.", sports: ["padel"] },
  { id: "i09", text: "Je joue mes lobs avec patience.", sports: ["padel"] },
  { id: "i10", text: "J'encourage après chaque action, même ratée.", sports: ["volley"] },
  { id: "i11", text: "J'appelle mes balles, fort et tôt.", sports: ["volley"] },
];

export const MOTS_CLES_SUGGERES = ["Souffle", "Ici", "Simple", "Calme", "Présent", "Go", "Jambes", "Fluide"];

export const PLANS_DE_REBOND: Array<{ value: string; label: BySport }> = [
  { value: "respirer", label: { all: "Je respire : une longue expiration." } },
  {
    value: "regarder",
    label: {
      all: "Je regarde un point fixe deux secondes.",
      padel: "Je regarde mon cordage deux secondes.",
      volley: "Je regarde mes mains deux secondes.",
    },
  },
  {
    value: "geste",
    label: {
      all: "Je tape dans ma main pour fermer le point.",
      volley: "Je frappe dans mes mains et je dis « Suivante ».",
    },
  },
  {
    value: "prochain-coup",
    label: {
      all: "Je choisis tout de suite ma prochaine action.",
      padel: "Je choisis tout de suite mon prochain coup.",
      volley: "Je choisis tout de suite ma tâche sur la prochaine balle.",
    },
  },
];

/**
 * Visualisation guidée (1 à 2 minutes).
 * Multi-sensorielle, vitesse réelle, depuis ses propres yeux,
 * avec une erreur suivie d'une récupération réussie.
 * Chaque segment dure `secondes`.
 */
export type VisualisationSegment = { secondes: number; texte: string };

export const VISUALISATIONS: Record<"all" | "padel" | "volley", VisualisationSegment[]> = {
  all: [
    { secondes: 10, texte: "Ferme les yeux si tu veux. Une longue expiration." },
    { secondes: 12, texte: "Tu es sur le terrain, à ta place. Regarde autour de toi, avec tes propres yeux." },
    { secondes: 12, texte: "Écoute les bruits : la balle, les appuis, les voix. Sens le sol sous tes pieds." },
    { secondes: 14, texte: "Une action commence. Vois-la à vitesse réelle : tu te places, tu joues ton geste." },
    { secondes: 12, texte: "Une balle t'échappe. Tu remarques le fait, simplement. Tu expires longuement." },
    { secondes: 12, texte: "Tu fais ton geste de clôture. Tu choisis ton plan pour l'action suivante." },
    { secondes: 14, texte: "L'action suivante arrive. Tu es prêt. Tu la joues en entier, engagé, et elle passe." },
    { secondes: 10, texte: "Garde cette sensation. Quand tu es prêt, ouvre les yeux." },
  ],
  padel: [
    { secondes: 10, texte: "Ferme les yeux si tu veux. Une longue expiration." },
    { secondes: 12, texte: "Tu es sur la piste, côté de ton choix. Vois les vitres, le filet, ton partenaire à côté de toi." },
    { secondes: 12, texte: "Écoute le bruit sec de la balle sur la raquette, le rebond contre la vitre. Sens tes appuis sur le gazon." },
    { secondes: 14, texte: "Le point commence. Tu retournes au centre, tu montes au filet avec ton partenaire, tu tiens ta volée basse." },
    { secondes: 12, texte: "Un lob te passe au-dessus et tu rates ta sortie de vitre. Tu remarques le fait. Tu expires longuement." },
    { secondes: 12, texte: "Tu passes la main sur ton cordage. Tape de raquettes. Tu décides : prochain lob, profond, au centre." },
    { secondes: 14, texte: "Point suivant. Ton lob part haut et profond, vous reprenez le filet, ta volée termine le point. Simple." },
    { secondes: 10, texte: "Garde cette sensation de duo calme et engagé. Ouvre les yeux quand tu es prêt." },
  ],
  volley: [
    { secondes: 10, texte: "Ferme les yeux si tu veux. Une longue expiration." },
    { secondes: 12, texte: "Tu es dans la salle, à ton poste. Vois le filet, le serveur adverse, tes coéquipiers autour de toi." },
    { secondes: 12, texte: "Écoute le coup de sifflet, le ballon frappé, les appels. Sens tes appuis fléchis, prêts à partir." },
    { secondes: 14, texte: "Le service arrive. Tu lis la trajectoire, tu te places tôt, tu fais ta tâche sur cette balle." },
    { secondes: 12, texte: "Ta réception part trop loin du filet. Tu remarques le fait. Tu expires longuement." },
    { secondes: 12, texte: "Tu frottes tes paumes. Regroupement : « On repart. » Tu décides : plateau stable, balle haute au centre." },
    { secondes: 14, texte: "Service suivant. Tu appelles fort, ta réception monte au passeur, l'attaque passe. Vous vous regroupez." },
    { secondes: 10, texte: "Garde cette sensation d'équipe soudée. Ouvre les yeux quand tu es prêt." },
  ],
};

export const FIN_DE_ROUTINE = {
  titre: "Tu es prêt. 🎾",
  bouton: "JE SUIS PRÊT",
  message: ["Respire.", "Fais confiance à ton jeu.", "Joue le point présent."],
};
