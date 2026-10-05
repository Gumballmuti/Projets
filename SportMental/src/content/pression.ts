import type { PressureSituation } from "./types";

/**
 * Mode « Je suis sous pression ».
 * Chaque situation = 5 écrans courts : Normalise · Corps · Cible · Plan · Engage.
 * La pression est présentée comme de l'activation utile, jamais comme un ennemi.
 * Chaque situation a son propre contenu (pas la même routine copiée).
 */
export const SITUATIONS_PRESSION: PressureSituation[] = [
  {
    id: "balle-de-break",
    titre: "Balle de break",
    accroche: "Pour vous ou contre vous, c'est un point comme les autres, joué à fond.",
    sports: ["padel"],
    normalise: [
      "Ton corps se prépare.",
      "Le cœur qui accélère, c'est de l'énergie pour ce point.",
    ],
    corps: "Expire longuement. Desserre la main sur le grip, puis relâche les épaules.",
    cible: {
      titre: "La première balle",
      texte: "Toute ton attention sur la première balle du point : retour ou service, le reste suit.",
    },
    plan: {
      question: "Quel est ton plan pour ce point ?",
      options: [
        { texte: "Retour bas, dans les pieds du serveur qui monte", sports: ["padel"] },
        { texte: "Lob profond pour prendre le filet", sports: ["padel"] },
        { texte: "Service dans le corps, puis je monte", sports: ["padel"] },
        { texte: "Jeu au centre, entre les deux adversaires", sports: ["padel"] },
      ],
    },
    engage: "Même routine que d'habitude. Un plan, un engagement.",
    phrasePartenaire: { padel: "« Première balle, et on joue. »" },
    principe: "activation",
  },
  {
    id: "point-en-or",
    titre: "Point en or",
    accroche: "Égalité, un seul point décide du jeu. Clarifie qui reçoit et comment.",
    sports: ["padel"],
    normalise: [
      "Un point décisif, ça fait monter la tension.",
      "C'est ton corps qui se met en alerte pour toi.",
    ],
    corps: "Une longue expiration. Les genoux souples, le poids sur l'avant des pieds.",
    cible: {
      titre: "Votre décision à deux",
      texte: "Décidez ensemble qui reçoit, puis concentre-toi sur ton rôle dans ce point.",
    },
    plan: {
      question: "Quel est votre plan pour ce point ?",
      options: [
        { texte: "Le joueur le plus à l'aise au retour reçoit", sports: ["padel"] },
        { texte: "Retour long, puis on gagne le filet", sports: ["padel"] },
        { texte: "Patience : on joue au centre jusqu'à la balle facile", sports: ["padel"] },
      ],
    },
    engage: "Un plan clair, partagé à deux. Vous le jouez jusqu'au bout.",
    phrasePartenaire: { padel: "« On décide, on s'engage. Ensemble. »" },
    principe: "communication",
  },
  {
    id: "tie-break",
    titre: "Tie-break",
    accroche: "Point après point, avec la même routine. Le tableau d'affichage attend.",
    sports: ["padel", "volley"],
    normalise: [
      "Le tie-break amplifie tout : c'est normal de le sentir.",
      "Cette énergie, tu peux la mettre dans tes jambes.",
    ],
    corps: "Expire longuement deux fois. Sautille légèrement : des appuis vivants.",
    cible: {
      titre: "Ta routine",
      texte: "Ta routine entre les points est ton ancre : relâche, lis, décide, engage. Comme au premier jeu.",
    },
    plan: {
      question: "Quel est ton plan pour le prochain point ?",
      options: [
        { texte: "Premier service dans le corps, puis filet", sports: ["padel"] },
        { texte: "Je joue haut et profond jusqu'à la balle facile", sports: ["padel"] },
        { texte: "Service en zone sûre, sans prendre de risque inutile", sports: ["volley"] },
        { texte: "Réception haute et centrale pour donner du temps au passeur", sports: ["volley"] },
        { texte: "Attaque dans la zone choisie avant le saut", sports: ["volley"] },
      ],
    },
    engage: "Ce point, et seulement ce point. Ta routine, ton plan.",
    phrasePartenaire: {
      padel: "« Point par point. On joue le nôtre. »",
      volley: "« Un point. Le suivant. Ensemble. »",
    },
    principe: "routine-4-temps",
  },
  {
    id: "fin-de-set",
    titre: "Fin de set serrée",
    accroche: "Garde le jeu qui t'a amené ici. Tes forces, tes appuis, ton souffle.",
    sports: ["all"],
    normalise: [
      "Les fins de set serrées, tout le monde les sent.",
      "Ton corps te donne de l'énergie. Tu peux l'utiliser.",
    ],
    corps: "Expire longuement. Bois une gorgée si tu peux. Relâche la mâchoire.",
    cible: {
      titre: "Ton jeu de base",
      texte: "Rappelle-toi ce qui fonctionne depuis le début du set, et rejoue-le.",
    },
    plan: {
      question: "Qu'est-ce qui marche depuis le début ?",
      options: [
        { texte: "Mon coup le plus sûr, joué avec engagement", sports: ["all"] },
        { texte: "La même tactique, sans la changer maintenant", sports: ["all"] },
        { texte: "Des balles hautes et profondes pour gagner du temps", sports: ["padel"] },
        { texte: "Le schéma d'attaque qui a le mieux marché", sports: ["volley"] },
      ],
    },
    engage: "Tu joues comme au milieu du set : présent, engagé, simple.",
    phrasePartenaire: {
      padel: "« On garde ce qui marche. »",
      volley: "« On reste ensemble, on garde notre jeu. »",
      all: "« On garde ce qui marche. »",
    },
    principe: "process",
  },
  {
    id: "match-serre",
    titre: "Match serré",
    accroche: "Quand tout se joue à peu, ta routine fait la différence.",
    sports: ["all"],
    normalise: [
      "Un match serré, c'est exigeant et c'est normal d'être tendu.",
      "C'est le signe que tu es dedans, à ton niveau.",
    ],
    corps: "Expire longuement. Fais rouler les épaules vers l'arrière, une fois.",
    cible: {
      titre: "Le point présent",
      texte: "Ramène ton regard sur la balle. Le score s'occupe de lui-même.",
    },
    plan: {
      question: "Quelle est ta seule priorité pour ce point ?",
      options: [
        { texte: "Mes appuis : arriver tôt sur la balle", sports: ["all"] },
        { texte: "Mon coup fort, au bon moment", sports: ["all"] },
        { texte: "Jouer haut et patient jusqu'à l'occasion", sports: ["padel"] },
        { texte: "Appeler chaque balle et couvrir mon attaquant", sports: ["volley"] },
      ],
    },
    engage: "Une priorité, un engagement. Tu joues ce point.",
    principe: "attention",
  },
  {
    id: "balle-de-match",
    titre: "Balle de match",
    accroche: "Même processus que d'habitude. Aucun coup « spécial ».",
    sports: ["all"],
    normalise: [
      "Balle de match : ton corps le sait, il se prépare.",
      "C'est de l'énergie. Tu vas la mettre dans ton jeu habituel.",
    ],
    corps: "Expire longuement. Desserre les mains. Sens tes pieds au sol.",
    cible: {
      titre: "Ton processus habituel",
      texte: "Ta routine habituelle, ton coup habituel, à ton rythme habituel. Rien de plus.",
    },
    plan: {
      question: "Quel est ton coup habituel sur ce type de point ?",
      options: [
        { texte: "Mon coup le plus fiable, joué en entier", sports: ["all"] },
        { texte: "Mon schéma de jeu préféré, comme toute la partie", sports: ["all"] },
        { texte: "Lob profond, puis filet à deux", sports: ["padel"] },
        { texte: "Service sûr dans ma zone d'entraînement", sports: ["volley"] },
      ],
    },
    engage: "Le même processus. Tu le joues comme les autres points.",
    phrasePartenaire: {
      padel: "« Comme d'habitude. On joue. »",
      volley: "« Notre jeu, comme d'habitude. »",
    },
    principe: "process",
  },
  {
    id: "adversaire-plus-fort",
    titre: "Adversaire plus fort",
    accroche: "Tes forces et un seul objectif tactique. C'est tout ce qui compte.",
    sports: ["all"],
    normalise: [
      "Face à plus fort, la tension monte : c'est un défi, ton corps s'y prépare.",
      "Tu as tout à apprendre et beaucoup à montrer.",
    ],
    corps: "Expire longuement. Redresse-toi, regard haut. Tu occupes ta place.",
    cible: {
      titre: "Tes forces",
      texte: "Pense à deux choses que tu fais bien. Ce match, tu le joues avec elles.",
    },
    plan: {
      question: "Quel est ton seul objectif tactique ?",
      options: [
        { texte: "Allonger les échanges et jouer avec patience", sports: ["all"] },
        { texte: "Jouer sur leur point le moins solide", sports: ["all"] },
        { texte: "Lober pour les éloigner du filet", sports: ["padel"] },
        { texte: "Viser le joueur le moins à l'aise en réception", sports: ["volley"] },
      ],
    },
    engage: "Tes forces, un objectif. Tu joues ton match.",
    phrasePartenaire: {
      padel: "« On joue notre jeu, point par point. »",
      volley: "« Notre jeu. Une balle à la fois. »",
    },
    principe: "confiance-preuves",
  },
  {
    id: "peur-de-perdre",
    titre: "Peur de perdre",
    accroche: "Ramène ton attention sur ce que tu peux faire, maintenant.",
    sports: ["all"],
    normalise: [
      "Cette peur montre que ce match compte pour toi.",
      "C'est humain. Tu peux la sentir et jouer quand même.",
    ],
    corps: "Expire longuement deux fois. Pose une main sur ton ventre et sens-le se relâcher.",
    cible: {
      titre: "Ce que tu contrôles",
      texte: "Ton souffle, ton placement, ton intention. Choisis-en un et pose ton attention dessus.",
    },
    plan: {
      question: "Que veux-tu faire sur la prochaine balle ?",
      options: [
        { texte: "Arriver tôt, bien placé", sports: ["all"] },
        { texte: "Jouer mon coup en entier, engagé", sports: ["all"] },
        { texte: "Viser une zone large et sûre", sports: ["all"] },
      ],
    },
    engage: "Tu joues pour la balle qui arrive. Celle-là.",
    principe: "process",
  },
  {
    id: "peur-de-decevoir",
    titre: "Peur de décevoir",
    accroche: "Ton partenaire ou ton équipe veut surtout quelqu'un d'engagé.",
    sports: ["all"],
    normalise: [
      "Tu tiens aux autres : c'est une qualité de coéquipier.",
      "Ce qu'ils attendent de toi, c'est ton engagement. Ça, tu le contrôles.",
    ],
    corps: "Expire longuement. Croise le regard de ton partenaire ou d'un coéquipier.",
    cible: {
      titre: "Votre lien",
      texte: "Dis une phrase courte et positive. Partager la pression la rend plus légère.",
    },
    plan: {
      question: "Comment veux-tu aider sur ce point ?",
      options: [
        { texte: "Jouer ma part du plan, en entier", sports: ["all"] },
        { texte: "Encourager après chaque action, même ratée", sports: ["all"] },
        { texte: "Couvrir le centre et prendre mes balles", sports: ["padel"] },
        { texte: "Appeler fort et couvrir l'attaquant", sports: ["volley"] },
      ],
    },
    engage: "Engagé, avec les autres. C'est ça, être un bon coéquipier.",
    phrasePartenaire: {
      all: "« On joue ensemble, point par point. »",
      padel: "« On joue ensemble, point par point. »",
      volley: "« Ensemble. On repart. »",
    },
    principe: "communication",
  },
  {
    id: "serie-adverse",
    titre: "Série de points adverses",
    accroche: "Casser la dynamique : un reset collectif, puis une balle simple.",
    sports: ["volley"],
    normalise: [
      "Les séries arrivent dans tous les matchs.",
      "Une série se coupe avec une seule balle bien jouée.",
    ],
    corps: "Expire longuement. Secoue les mains. Fléchis les jambes, prêt.",
    cible: {
      titre: "Le regroupement",
      texte: "Regroupement serré au centre. Un regard pour chacun, une phrase, puis chacun à sa tâche.",
    },
    plan: {
      question: "Quel est le plan pour casser la série ?",
      options: [
        { texte: "Réception haute et centrale, sans chercher la perfection", sports: ["volley"] },
        { texte: "Attaque sûre dans la zone la plus large", sports: ["volley"] },
        { texte: "Service en zone sûre pour remettre la balle en jeu", sports: ["volley"] },
        { texte: "Demander un temps mort pour un reset collectif", sports: ["volley"] },
      ],
    },
    engage: "Une balle. Simple. Ensemble.",
    phrasePartenaire: { volley: "« Une balle. On repart. »" },
    principe: "communication",
  },
  {
    id: "service-sous-pression",
    titre: "Service sous pression",
    accroche: "Une intention tactique claire, un geste que tu connais.",
    sports: ["volley"],
    normalise: [
      "Seul sur la ligne, tout le monde regarde : c'est normal de le sentir.",
      "Ton corps se prépare à frapper. Utilise cette énergie.",
    ],
    corps: "Fais rebondir le ballon deux fois, à ton rythme. Expire longuement.",
    cible: {
      titre: "Ta zone",
      texte: "Regarde la zone que tu vises. Tes yeux décident, ton bras suit.",
    },
    plan: {
      question: "Quelle est ton intention pour ce service ?",
      options: [
        { texte: "Zone 1, profond", sports: ["volley"] },
        { texte: "Zone 5, sur le réceptionneur le moins à l'aise", sports: ["volley"] },
        { texte: "Entre deux joueurs, pour créer l'hésitation", sports: ["volley"] },
        { texte: "Service flottant tendu, au centre", sports: ["volley"] },
      ],
    },
    engage: "Ta zone, ton geste. Lancer, frappe.",
    principe: "positif",
  },
  {
    id: "entree-en-jeu",
    titre: "J'entre en jeu",
    accroche: "Routine express du remplaçant : prêt en trente secondes.",
    sports: ["volley"],
    normalise: [
      "Entrer à froid fait monter le cœur. C'est ton corps qui démarre.",
      "Le coach te fait confiance pour une tâche précise.",
    ],
    corps: "Trois sauts sur place, une longue expiration, épaules relâchées.",
    cible: {
      titre: "Ta tâche",
      texte: "Quelle est ta mission en entrant ? Une seule : service, bloc, réception ou défense.",
    },
    plan: {
      question: "Ta mission en entrant :",
      options: [
        { texte: "Servir en zone sûre", sports: ["volley"] },
        { texte: "Fermer le bloc avec mes mains hautes", sports: ["volley"] },
        { texte: "Réception haute et centrale", sports: ["volley"] },
        { texte: "Mettre de l'énergie et de la voix", sports: ["volley"] },
      ],
    },
    engage: "Tu entres, tu fais ta tâche, à fond.",
    phrasePartenaire: { volley: "« Je suis là. On y va. »" },
    principe: "activation",
  },
];
