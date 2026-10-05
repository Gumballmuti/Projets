/**
 * Message bienveillant si l'utilisateur exprime une détresse.
 * Sport Mental n'est pas un dispositif médical : aucun diagnostic, aucun rôle de thérapeute.
 */

/** Mots ou expressions qui déclenchent le message (texte libre, en minuscules, sans accents). */
export const MOTS_DETRESSE = [
  "deprime",
  "depression",
  "envie de mourir",
  "suicide",
  "me tuer",
  "en finir",
  "plus envie de rien",
  "crise d'angoisse",
  "attaque de panique",
  "je n'en peux plus",
  "j'en peux plus",
  "desespere",
  "triste tout le temps",
  "je me sens vide",
  "me faire du mal",
];

export const MESSAGE_SOUTIEN = {
  titre: "Prends soin de toi",
  texte: [
    "Ce que tu ressens compte, au-delà du sport.",
    "Si l'anxiété, la tristesse ou des pensées sombres prennent de la place dans ta vie, parles-en à un professionnel de santé (ton médecin, un psychologue) ou à une personne de confiance.",
    "Sport Mental est un outil de préparation sportive : il ne remplace pas cet accompagnement.",
  ],
  urgence: [
    { label: "Belgique — Centre de Prévention du Suicide (24 h/24, gratuit)", numero: "0800 32 123" },
    { label: "France — Numéro national de prévention du suicide", numero: "3114" },
    { label: "Urgence immédiate (Europe)", numero: "112" },
  ],
};
