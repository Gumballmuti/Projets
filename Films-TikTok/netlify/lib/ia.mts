/** Repérage des films et séries par Google Gemini (offre gratuite), qui regarde la vidéo avec le son. */
import { type ApiError, createPartFromUri, FileState, GoogleGenAI, type Part } from "@google/genai";
import { ErreurExtraction, type InfosVideo } from "./tiktok.mts";

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

const CONSIGNES = `Tu aides une personne à se constituer une liste de films et de séries à voir, à partir de vidéos TikTok de recommandations.
On te donne les informations d'une vidéo : la description du créateur, ses sous-titres, et souvent la vidéo elle-même (images et son).

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

const LIMITE_EN_LIGNE = 14 * 1024 * 1024; // au-delà, la vidéo passe par l'envoi de fichiers de Gemini

export async function reperer(infos: InfosVideo, video: Buffer | null, texteManuel = ""): Promise<Analyse> {
  const cle = Netlify.env.get("GEMINI_API_KEY");
  if (!cle) throw new ErreurExtraction("La clé GEMINI_API_KEY n'est pas configurée dans Netlify.");
  const ai = new GoogleGenAI({ apiKey: cle });

  const sources = [
    `Créateur : ${infos.auteur || "inconnu"}`,
    `Description de la vidéo :\n${infos.description || "(vide)"}`,
    `Sous-titres de la vidéo :\n${infos.sousTitres || "(aucun)"}`,
  ];
  if (texteManuel) sources.push(`Texte ajouté à la main :\n${texteManuel}`);

  const parties: Part[] = [];
  if (video) parties.push(await partieVideo(ai, video));
  parties.push({ text: sources.join("\n\n") });

  const reponse = await generer(ai, parties);
  try {
    return JSON.parse(reponse.text ?? "") as Analyse;
  } catch {
    throw new ErreurExtraction("Gemini n'a pas pu lire cette vidéo.");
  }
}

// Si un modèle est surchargé (503), au bout de son quota gratuit (429) ou retiré (404), on passe au suivant.
const MODELES = ["gemini-3.8-flash", "gemini-flash-latest", "gemini-3.5-flash", "gemini-flash-lite-latest"];

async function generer(ai: GoogleGenAI, parties: Part[]) {
  const choisi = Netlify.env.get("GEMINI_MODEL");
  const modeles = choisi ? [choisi, ...MODELES.filter((m) => m !== choisi)] : MODELES;
  let derniere: unknown;
  for (const model of modeles) {
    try {
      return await ai.models.generateContent({
        model,
        contents: [{ role: "user", parts: parties }],
        config: { systemInstruction: CONSIGNES, responseMimeType: "application/json", responseJsonSchema: SCHEMA },
      });
    } catch (e) {
      derniere = e;
      if (![404, 429, 500, 503].includes((e as ApiError).status)) break;
    }
  }
  const statut = (derniere as ApiError)?.status;
  throw new ErreurExtraction(
    statut === 429 ? "Quota gratuit de Gemini atteint pour aujourd'hui, réessaie plus tard."
      : statut === 503 ? "Gemini est surchargé en ce moment, réessaie dans quelques minutes."
      : `Gemini a renvoyé une erreur : ${String((derniere as Error)?.message ?? derniere).slice(0, 200)}`,
  );
}

async function partieVideo(ai: GoogleGenAI, video: Buffer): Promise<Part> {
  if (video.length <= LIMITE_EN_LIGNE) {
    return { inlineData: { mimeType: "video/mp4", data: video.toString("base64") } };
  }
  let fichier = await ai.files.upload({ file: new Blob([new Uint8Array(video)], { type: "video/mp4" }), config: { mimeType: "video/mp4" } });
  for (let i = 0; i < 30 && fichier.state === FileState.PROCESSING; i++) {
    await new Promise((ok) => setTimeout(ok, 2000));
    fichier = await ai.files.get({ name: fichier.name! });
  }
  if (fichier.state !== FileState.ACTIVE) throw new ErreurExtraction("Gemini n'a pas réussi à lire la vidéo.");
  return createPartFromUri(fichier.uri!, "video/mp4");
}
