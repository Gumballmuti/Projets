/** Analyse complète d'une vidéo : lecture (lien ou fichier), repérage par Gemini, ajout à la bibliothèque. */
import {
  type Oeuvre, cleDe, cleImage, ecrireOeuvre, ecrireVideo, lireOeuvre, lireVideo, magasin,
} from "./commun.mts";
import { reperer } from "./ia.mts";
import { effacerFichier, preparerVideo } from "./fichiers.mts";

export async function analyser(id: string) {
  const video = await lireVideo(id);
  if (!video || video.etape === "analyse") return; // déjà prise en charge
  await ecrireVideo({ ...video, etape: "analyse" });

  try {
    const { infos, video: fichier } = await preparerVideo(video);
    const analyse = await reperer(infos, fichier, video.texte ?? "");

    const cles: string[] = [];
    for (const trouvee of analyse.oeuvres) {
      const cle = cleDe(trouvee);
      if (!cle || cles.includes(cle)) continue;
      cles.push(cle);
      const existante = await lireOeuvre(cle);
      const oeuvre: Oeuvre = existante
        ? {
            ...existante,
            plateformes: [...new Set([...existante.plateformes, ...trouvee.plateformes])],
            pourquoi: existante.pourquoi || trouvee.pourquoi,
            videos: [...new Set([...existante.videos, id])],
          }
        : { ...trouvee, cle, vu: false, videos: [id], ajoute_le: new Date().toISOString() };
      await ecrireOeuvre(oeuvre);
    }

    if (infos.miniature) {
      await magasin().set(cleImage(id), infos.miniature.donnees, { metadata: { type: infos.miniature.type } });
    }
    await ecrireVideo({
      ...video,
      statut: "ok",
      etape: undefined,
      erreur: cles.length ? null : "Aucun film ni série trouvé dans cette vidéo.",
      url: infos.url || video.url,
      plateforme: infos.plateforme,
      sujet: analyse.sujet,
      auteur: infos.auteur || video.auteur,
      oeuvres: cles,
      image: video.image || !!infos.miniature,
    });
    // La vidéo envoyée n'est plus utile une fois analysée (place limitée chez Netlify).
    if (video.fichier) await effacerFichier(id);
  } catch (e) {
    await ecrireVideo({ ...video, statut: "erreur", etape: undefined, erreur: String((e as Error)?.message ?? e).slice(0, 500) });
  }
}
