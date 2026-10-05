/** Analyse complète d'une fiche : lecture de la vidéo, rédaction par Gemini, enregistrement. */
import { cleImage, ecrireFiche, lireFiche, magasin } from "./commun.mts";
import { effacerFichier, preparerVideo } from "./fichiers.mts";
import { redigerRecette } from "./ia.mts";

export async function analyser(id: string) {
  const fiche = await lireFiche(id);
  if (!fiche || fiche.etape === "analyse") return; // déjà prise en charge
  await ecrireFiche({ ...fiche, etape: "analyse" });

  try {
    const { infos, video } = await preparerVideo(fiche);
    const vue = !!video || !!infos.youtube;
    const recette = await redigerRecette(infos, video, fiche.texte ?? "");
    if (!vue && !fiche.fichier && !recette.complete) {
      recette.remarque = [recette.remarque, "La vidéo n'a pas pu être regardée, seule la description a été lue."]
        .filter(Boolean).join(" ");
    }
    if (infos.miniature) {
      await magasin().set(cleImage(id), infos.miniature.donnees, { metadata: { type: infos.miniature.type } });
    }
    await ecrireFiche({
      ...fiche,
      statut: "ok",
      etape: undefined,
      erreur: null,
      url: infos.url || fiche.url,
      plateforme: infos.plateforme,
      titre: recette.titre,
      auteur: infos.auteur || fiche.auteur,
      source: fiche.fichier ? "vidéo envoyée" : vue ? "description + vidéo" : "description",
      donnees: recette as unknown as Record<string, unknown>,
      image: fiche.image || !!infos.miniature,
    });
    // La vidéo envoyée n'est plus utile une fois la recette écrite (place limitée chez Netlify).
    if (fiche.fichier) await effacerFichier(id);
  } catch (e) {
    await ecrireFiche({ ...fiche, statut: "erreur", etape: undefined, erreur: String((e as Error)?.message ?? e).slice(0, 500) });
  }
}
