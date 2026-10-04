/** Analyse longue (jusqu'à 15 min) : lit la vidéo TikTok et fait rédiger la recette par Claude. */
import type { Context } from "@netlify/functions";
import ffmpegPath from "ffmpeg-static";
import { demanderAClaude } from "../lib/claude.mts";
import { cleImage, egal, ecrireFiche, jeton, lireFiche, magasin } from "../lib/commun.mts";
import { imagesDeLaVideo, infosVideo } from "../lib/tiktok.mts";

export default async (req: Request, _context: Context) => {
  if (!egal(req.headers.get("x-cle") ?? "", jeton())) return;
  const { id, video, texte } = await req.json();
  const fiche = await lireFiche(id);
  if (!fiche) return;

  try {
    const infos = await infosVideo(fiche.url);
    let recette = video ? null : await demanderAClaude(infos, [], texte);
    let source = "description";
    if (!recette || !recette.complete) {
      try {
        const images = await imagesDeLaVideo(infos, ffmpegPath as unknown as string);
        recette = await demanderAClaude(infos, images, texte);
        source = "vidéo";
      } catch (e) {
        // Vidéo inaccessible : on garde ce que la description a donné, s'il y a quelque chose.
        if (!recette?.etapes.length) throw e;
        recette.remarque = [recette.remarque, "La vidéo n'a pas pu être regardée."].filter(Boolean).join(" ");
      }
    }
    if (infos.miniature) {
      await magasin().set(cleImage(id), infos.miniature.donnees, { metadata: { type: infos.miniature.type } });
    }
    await ecrireFiche({
      ...fiche,
      statut: "ok",
      erreur: null,
      url: infos.url,
      titre: recette.titre,
      auteur: infos.auteur,
      source,
      donnees: recette,
      image: fiche.image || !!infos.miniature,
    });
  } catch (e) {
    await ecrireFiche({ ...fiche, statut: "erreur", erreur: String((e as Error)?.message ?? e).slice(0, 500) });
  }
};
