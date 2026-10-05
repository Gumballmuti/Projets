import type { Difficulty, ExerciseCategory, ExerciseMoment } from "./types";

export const CATEGORIES: Record<ExerciseCategory, string> = {
  confiance: "Confiance",
  concentration: "Concentration",
  pression: "Pression",
  respiration: "Respiration",
  erreurs: "Erreurs",
  motivation: "Motivation",
  communication: "Communication",
  "avant-match": "Avant-match",
  "apres-match": "Après-match",
};

export const MOMENTS: Record<ExerciseMoment, string> = {
  avant: "Avant le match",
  pendant: "Pendant le match",
  apres: "Après le match",
  "hors-terrain": "Hors terrain",
};

export const DIFFICULTES: Record<Difficulty, string> = {
  facile: "Facile",
  moyen: "Intermédiaire",
  avance: "Avancé",
};
