import type { BySport, TaggedText } from "./types";

/**
 * Mode « Point suivant ».
 *
 * Règles de rédaction :
 *  - formulation positive uniquement : une cible d'attention concrète, jamais « ne pense pas à… » ;
 *  - court : lisible en un coup d'œil, entre deux points ;
 *  - process : ce que le joueur contrôle (souffle, regard, appuis, plan, communication).
 */

/** Routine entre les points en 4 temps, affichée en version ultra-courte. */
export const ROUTINE_4_TEMPS: Array<{ id: string; mot: string; consigne: BySport }> = [
  {
    id: "relache",
    mot: "Relâche",
    consigne: {
      all: "Longue expiration. Épaules basses.",
      padel: "Longue expiration. Regard sur ton cordage.",
      volley: "Longue expiration. Regard sur tes mains.",
    },
  },
  {
    id: "lis",
    mot: "Lis",
    consigne: {
      all: "Un mot sur le point : long, court, ok.",
    },
  },
  {
    id: "decide",
    mot: "Décide",
    consigne: {
      all: "Une seule intention pour la prochaine action.",
      padel: "Une seule intention : un coup, une zone.",
      volley: "Une seule intention : ta tâche sur la prochaine balle.",
    },
  },
  {
    id: "engage",
    mot: "Engage",
    consigne: {
      all: "Ton mot-clé. Regard devant. On joue.",
    },
  },
];

export const POINT_SUIVANT_MESSAGES: TaggedText[] = [
  // ——— Core (tous sports) ———
  { id: "c01", text: "Respire. Le point précédent est terminé.", sports: ["all"], principe: "erreur-information" },
  { id: "c02", text: "Un point à la fois.", sports: ["all"], principe: "process" },
  { id: "c03", text: "Choisis ton plan, puis joue-le.", sports: ["all"], principe: "routine-4-temps" },
  { id: "c04", text: "Reset. Respire. Rejoue.", sports: ["all"], principe: "routine-4-temps" },
  { id: "c05", text: "Tu contrôles ton intention, pas le résultat.", sports: ["all"], principe: "process" },
  { id: "c06", text: "Présent. Simple. Engagé.", sports: ["all"], principe: "attention" },
  { id: "c07", text: "Regarde la balle.", sports: ["all"], principe: "attention" },
  { id: "c08", text: "Jambes actives.", sports: ["all"], principe: "autodialogue" },
  { id: "c09", text: "Expire long. Épaules basses.", sports: ["all"], principe: "respiration" },
  { id: "c10", text: "Ce point-ci est le seul qui compte.", sports: ["all"], principe: "process" },
  { id: "c11", text: "Une intention claire, puis tu lâches les chevaux.", sports: ["all"], principe: "routine-4-temps" },
  { id: "c12", text: "Ton cœur accélère : c'est de l'énergie pour jouer.", sports: ["all"], principe: "activation" },
  { id: "c13", text: "Pieds vivants, regard haut.", sports: ["all"], principe: "attention" },
  { id: "c14", text: "Tu respires, tu te places, tu joues.", sports: ["all"], principe: "autodialogue" },
  { id: "c15", text: "Reviens à ton plan de jeu.", sports: ["all"], principe: "process" },
  { id: "c16", text: "Simple et solide sur cette balle.", sports: ["all"], principe: "process" },
  { id: "c17", text: "Regard large d'abord, puis la balle.", sports: ["all"], principe: "attention" },
  { id: "c18", text: "Ton geste, à ton rythme.", sports: ["all"], principe: "autodialogue" },
  { id: "c19", text: "Une respiration, une décision.", sports: ["all"], principe: "routine-4-temps" },
  { id: "c20", text: "Engagé sur chaque appui.", sports: ["all"], principe: "process" },
  { id: "c21", text: "Joue avec tes forces.", sports: ["all"], principe: "confiance-preuves" },
  { id: "c22", text: "Ici. Maintenant. Cette balle.", sports: ["all"], principe: "attention" },
  { id: "c23", text: "Tu as déjà réussi ce coup. Refais-le.", sports: ["all"], principe: "confiance-preuves" },
  { id: "c24", text: "Mains souples, jambes prêtes.", sports: ["all"], principe: "autodialogue" },
  { id: "c25", text: "Le score attend. Toi, tu joues l'action.", sports: ["all"], principe: "process" },
  { id: "c26", text: "Prends ton temps, puis accélère.", sports: ["all"], principe: "activation" },
  { id: "c27", text: "Respire, et choisis ta zone.", sports: ["all"], principe: "routine-4-temps" },
  { id: "c28", text: "Calme dans la tête, vif dans les jambes.", sports: ["all"], principe: "activation" },
  { id: "c29", text: "Une action. À fond. Puis la suivante.", sports: ["all"], principe: "process" },
  { id: "c30", text: "Tu te parles comme à un coéquipier : « Allez, simple. »", sports: ["all"], principe: "autodialogue" },

  // ——— Padel ———
  { id: "p01", text: "Tape de raquettes. On repart ensemble.", sports: ["padel"], principe: "communication" },
  { id: "p02", text: "Lob profond, puis on monte au filet.", sports: ["padel"], principe: "process" },
  { id: "p03", text: "Laisse la vitre travailler pour toi.", sports: ["padel"], principe: "attention" },
  { id: "p04", text: "Première balle dans le corps.", sports: ["padel"], principe: "routine-4-temps" },
  { id: "p05", text: "Au centre, au milieu des deux.", sports: ["padel"], principe: "process" },
  { id: "p06", text: "Regard sur le cordage. Expire.", sports: ["padel"], principe: "respiration" },
  { id: "p07", text: "Volée basse, patiente, au fond.", sports: ["padel"], principe: "process" },
  { id: "p08", text: "Un mot à ton partenaire : « À nous. »", sports: ["padel"], principe: "communication" },
  { id: "p09", text: "Contre-vitre calme : tu as le temps.", sports: ["padel"], principe: "activation" },
  { id: "p10", text: "Bandeja en contrôle, garde le filet.", sports: ["padel"], principe: "process" },

  // ——— Volley-ball ———
  { id: "v01", text: "Regroupement. « On repart. »", sports: ["volley"], principe: "communication" },
  { id: "v02", text: "Plateau stable, balle haute au centre.", sports: ["volley"], principe: "process" },
  { id: "v03", text: "Appelle ta balle, fort et tôt.", sports: ["volley"], principe: "communication" },
  { id: "v04", text: "Service : une zone, un geste.", sports: ["volley"], principe: "routine-4-temps" },
  { id: "v05", text: "Prochaine balle. Tu es prêt.", sports: ["volley"], principe: "erreur-information" },
  { id: "v06", text: "Lis le passeur adverse.", sports: ["volley"], principe: "attention" },
  { id: "v07", text: "Élan complet, bras haut.", sports: ["volley"], principe: "autodialogue" },
  { id: "v08", text: "Un encouragement à ton voisin.", sports: ["volley"], principe: "communication" },
  { id: "v09", text: "Fléchis, regarde le serveur.", sports: ["volley"], principe: "attention" },
  { id: "v10", text: "Ta tâche sur cette rotation, à fond.", sports: ["volley"], principe: "process" },
];

/** Dernier écran du mode Point suivant. */
export const POINT_SUIVANT_FINAL = "C'EST PARTI";
