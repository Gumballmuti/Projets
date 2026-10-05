/** Rédaction de la recette par Google Gemini (offre gratuite), qui peut regarder la vidéo avec le son. */
import { demanderAGemini } from "./gemini.mts";
import type { InfosVideo } from "./sources.mts";

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

const CONSIGNES = `Tu aides une personne à archiver les recettes qu'elle trouve sur les réseaux sociaux (TikTok, Instagram, YouTube…) et sur le web.
On te donne les informations d'une vidéo ou d'une page : la description du créateur, ses sous-titres, le contenu de la page, et souvent la vidéo elle-même (images et son).
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

export async function redigerRecette(infos: InfosVideo, video: Buffer | null, texteManuel = ""): Promise<Recette> {
  return demanderAGemini<Recette>({ consignes: CONSIGNES, schema: SCHEMA, infos, video, texteManuel });
}
