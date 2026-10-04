/** Analyse complète d'une fiche : lecture TikTok, rédaction par Gemini, enregistrement. */
import { cleImage, ecrireFiche, lireFiche, magasin } from "./commun.mts";
import { redigerRecette } from "./ia.mts";
import { infosVideo, telechargerVideo } from "./tiktok.mts";

export async function analyser(id: string) {
  const fiche = await lireFiche(id);
  if (!fiche || fiche.etape === "analyse") return; // déjà prise en charge
  await ecrireFiche({ ...fiche, etape: "analyse" });

  try {
    const infos = await infosVideo(fiche.url);
    let video: Buffer | null = null;
    let remarqueVideo = "";
    try {
      video = await telechargerVideo(infos);
    } catch {
      remarqueVideo = "La vidéo n'a pas pu être regardée, seule la description a été lue.";
    }
    const recette = await redigerRecette(infos, video, fiche.texte ?? "");
    if (remarqueVideo && !recette.complete) {
      recette.remarque = [recette.remarque, remarqueVideo].filter(Boolean).join(" ");
    }
    if (infos.miniature) {
      await magasin().set(cleImage(id), infos.miniature.donnees, { metadata: { type: infos.miniature.type } });
    }
    await ecrireFiche({
      ...fiche,
      statut: "ok",
      etape: undefined,
      erreur: null,
      url: infos.url,
      titre: recette.titre,
      auteur: infos.auteur,
      source: video ? "description + vidéo" : "description",
      donnees: recette as unknown as Record<string, unknown>,
      image: fiche.image || !!infos.miniature,
    });
  } catch (e) {
    await ecrireFiche({ ...fiche, statut: "erreur", etape: undefined, erreur: String((e as Error)?.message ?? e).slice(0, 500) });
  }
}
