/** Rédaction de la recette par Google Gemini (offre gratuite), qui peut regarder la vidéo avec le son. */
import { createPartFromUri, FileState, GoogleGenAI, type Part } from "@google/genai";
import { ErreurExtraction, type InfosVideo } from "./tiktok.mts";

export interface Recette {
  complete: boolean;
  titre: string;
  portions: string;
  temps_preparation: string;
  temps_cuisson: string;
  ingredients: { groupe: string; elements: string[] }[];
  etapes: string[];
  astuces: string[];
  remarque: string;
}

const texte = { type: "string" };
const liste = { type: "array", items: texte };
const SCHEMA = {
  type: "object",
  properties: {
    complete: { type: "boolean" },
    titre: texte,
    portions: texte,
    temps_preparation: texte,
    temps_cuisson: texte,
    ingredients: {
      type: "array",
      items: { type: "object", properties: { groupe: texte, elements: liste }, required: ["groupe", "elements"] },
    },
    etapes: liste,
    astuces: liste,
    remarque: texte,
  },
  required: ["complete", "titre", "portions", "temps_preparation", "temps_cuisson", "ingredients", "etapes", "astuces", "remarque"],
};

const CONSIGNES = `Tu aides une personne à archiver les recettes qu'elle trouve sur TikTok.
On te donne les informations d'une vidéo : la description du créateur, ses sous-titres, et souvent la vidéo elle-même (images et son).
Rédige la recette en français, claire et prête à cuisiner.

Règles :
- titre : reprends le nom de la recette tel que le créateur l'a appelée (dans la description ou la vidéo). S'il n'en donne aucun, propose un nom court et descriptif.
- ingredients : avec les quantités quand elles sont connues (dites, écrites à l'écran ou dans la description). Regroupe-les par partie de la recette (pâte, sauce, garniture…) seulement si la recette en a plusieurs ; sinon un seul groupe avec groupe = "".
- etapes : une action par étape, dans l'ordre, avec températures et durées.
- portions, temps_preparation, temps_cuisson : "" si inconnu, ne les invente pas.
- astuces : conseils donnés par le créateur (peut être vide).
- N'invente pas d'ingrédients absents des sources. Si une quantité n'est pas donnée, écris l'ingrédient sans quantité ou avec « (quantité non précisée) ». Garde les unités telles quelles : g, ml, c. à s., etc.
- remarque : une phrase courte sur ce qui manque ou a été estimé, sinon "".
- complete : true si les sources suffisent pour cuisiner la recette, false sinon.
- Si la vidéo ne contient aucune recette, mets complete = false, titre = le sujet de la vidéo, et laisse les listes vides.`;

const LIMITE_EN_LIGNE = 14 * 1024 * 1024; // au-delà, la vidéo passe par l'envoi de fichiers de Gemini

export async function redigerRecette(infos: InfosVideo, video: Buffer | null, texteManuel = ""): Promise<Recette> {
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

  const reponse = await ai.models.generateContent({
    model: Netlify.env.get("GEMINI_MODEL") || "gemini-flash-latest",
    contents: [{ role: "user", parts: parties }],
    config: {
      systemInstruction: CONSIGNES,
      responseMimeType: "application/json",
      responseJsonSchema: SCHEMA,
    },
  });
  try {
    return JSON.parse(reponse.text ?? "") as Recette;
  } catch {
    throw new ErreurExtraction("Gemini n'a pas pu rédiger cette recette.");
  }
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
