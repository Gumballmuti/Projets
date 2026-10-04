import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { ErreurExtraction, type InfosVideo } from "./tiktok.mts";

const MODELE = "claude-opus-5-5";

export const Recette = z.object({
  complete: z.boolean(),
  titre: z.string(),
  portions: z.string(),
  temps_preparation: z.string(),
  temps_cuisson: z.string(),
  ingredients: z.array(z.object({ groupe: z.string(), elements: z.array(z.string()) })),
  etapes: z.array(z.string()),
  astuces: z.array(z.string()),
  remarque: z.string(),
});
export type Recette = z.infer<typeof Recette>;

const CONSIGNES = `Tu aides une personne à archiver les recettes qu'elle trouve sur TikTok.
On te donne les informations d'une vidéo (description du créateur, sous-titres, et parfois des images extraites de la vidéo).
Rédige la recette en français, claire et prête à cuisiner.

Règles :
- titre : reprends le nom de la recette tel que le créateur l'a appelée (dans la description ou la vidéo). S'il n'en donne aucun, propose un nom court et descriptif.
- ingredients : avec les quantités quand elles sont connues. Regroupe-les par partie de la recette (pâte, sauce, garniture…) seulement si la recette en a plusieurs ; sinon un seul groupe avec groupe = "".
- etapes : une action par étape, dans l'ordre, avec températures et durées.
- portions, temps_preparation, temps_cuisson : "" si inconnu, ne les invente pas.
- astuces : conseils donnés par le créateur (peut être vide).
- N'invente pas d'ingrédients absents des sources. Si une quantité n'est pas donnée, écris l'ingrédient sans quantité ou avec « (quantité non précisée) ». Garde les unités telles quelles : g, ml, c. à s., etc.
- remarque : une phrase courte sur ce qui manque ou a été estimé, sinon "".
- complete : true si les sources suffisent pour cuisiner la recette (liste d'ingrédients et étapes identifiables), false sinon.
- Si la vidéo ne contient aucune recette, mets complete = false, titre = le sujet de la vidéo, et laisse les listes vides.`;

export async function demanderAClaude(infos: InfosVideo, images: Buffer[], texteManuel = ""): Promise<Recette> {
  const client = new Anthropic({ apiKey: Netlify.env.get("ANTHROPIC_API_KEY") });
  const sources = [
    `Créateur : ${infos.auteur || "inconnu"}`,
    `Description de la vidéo :\n${infos.description || "(vide)"}`,
    `Sous-titres / paroles de la vidéo :\n${infos.sousTitres || "(aucun)"}`,
  ];
  if (texteManuel) sources.push(`Texte ajouté à la main :\n${texteManuel}`);

  const contenu: Anthropic.Beta.BetaContentBlockParam[] = [];
  if (images.length) {
    contenu.push({ type: "text", text: `Voici ${images.length} images extraites de la vidéo, dans l'ordre chronologique :` });
    for (const image of images) {
      contenu.push({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: image.toString("base64") } });
    }
  }
  contenu.push({ type: "text", text: sources.join("\n\n") });

  const reponse = await client.beta.messages.parse({
    model: MODELE,
    max_tokens: 16000,
    system: CONSIGNES,
    messages: [{ role: "user", content: contenu }],
    output_config: { effort: "medium", format: betaZodOutputFormat(Recette) },
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
  });
  if (reponse.stop_reason === "refusal" || !reponse.parsed_output) {
    throw new ErreurExtraction("Claude n'a pas pu rédiger cette recette.");
  }
  return reponse.parsed_output;
}
