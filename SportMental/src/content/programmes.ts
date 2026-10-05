import type { Program } from "./types";

/**
 * Programmes de 7 jours (sans IA). Chaque jour : 5 à 10 minutes,
 * un exercice hors terrain, une mission terrain adaptée au sport, une question de bilan.
 */
export const PROGRAMMES: Program[] = [
  {
    id: "erreurs",
    titre: "Mieux gérer les erreurs",
    sousTitre: "7 jours pour rebondir plus vite",
    description: "Apprends à transformer une erreur en information et à revenir dans le point suivant.",
    jours: [
      {
        jour: 1,
        theme: "Accepter l'erreur",
        intro: "Tout le monde fait des erreurs, même au plus haut niveau. Ce qui compte, c'est la seconde d'après.",
        exercice: {
          titre: "Mes erreurs, mes infos",
          duree: 7,
          exerciceId: "carnet-erreurs",
          etapes: [
            "Note trois erreurs de ton dernier match, en une phrase factuelle chacune.",
            "À côté de chacune, écris ce qu'elle t'apprend.",
            "Relis-les et dis : « C'est une information. »",
          ],
        },
        mission: {
          all: "Après chaque erreur, dis le fait en un mot, sans adjectif : « Long », « Court », « Tôt ».",
        },
        bilan: "As-tu réussi à décrire tes erreurs avec des mots factuels ?",
      },
      {
        jour: 2,
        theme: "Respirer",
        intro: "L'expiration longue est ton premier outil après une erreur. Elle redonne de la place dans la tête.",
        exercice: {
          titre: "Respiration 4-6",
          duree: 5,
          exerciceId: "respiration-4-6",
          etapes: [
            "Fais 6 cycles : inspire 4 secondes, expire 6 secondes.",
            "Puis 3 cycles debout, comme sur le terrain.",
            "Remarque ce qui change dans tes épaules.",
          ],
        },
        mission: {
          all: "Après chaque erreur, fais une expiration longue avant de te replacer.",
          padel: "Après chaque erreur, fais une expiration longue en regardant ton cordage.",
          volley: "Après chaque erreur, fais une expiration longue avant le service suivant.",
        },
        bilan: "Combien de fois as-tu pensé à expirer après une erreur ?",
      },
      {
        jour: 3,
        theme: "Reset mental",
        intro: "Reconnaître, relâcher, recentrer : trois temps qui deviennent automatiques avec la répétition.",
        exercice: {
          titre: "Reset en 3 temps",
          duree: 6,
          exerciceId: "reset-3r",
          etapes: [
            "Rejoue dans ta tête trois erreurs récentes.",
            "Pour chacune : le fait, une expiration, une intention.",
            "Choisis ton geste de clôture.",
          ],
        },
        mission: {
          all: "Applique le reset en 3 temps à chaque erreur pendant une séance.",
          padel: "Applique le reset en 3 temps, en finissant par une tape de raquettes.",
          volley: "Applique le reset en 3 temps, en finissant par le regroupement.",
        },
        bilan: "Quelle étape du reset t'a le plus aidé ?",
      },
      {
        jour: 4,
        theme: "Point suivant",
        intro: "Le point suivant est la seule chose qui compte. Ta routine entre les points t'y amène.",
        exercice: {
          titre: "Ma routine en 4 temps",
          duree: 6,
          etapes: [
            "Écris ta routine : Relâcher, Lire, Décider, Engager.",
            "Pour chaque temps, choisis une action précise.",
            "Répète-la 5 fois à la maison, debout, comme sur le terrain.",
          ],
        },
        mission: {
          all: "Utilise le bouton « Point suivant » ou ta routine entre chaque point d'un set.",
          padel: "Utilise ta routine dans les 20 secondes entre chaque point d'un set.",
          volley: "Utilise ta routine entre chaque action d'un set, en version express.",
        },
        bilan: "Ta routine a-t-elle tenu dans le temps disponible ?",
      },
      {
        jour: 5,
        theme: "Langage intérieur",
        intro: "La façon dont tu te parles après une erreur influence la balle suivante.",
        exercice: {
          titre: "Me parler comme à un coéquipier",
          duree: 6,
          exerciceId: "coequipier-interieur",
          etapes: [
            "Note une phrase dure que tu te dis après une erreur.",
            "Réécris-la comme si tu parlais à un coéquipier, à la 2e personne.",
            "Ajoute une consigne concrète : « Jambes. Regarde la balle. »",
          ],
        },
        mission: {
          all: "Après chaque erreur, dis-toi ta nouvelle phrase, à la 2e personne.",
        },
        bilan: "Quelle phrase t'a le plus aidé aujourd'hui ?",
      },
      {
        jour: 6,
        theme: "Gérer la frustration",
        intro: "La frustration montre que tu tiens à bien faire. Tu peux la sentir et la transformer en énergie.",
        exercice: {
          titre: "Le thermomètre de frustration",
          duree: 7,
          etapes: [
            "Rappelle-toi un moment de grosse frustration en match. Note-la de 1 à 10.",
            "Quels signes dans ton corps ? (mâchoire, mains, respiration)",
            "Choisis une action pour chaque signe : relâcher la mâchoire, ouvrir les mains, expirer.",
            "Écris ton plan : « Si je sens [signe], alors je [action]. »",
          ],
        },
        mission: {
          all: "Quand la frustration monte, applique ton plan « si… alors… » et note combien de temps tu mets à revenir.",
        },
        bilan: "Qu'est-ce qui t'a aidé à faire redescendre la frustration ?",
      },
      {
        jour: 7,
        theme: "Routine complète",
        intro: "Tu as tous les éléments. Aujourd'hui, tu les assembles en une seule routine.",
        exercice: {
          titre: "Ma routine d'après-erreur",
          duree: 8,
          etapes: [
            "Écris ta routine complète : le fait, l'expiration, le geste de clôture, la phrase, l'intention.",
            "Répète-la 5 fois en imaginant des erreurs différentes.",
            "Ajoute-la à ton profil comme plan de rebond.",
          ],
        },
        mission: {
          all: "Joue un match entier avec ta routine d'après-erreur, puis fais ton bilan dans l'app.",
        },
        bilan: "Sur une échelle de 1 à 10, à quel point tu rebondis mieux qu'il y a une semaine ?",
      },
    ],
  },
  {
    id: "confiance",
    titre: "Renforcer la confiance",
    sousTitre: "7 jours pour t'appuyer sur des faits",
    description: "Construis une confiance solide, fondée sur tes réussites réelles et ta préparation.",
    jours: [
      {
        jour: 1,
        theme: "Mes preuves de réussite",
        intro: "La confiance tient mieux sur des faits que sur des promesses. On commence par les collecter.",
        exercice: {
          titre: "Mon carnet de preuves",
          duree: 7,
          exerciceId: "carnet-preuves",
          etapes: [
            "Note 3 moments précis où tu as bien joué.",
            "Note 2 choses que tu as faites pour progresser.",
            "Enregistre-les dans ton carnet de preuves.",
          ],
        },
        mission: {
          all: "Pendant la séance, repère une action réussie et note-la ensuite comme preuve.",
        },
        bilan: "Quelle preuve t'a fait le plus de bien en la relisant ?",
      },
      {
        jour: 2,
        theme: "Mes forces de joueur",
        intro: "Connaître tes forces t'aide à savoir où t'appuyer quand ça se tend.",
        exercice: {
          titre: "Mes trois forces",
          duree: 6,
          etapes: [
            "Liste 3 forces : un coup, une qualité physique, une qualité mentale.",
            "Pour chacune, note un exemple vécu.",
            "Demande à un partenaire ou un coéquipier ce qu'il voit comme ta force.",
          ],
        },
        mission: {
          all: "Utilise volontairement une de tes forces au moins 5 fois pendant la séance.",
          padel: "Joue volontairement ton coup fort au moins 5 fois pendant la séance.",
          volley: "Mets en avant une force de ton poste au moins 5 fois pendant la séance.",
        },
        bilan: "Quelle force as-tu utilisée et comment ça s'est passé ?",
      },
      {
        jour: 3,
        theme: "Se parler comme à un coéquipier",
        intro: "Ton dialogue intérieur peut te soutenir comme un bon coéquipier.",
        exercice: {
          titre: "Me parler comme à un coéquipier",
          duree: 6,
          exerciceId: "coequipier-interieur",
          etapes: [
            "Écris 3 phrases que tu dirais à un coéquipier en difficulté.",
            "Réécris-les pour toi, à la 2e personne.",
            "Choisis celle que tu utiliseras en match.",
          ],
        },
        mission: {
          all: "Dis-toi ta phrase de soutien après chaque point difficile.",
        },
        bilan: "Ta phrase de soutien sonnait-elle juste pour toi ?",
      },
      {
        jour: 4,
        theme: "Posture et énergie",
        intro: "Ton corps parle à ta tête. Une posture de joueur prêt t'aide à le devenir.",
        exercice: {
          titre: "Posture de joueur prêt",
          duree: 5,
          exerciceId: "posture-energie",
          etapes: [
            "Entraîne-toi à la posture : regard haut, épaules basses, appuis vivants.",
            "Marche dans la pièce avec cette posture pendant une minute.",
            "Compare avec une posture repliée. Que remarques-tu ?",
          ],
        },
        mission: {
          all: "Entre chaque point, retrouve ta posture de joueur prêt, surtout après un point perdu.",
        },
        bilan: "As-tu remarqué une différence dans ton énergie ?",
      },
      {
        jour: 5,
        theme: "Se rappeler une belle séquence",
        intro: "Revivre une belle séquence en détail réactive les sensations qui vont avec.",
        exercice: {
          titre: "Visualiser une belle séquence",
          duree: 6,
          etapes: [
            "Choisis une séquence de jeu réussie que tu as vécue.",
            "Revis-la les yeux fermés, depuis tes propres yeux, à vitesse réelle.",
            "Ajoute les sons, les appuis, la respiration.",
            "Inclus une petite erreur au milieu, puis ton rebond réussi.",
          ],
        },
        mission: {
          all: "Avant la séance, revis ta belle séquence 1 minute.",
        },
        bilan: "Quelles sensations de cette séquence as-tu retrouvées ?",
      },
      {
        jour: 6,
        theme: "Prendre un risque tactique calculé",
        intro: "La confiance grandit quand tu oses ce que tu as préparé.",
        exercice: {
          titre: "Mon risque calculé",
          duree: 6,
          etapes: [
            "Choisis un coup ou une prise d'initiative que tu maîtrises à l'entraînement.",
            "Décide dans quelle situation tu vas l'oser.",
            "Écris : « Quand [situation], j'ose [action]. »",
          ],
        },
        mission: {
          all: "Ose ton risque calculé au moins 3 fois, quel que soit le résultat.",
          padel: "Ose ton risque calculé au moins 3 fois (par exemple monter au filet après ton lob).",
          volley: "Ose ton risque calculé au moins 3 fois (par exemple un service plus tendu en zone choisie).",
        },
        bilan: "Comment t'es-tu senti en osant, au-delà du résultat ?",
      },
      {
        jour: 7,
        theme: "Ma routine de confiance",
        intro: "Tu assembles tes preuves, tes forces et ta phrase en une routine courte d'avant-match.",
        exercice: {
          titre: "Ma routine de confiance",
          duree: 7,
          etapes: [
            "Relis ta meilleure preuve.",
            "Rappelle-toi tes 3 forces.",
            "Dis ta phrase de soutien et ton mot-clé.",
            "Prends ta posture de joueur prêt.",
          ],
        },
        mission: {
          all: "Fais ta routine de confiance avant ton prochain match, puis fais ton bilan dans l'app.",
        },
        bilan: "Quelle partie de ta routine veux-tu garder pour la suite ?",
      },
    ],
  },
  {
    id: "pression",
    titre: "Mieux vivre la pression",
    sousTitre: "7 jours pour jouer les moments clés",
    description: "Transforme l'activation en énergie utile et prépare tes réponses aux moments clés.",
    jours: [
      {
        jour: 1,
        theme: "Comprendre l'activation",
        intro: "Le cœur qui accélère, c'est ton corps qui se prépare. Le but : un niveau utile, pas le calme absolu.",
        exercice: {
          titre: "Mon niveau d'activation",
          duree: 6,
          exerciceId: "activation-utile",
          etapes: [
            "À quel niveau d'énergie (1 à 5) as-tu joué ton meilleur match ?",
            "Décris les sensations de ce niveau.",
            "Note une action pour monter et une pour descendre d'un cran.",
          ],
        },
        mission: {
          all: "Avant et pendant la séance, évalue ton niveau d'énergie de 1 à 5, trois fois.",
        },
        bilan: "Quel niveau d'énergie te convenait le mieux aujourd'hui ?",
      },
      {
        jour: 2,
        theme: "Respirer sous tension",
        intro: "Sous pression, le souffle se raccourcit. L'expiration longue te redonne la main.",
        exercice: {
          titre: "Le soupir qui relâche",
          duree: 5,
          exerciceId: "double-inspiration",
          etapes: [
            "Fais 3 soupirs : deux inspirations par le nez, une longue expiration.",
            "Fais 6 cycles de respiration 4-6.",
            "Refais-le après 20 sauts sur place, cœur rapide.",
          ],
        },
        mission: {
          all: "Sur chaque point important de la séance, fais un soupir qui relâche avant de jouer.",
        },
        bilan: "Arrivais-tu à respirer longuement même avec le cœur rapide ?",
      },
      {
        jour: 3,
        theme: "Cible d'attention",
        intro: "Sous pression, l'attention s'éparpille. Tu lui donnes une cible concrète.",
        exercice: {
          titre: "Zoom large, zoom serré",
          duree: 5,
          exerciceId: "large-etroit",
          etapes: [
            "Alterne attention large et attention serrée toutes les 10 secondes.",
            "Choisis ta cible pour les moments clés : la balle, ton plan, ton partenaire.",
            "Écris-la.",
          ],
        },
        mission: {
          all: "Sur les points importants, pose ton attention sur ta cible choisie.",
          padel: "Sur les points importants, pose ton attention sur la première balle du point.",
          volley: "Sur les points importants, pose ton attention sur ta tâche de poste.",
        },
        bilan: "Ta cible d'attention t'a-t-elle aidé à rester dans le point ?",
      },
      {
        jour: 4,
        theme: "Plan « si… alors… »",
        intro: "Un plan décidé à froid s'applique bien plus facilement à chaud.",
        exercice: {
          titre: "Mes plans « si… alors… »",
          duree: 7,
          exerciceId: "si-alors",
          etapes: [
            "Liste 3 situations de pression.",
            "Écris un plan « si… alors… » pour chacune.",
            "Lis-les à voix haute deux fois.",
          ],
        },
        mission: {
          all: "Applique au moins un de tes plans « si… alors… » pendant la séance.",
        },
        bilan: "Quel plan as-tu appliqué, et qu'a-t-il changé ?",
      },
      {
        jour: 5,
        theme: "Simuler la pression à l'entraînement",
        intro: "Plus tu répètes ta routine sous tension, plus elle devient naturelle en match.",
        exercice: {
          titre: "Préparer ma simulation",
          duree: 6,
          exerciceId: "simulation-pression",
          etapes: [
            "Choisis un exercice d'entraînement simple.",
            "Invente un enjeu (série de réussites, petit défi).",
            "Prévois ta routine avant chaque tentative.",
          ],
        },
        mission: {
          all: "Fais ta simulation de pression à l'entraînement et note ce qui t'a aidé.",
          padel: "Jouez des jeux qui commencent à 30-40, avec ta routine entre chaque point.",
          volley: "Fais une série de 10 services avec enjeu, routine complète à chaque fois.",
        },
        bilan: "Qu'est-ce qui t'a aidé à rester dans ta routine sous l'enjeu ?",
      },
      {
        jour: 6,
        theme: "Gérer les moments clés",
        intro: "Balle de break, tie-break, fin de set : tu prépares un plan pour chacun.",
        exercice: {
          titre: "Mes moments clés",
          duree: 7,
          etapes: [
            "Choisis deux moments clés de ton sport.",
            "Pour chacun, écris ton plan tactique simple et ta phrase pour ton partenaire ou ton équipe.",
            "Ouvre le mode « Je suis sous pression » et parcours ces deux situations.",
          ],
        },
        mission: {
          all: "Utilise le mode « Je suis sous pression » sur un moment clé de ton prochain match.",
          padel: "Sur une balle de break ou un tie-break, applique ton plan préparé.",
          volley: "Sur une fin de set ou une série adverse, applique ton plan préparé.",
        },
        bilan: "Sur le moment clé, as-tu joué ton processus habituel ?",
      },
      {
        jour: 7,
        theme: "Routine complète de moment clé",
        intro: "Normaliser, respirer, cibler, planifier, s'engager : ta routine de moment clé.",
        exercice: {
          titre: "Ma routine de moment clé",
          duree: 8,
          etapes: [
            "Écris ta routine en 5 temps avec tes propres mots.",
            "Visualise un moment clé et applique-la, à vitesse réelle.",
            "Inclus une erreur et ton rebond.",
          ],
        },
        mission: {
          all: "Joue un match en appliquant ta routine de moment clé, puis fais ton bilan dans l'app.",
        },
        bilan: "Comment as-tu vécu les moments clés par rapport à d'habitude ?",
      },
    ],
  },
  {
    id: "concentration",
    titre: "Rester concentré",
    sousTitre: "7 jours pour jouer action par action",
    description: "Apprends à diriger ton attention et à revenir au présent quand elle s'échappe.",
    jours: [
      {
        jour: 1,
        theme: "Ancrage sur la balle",
        intro: "La concentration, c'est une attention que tu diriges. On commence par la poser sur la balle.",
        exercice: {
          titre: "Ancrage sur la balle",
          duree: 5,
          exerciceId: "ancrage-balle",
          etapes: [
            "Observe une balle pendant 3 minutes.",
            "Quand ton esprit part, remarque-le et reviens à un détail.",
            "Compte combien de fois tu es revenu : chaque retour est une répétition réussie.",
          ],
        },
        mission: {
          all: "Pendant la séance, regarde la balle jusqu'au contact sur chaque frappe.",
          volley: "Pendant la séance, regarde le ballon jusqu'au contact sur chaque touche.",
        },
        bilan: "À quels moments ton attention partait-elle le plus ?",
      },
      {
        jour: 2,
        theme: "Attention large vs étroite",
        intro: "Lire le jeu demande une attention large, frapper une attention étroite. Tu apprends à basculer.",
        exercice: {
          titre: "Zoom large, zoom serré",
          duree: 5,
          exerciceId: "large-etroit",
          etapes: [
            "Alterne large et serré toutes les 10 secondes pendant 4 minutes.",
            "Associe un mot à chaque mode : « Large » et « Balle ».",
          ],
        },
        mission: {
          all: "Dis-toi « Large » en te replaçant, « Balle » au moment de jouer.",
          padel: "« Large » pour lire la position des adversaires, « Balle » à la frappe.",
          volley: "« Large » pour lire le passeur adverse, « Balle » à la touche.",
        },
        bilan: "Arrivais-tu à basculer d'un mode à l'autre ?",
      },
      {
        jour: 3,
        theme: "Mot-clé",
        intro: "Un mot court peut te ramener dans le présent en une seconde.",
        exercice: {
          titre: "Choisir mon mot-clé",
          duree: 5,
          exerciceId: "mot-cle",
          etapes: [
            "Rappelle-toi un moment où tu étais pleinement concentré.",
            "Choisis le mot qui décrit cette sensation.",
            "Enregistre-le dans ton profil.",
          ],
        },
        mission: {
          all: "Dis ton mot-clé avant chaque point de la séance.",
        },
        bilan: "Ton mot-clé t'a-t-il aidé à revenir dans le point ?",
      },
      {
        jour: 4,
        theme: "Routine entre les points",
        intro: "Entre deux points, ta routine protège ta concentration.",
        exercice: {
          titre: "Ma routine en 4 temps",
          duree: 6,
          etapes: [
            "Écris ce que tu fais pour : Relâcher, Lire, Décider, Engager.",
            "Chronomètre-la : elle doit tenir dans le temps disponible.",
            "Répète-la 5 fois.",
          ],
        },
        mission: {
          all: "Fais ta routine entre chaque point d'un set entier.",
          padel: "Fais ta routine dans les 20 secondes entre chaque point d'un set.",
          volley: "Fais ta routine express entre chaque action d'un set.",
        },
        bilan: "Ta routine a-t-elle tenu sur tout le set ?",
      },
      {
        jour: 5,
        theme: "Gérer les distractions",
        intro: "Public, adversaire, bruit : les distractions existent. Tu prépares où ramener ton attention.",
        exercice: {
          titre: "Ma liste de distractions",
          duree: 6,
          etapes: [
            "Liste tes 3 principales distractions en match.",
            "Pour chacune, écris où tu ramènes ton attention : « Je regarde mon cordage », « Je dis mon mot-clé ».",
            "Imagine chaque distraction et entraîne-toi à revenir.",
          ],
        },
        mission: {
          all: "Quand une distraction arrive, remarque-la et ramène ton attention sur ta cible.",
        },
        bilan: "Quelle distraction as-tu le mieux gérée ?",
      },
      {
        jour: 6,
        theme: "Retour au présent après une coupure",
        intro: "Temps mort, changement de côté, pause : tu prépares ton retour au jeu.",
        exercice: {
          titre: "Ma routine de reprise",
          duree: 5,
          etapes: [
            "Écris ce que tu fais pendant une coupure : récupérer, faire le point, choisir une intention.",
            "Écris ton signal de reprise : un geste, ton mot-clé.",
            "Répète-la deux fois en imaginant une coupure.",
          ],
        },
        mission: {
          all: "Après chaque coupure, applique ta routine de reprise.",
          padel: "À chaque changement de côté, applique ta routine de reprise.",
          volley: "Après chaque temps mort ou changement de set, applique ta routine de reprise.",
        },
        bilan: "Étais-tu dans le jeu dès le premier point après la coupure ?",
      },
      {
        jour: 7,
        theme: "Match en pleine conscience",
        intro: "Tu joues un match entier, action par action, en revenant au présent autant de fois que nécessaire.",
        exercice: {
          titre: "Préparer mon match présent",
          duree: 6,
          etapes: [
            "Relis ta routine entre les points et ton mot-clé.",
            "Fais 3 minutes d'ancrage sur la balle.",
            "Décide de ton intention : « Je joue le point présent. »",
          ],
        },
        mission: {
          all: "Joue un match entier action par action, puis fais ton bilan dans l'app.",
        },
        bilan: "Sur 10, à quel point étais-tu présent pendant ce match ?",
      },
    ],
  },
];
