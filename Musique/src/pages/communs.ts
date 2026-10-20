import * as audius from "../audius";
import { useBiblio } from "../etat/Bibliotheque";
import { useLecteur } from "../etat/Lecteur";
import { useToast } from "../etat/Toasts";
import type { Contexte, Recent, Titre } from "../types";

/** Les infos de lecture (« Lecture en cours depuis… », récents) de chaque type de collection. */
export function contexteDe(type: Recent["type"], id: string, nom: string, image = "", sous_titre = ""): Contexte {
  const lien = type === "maPlaylist" ? `/ma-playlist/${id}` : type === "playlist" ? `/playlist/${id}`
    : type === "artiste" ? `/artiste/${id}` : type === "genre" ? `/genre/${encodeURIComponent(id)}` : "/collection/titres";
  return { type, id, nom, lien, image, sous_titre };
}

/** Le bouton lecture d'une carte : charge les titres de la collection et les lance (ou met en pause). */
export function useJouerCollection() {
  const b = useBiblio();
  const lecteur = useLecteur();
  const toast = useToast();
  return async ({ type, id, nom }: Pick<Recent, "type" | "id" | "nom">) => {
    if (lecteur.contexte?.type === type && lecteur.contexte.id === id && lecteur.enCours) return lecteur.basculerLecture();
    try {
      let titres: Titre[] = [];
      let image = "";
      let sous = "";
      if (type === "aimes") { titres = b.aimes; sous = "Playlist"; }
      if (type === "maPlaylist") { titres = b.maPlaylist(id)?.titres ?? []; sous = "Playlist"; }
      if (type === "playlist") {
        const [p, t] = await Promise.all([audius.playlist(id), audius.titresPlaylist(id)]);
        titres = t; image = p?.image ?? ""; sous = p ? `${p.album ? "Album" : "Playlist"} • ${p.auteur}` : "";
      }
      if (type === "artiste") {
        const [a, t] = await Promise.all([audius.artiste(id), audius.titresArtiste(id)]);
        titres = t; image = a?.image ?? ""; sous = "Artiste";
      }
      if (type === "genre") { titres = await audius.tendances(id); sous = "Genre"; }
      if (!titres.length) return toast("Rien à écouter ici pour l'instant");
      lecteur.jouer(titres, -1, contexteDe(type, id, nom, image || titres[0].image, sous));
    } catch {
      toast("Impossible de joindre le catalogue de musique");
    }
  };
}
