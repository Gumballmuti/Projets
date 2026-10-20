import { Heart, ListEnd, ListPlus, Music, Pencil, Plus, Trash2, User, UserMinus, UserPlus, CircleMinus, CirclePlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useBiblio } from "../etat/Bibliotheque";
import { useLecteur } from "../etat/Lecteur";
import { useMenu, type ElementMenu } from "../etat/Menu";
import type { Artiste, MaPlaylist, PlaylistDistante, Titre } from "../types";

const t = 18;

/** Sous-menu « Ajouter à la playlist » : nouvelle playlist, ou une des miennes. */
function useChoixPlaylist() {
  const b = useBiblio();
  const aller = useNavigate();
  return (titres: Titre[]): ElementMenu => ({
    libelle: "Ajouter à la playlist", icone: <Plus size={t} />, recherche: true,
    sousMenu: () => [
      { libelle: "Nouvelle playlist", icone: <Plus size={t} />, action: async () => {
        const p = await b.creerPlaylist(titres);
        if (p) aller(`/ma-playlist/${p.id}`);
      } },
      { libelle: "", separateur: true },
      ...b.playlists.map((p) => ({ libelle: p.nom, icone: <Music size={t} />, action: () => b.ajouterAPlaylist(p.id, titres) })),
    ],
  });
}

export function useMenuTitre() {
  const ouvrir = useMenu();
  const b = useBiblio();
  const lecteur = useLecteur();
  const aller = useNavigate();
  const choix = useChoixPlaylist();
  return (ou: Parameters<typeof ouvrir>[0], titre: Titre, options: { playlist?: MaPlaylist } = {}) => {
    const aime = b.aime(titre.id);
    const elements: ElementMenu[] = [
      choix([titre]),
      ...(options.playlist ? [{ libelle: "Retirer de cette playlist", icone: <Trash2 size={t} />, action: () => b.retirerDePlaylist(options.playlist!.id, titre.id) }] : []),
      { libelle: aime ? "Retirer des titres likés" : "Ajouter aux titres likés", icone: <Heart size={t} fill={aime ? "currentColor" : "none"} />, action: () => b.basculerAime(titre) },
      { libelle: "Ajouter à la file d'attente", icone: <ListEnd size={t} />, action: () => lecteur.ajouterFile([titre]) },
      { libelle: "", separateur: true },
      { libelle: "Accéder à l'artiste", icone: <User size={t} />, action: () => aller(`/artiste/${titre.artisteId}`) },
    ];
    ouvrir(ou, elements, { image: titre.image, nom: titre.titre, sous: titre.artiste });
  };
}

/** Le menu « … » d'une liste entière (playlist du catalogue, album, titres d'un artiste). */
export function useMenuCollection() {
  const ouvrir = useMenu();
  const b = useBiblio();
  const lecteur = useLecteur();
  const choix = useChoixPlaylist();
  return (ou: Parameters<typeof ouvrir>[0], titres: Titre[], options: { playlist?: PlaylistDistante; artiste?: Artiste } = {}) => {
    const { playlist, artiste } = options;
    const elements: ElementMenu[] = [
      { libelle: "Ajouter à la file d'attente", icone: <ListEnd size={t} />, action: () => lecteur.ajouterFile(titres) },
      choix(titres),
    ];
    if (playlist) {
      const e = b.enregistree(playlist.id);
      elements.push({ libelle: e ? "Retirer de la bibliothèque" : "Ajouter à la bibliothèque", icone: e ? <CircleMinus size={t} /> : <CirclePlus size={t} />, action: () => b.basculerEnregistree(playlist) });
    }
    if (artiste) {
      const s = b.suit(artiste.id);
      elements.push({ libelle: s ? "Ne plus suivre" : "S'abonner", icone: s ? <UserMinus size={t} /> : <UserPlus size={t} />, action: () => b.basculerArtiste(artiste) });
    }
    const entete = playlist ? { image: playlist.image, nom: playlist.nom, sous: playlist.auteur }
      : artiste ? { image: artiste.image, nom: artiste.nom, sous: "Artiste", rond: true } : undefined;
    ouvrir(ou, elements, entete);
  };
}

/** Le menu « … » d'une de mes playlists. */
export function useMenuMaPlaylist(modifier?: () => void) {
  const ouvrir = useMenu();
  const b = useBiblio();
  const lecteur = useLecteur();
  const aller = useNavigate();
  return (ou: Parameters<typeof ouvrir>[0], p: MaPlaylist) => {
    const elements: ElementMenu[] = [
      ...(p.titres.length ? [{ libelle: "Ajouter à la file d'attente", icone: <ListEnd size={t} />, action: () => lecteur.ajouterFile(p.titres) }] : []),
      ...(modifier ? [{ libelle: "Modifier les infos", icone: <Pencil size={t} />, action: modifier }] : []),
      { libelle: "Créer une playlist similaire", icone: <ListPlus size={t} />, action: async () => {
        const n = await b.creerPlaylist(p.titres, `${p.nom} (copie)`);
        if (n) aller(`/ma-playlist/${n.id}`);
      } },
      { libelle: "", separateur: true },
      { libelle: "Supprimer", icone: <Trash2 size={t} />, danger: true, action: () => {
        if (!confirm(`Supprimer « ${p.nom} » de ta bibliothèque ?`)) return;
        b.supprimerPlaylist(p.id);
        if (location.pathname === `/ma-playlist/${p.id}`) aller("/");
      } },
    ];
    ouvrir(ou, elements, { image: p.titres[0]?.image ?? "", nom: p.nom, sous: `Playlist • ${p.titres.length} titres` });
  };
}
