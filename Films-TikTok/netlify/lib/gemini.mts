/**
 * Appel à Google Gemini (offre gratuite), qui regarde la vidéo avec le son.
 * Identique dans les deux apps : chacune lui donne ses consignes et le format de réponse attendu.
 */
import { type ApiError, createPartFromUri, FileState, GoogleGenAI, type Part } from "@google/genai";
import { ErreurExtraction, type InfosVideo } from "./sources.mts";

const LIMITE_EN_LIGNE = 14 * 1024 * 1024; // au-delà, la vidéo passe par l'envoi de fichiers de Gemini

// Si un modèle est surchargé (503), au bout de son quota gratuit (429) ou retiré (404), on passe au suivant.
const MODELES = ["gemini-3.8-flash", "gemini-flash-latest", "gemini-3.5-flash", "gemini-flash-lite-latest"];

export async function demanderAGemini<T>(options: {
  consignes: string;
  schema: object;
  infos: InfosVideo;
  video: Buffer | null;
  texteManuel?: string;
}): Promise<T> {
  const { consignes, schema, infos, video, texteManuel } = options;
  const cle = Netlify.env.get("GEMINI_API_KEY");
  if (!cle) throw new ErreurExtraction("La clé GEMINI_API_KEY n'est pas configurée dans Netlify.");
  const ai = new GoogleGenAI({ apiKey: cle });

  const sources = [
    `Plateforme : ${infos.plateforme}`,
    `Créateur : ${infos.auteur || "inconnu"}`,
    `Description de la vidéo :\n${infos.description || "(vide)"}`,
    `Sous-titres de la vidéo :\n${infos.sousTitres || "(aucun)"}`,
  ];
  if (infos.textePage) sources.push(`Contenu de la page :\n${infos.textePage}`);
  if (texteManuel) sources.push(`Texte ajouté à la main :\n${texteManuel}`);

  const parties: Part[] = [];
  if (video) parties.push(await partieVideo(ai, video));
  else if (infos.youtube) parties.push({ fileData: { fileUri: infos.youtube, mimeType: "video/*" } });
  parties.push({ text: sources.join("\n\n") });

  const reponse = await generer(ai, parties, consignes, schema);
  try {
    return JSON.parse(reponse.text ?? "") as T;
  } catch {
    throw new ErreurExtraction("Gemini n'a pas pu lire cette vidéo.");
  }
}

async function generer(ai: GoogleGenAI, parties: Part[], consignes: string, schema: object) {
  const choisi = Netlify.env.get("GEMINI_MODEL");
  const modeles = choisi ? [choisi, ...MODELES.filter((m) => m !== choisi)] : MODELES;
  let derniere: unknown;
  // Deux tours : les surcharges de Gemini sont souvent passagères.
  for (let tour = 0; tour < 2; tour++) {
    if (tour) await new Promise((ok) => setTimeout(ok, 3000));
    for (const model of modeles) {
      try {
        return await ai.models.generateContent({
          model,
          contents: [{ role: "user", parts: parties }],
          config: { systemInstruction: consignes, responseMimeType: "application/json", responseJsonSchema: schema },
        });
      } catch (e) {
        derniere = e;
        if (![404, 429, 500, 503].includes((e as ApiError).status)) break;
      }
    }
    if (![429, 500, 503].includes((derniere as ApiError)?.status)) break;
  }
  const statut = (derniere as ApiError)?.status;
  throw new ErreurExtraction(
    statut === 429 ? "Quota gratuit de Gemini atteint pour aujourd'hui, réessaie plus tard."
      : statut === 503 ? "Gemini est surchargé en ce moment, réessaie dans quelques minutes."
      : `Gemini a renvoyé une erreur : ${String((derniere as Error)?.message ?? derniere).slice(0, 200)}`,
  );
}

async function partieVideo(ai: GoogleGenAI, video: Buffer): Promise<Part> {
  const mimeType = typeVideo(video);
  if (video.length <= LIMITE_EN_LIGNE) {
    return { inlineData: { mimeType, data: video.toString("base64") } };
  }
  let fichier = await ai.files.upload({ file: new Blob([new Uint8Array(video)], { type: mimeType }), config: { mimeType } });
  for (let i = 0; i < 60 && fichier.state === FileState.PROCESSING; i++) {
    await new Promise((ok) => setTimeout(ok, 2000));
    fichier = await ai.files.get({ name: fichier.name! });
  }
  if (fichier.state !== FileState.ACTIVE) throw new ErreurExtraction("Gemini n'a pas réussi à lire la vidéo.");
  return createPartFromUri(fichier.uri!, mimeType);
}

/** MP4 ou MOV (vidéos de l'iPhone) d'après les premiers octets du fichier. */
function typeVideo(video: Buffer): string {
  const marque = video.subarray(8, 12).toString("latin1");
  if (marque === "qt  ") return "video/quicktime";
  if (video.subarray(0, 4).toString("hex") === "1a45dfa3") return "video/webm";
  return "video/mp4";
}
