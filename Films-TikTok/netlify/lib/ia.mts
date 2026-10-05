/** Repérage des films et séries par Google Gemini (offre gratuite), qui regarde la vidéo avec le son. */
import { demanderAGemini } from "./gemini.mts";
import type { InfosVideo } from "./sources.mts";

export interface OeuvreTrouvee {
  titre: string;
  titre_original: string;
  type: "film" | "serie";
  annee: string;
  genres: string[];
  resume: string;
  plateformes: string[];
  pourquoi: string;
}

export interface Analyse {
  sujet: string;
  oeuvres: OeuvreTrouvee[];
}

const texte = { type: "string" };
const liste = { type: "array", items: texte };
const SCHEMA = {
  type: "object",
  properties: {
    sujet: texte,
    oeuvres: {
      type: "array",
      items: {
        type: "object",
        properties: {
          titre: texte,
          titre_original: texte,
          type: { type: "string", enum: ["film", "serie"] },
          annee: texte,
          genres: liste,
          resume: texte,
          plateformes: liste,
          pourquoi: texte,
        },
        required: ["titre", "titre_original", "type", "annee", "genres", "resume", "plateformes", "pourquoi"],
      },
    },
  },
  required: ["sujet", "oeuvres"],
};

const CONSIGNES = `Tu aides une personne à se constituer une liste de films et de séries à voir, à partir de vidéos de recommandations (TikTok, Instagram, YouTube…) ou de pages web.
On te donne les informations d'une vidéo ou d'une page : la description du créateur, ses sous-titres, le contenu de la page, et souvent la vidéo elle-même (images et son).

Repère TOUS les films et séries recommandés ou présentés : cités à l'oral, écrits à l'écran, visibles sur une affiche ou un extrait, ou listés dans la description.
Pour chacun :
- titre : le titre sous lequel il est connu en France (titre français s'il existe).
- titre_original : le titre original ("" s'il est identique au titre).
- type : "film" ou "serie" (mini-séries, animés en épisodes et docu-séries comptent comme "serie").
- annee : année de sortie (première saison pour une série), d'après tes connaissances ; "" si tu n'es pas sûr de quelle œuvre il s'agit.
- genres : 1 à 3 genres en français (ex. Thriller, Comédie, Science-fiction, Drame, Horreur, Animation, Documentaire, Romance, Action, Policier).
- resume : 1 ou 2 phrases de synopsis en français, sans spoiler.
- plateformes : seulement celles citées dans la vidéo ou sa description (ex. Netflix, Prime Video, Disney+, Canal+, Apple TV+, Max) ; sinon liste vide.
- pourquoi : l'avis précis du créateur sur ce titre (ex. « le meilleur thriller de la décennie »), en une phrase ; "" s'il se contente de le citer.
Ne liste pas une œuvre seulement mentionnée en comparaison (« dans le style de… ») sauf si elle est aussi recommandée. Pas de doublons.
sujet : le thème de la vidéo en quelques mots (ex. « Thrillers psychologiques à voir sur Netflix »).
Si la vidéo ne recommande aucun film ni série, renvoie une liste vide.`;

export async function reperer(infos: InfosVideo, video: Buffer | null, texteManuel = ""): Promise<Analyse> {
  return demanderAGemini<Analyse>({ consignes: CONSIGNES, schema: SCHEMA, infos, video, texteManuel });
}
