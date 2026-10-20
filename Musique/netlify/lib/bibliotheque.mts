import { randomBytes } from "node:crypto";
import { magasin, nommerMagasin } from "./comptes.mts";

// Chaque compte a sa bibliothèque : magasin() ne donne accès qu'à celle de l'utilisateur connecté.
nommerMagasin("musique");

export interface Titre {
  id: string;
  titre: string;
  artiste: string;
  artisteId: string;
  image: string;
  duree: number;
  genre?: string;
  ajoute_le?: string;
}

export interface Artiste {
  id: string;
  nom: string;
  image: string;
  ajoute_le?: string;
}

/** Playlist ou album d'Audius, enregistré dans la bibliothèque. */
export interface PlaylistDistante {
  id: string;
  nom: string;
  auteur: string;
  image: string;
  album: boolean;
  ajoute_le?: string;
}

export interface MaPlaylist {
  id: string;
  nom: string;
  description: string;
  titres: Titre[];
  cree_le: string;
  maj_le: string;
}

/** Ce qui a été écouté récemment : une playlist, un artiste, les titres likés… */
export interface Recent {
  type: "maPlaylist" | "playlist" | "artiste" | "aimes" | "genre";
  id: string;
  nom: string;
  image: string;
  sous_titre: string;
  le: string;
}

export interface Bibliotheque {
  playlists: MaPlaylist[];
  aimes: Titre[];
  artistes: Artiste[];
  enregistrees: PlaylistDistante[];
  recents: Recent[];
}

const CLE = "bibliotheque";
const MAX_RECENTS = 30;
const MAX_TITRES = 2000;

const texte = (v: unknown, max = 300) => String(v ?? "").slice(0, max);
const maintenant = () => new Date().toISOString();

export function nettoyerTitre(t: any): Titre | null {
  if (!t || !t.id) return null;
  return {
    id: texte(t.id, 40), titre: texte(t.titre), artiste: texte(t.artiste), artisteId: texte(t.artisteId, 40),
    image: texte(t.image, 500), duree: Math.max(0, Number(t.duree) || 0), genre: t.genre ? texte(t.genre, 40) : undefined,
  };
}

function nettoyerArtiste(a: any): Artiste | null {
  if (!a || !a.id) return null;
  return { id: texte(a.id, 40), nom: texte(a.nom), image: texte(a.image, 500) };
}

function nettoyerPlaylist(p: any): PlaylistDistante | null {
  if (!p || !p.id) return null;
  return { id: texte(p.id, 40), nom: texte(p.nom), auteur: texte(p.auteur), image: texte(p.image, 500), album: !!p.album };
}

function nettoyerRecent(r: any): Recent | null {
  if (!r || !r.id || !["maPlaylist", "playlist", "artiste", "aimes", "genre"].includes(r.type)) return null;
  return {
    type: r.type, id: texte(r.id, 60), nom: texte(r.nom), image: texte(r.image, 500),
    sous_titre: texte(r.sous_titre), le: maintenant(),
  };
}

export async function lire(): Promise<Bibliotheque> {
  const b = (await magasin().get(CLE, { type: "json" })) as Partial<Bibliotheque> | null;
  return {
    playlists: b?.playlists ?? [], aimes: b?.aimes ?? [], artistes: b?.artistes ?? [],
    enregistrees: b?.enregistrees ?? [], recents: b?.recents ?? [],
  };
}

async function ecrire(b: Bibliotheque) {
  await magasin().setJSON(CLE, b);
}

export class ErreurBiblio extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

/** Ajoute (en tête) ou retire un élément d'une liste repérée par id. */
function basculer<T extends { id: string }>(liste: T[], id: string, element: T | null): T[] {
  const reste = liste.filter((x) => x.id !== id);
  return element ? [{ ...element, ajoute_le: maintenant() }, ...reste] : reste;
}

/** Applique une route de la bibliothèque et renvoie la bibliothèque à jour. */
export async function modifier(methode: string, [ressource, id, sous, cible]: string[], corps: any): Promise<Bibliotheque> {
  const b = await lire();

  if (ressource === "aimes" && id) {
    if (methode === "PUT") {
      const t = nettoyerTitre(corps.titre);
      if (!t) throw new ErreurBiblio("Titre invalide");
      if (b.aimes.length >= MAX_TITRES) throw new ErreurBiblio("Trop de titres likés.");
      b.aimes = basculer(b.aimes, id, t);
    } else if (methode === "DELETE") b.aimes = basculer(b.aimes, id, null);
  } else if (ressource === "artistes" && id) {
    if (methode === "PUT") {
      const a = nettoyerArtiste(corps.artiste);
      if (!a) throw new ErreurBiblio("Artiste invalide");
      b.artistes = basculer(b.artistes, id, a);
    } else if (methode === "DELETE") b.artistes = basculer(b.artistes, id, null);
  } else if (ressource === "enregistrees" && id) {
    if (methode === "PUT") {
      const p = nettoyerPlaylist(corps.playlist);
      if (!p) throw new ErreurBiblio("Playlist invalide");
      b.enregistrees = basculer(b.enregistrees, id, p);
    } else if (methode === "DELETE") b.enregistrees = basculer(b.enregistrees, id, null);
  } else if (ressource === "recents") {
    if (methode === "POST") {
      const r = nettoyerRecent(corps.element);
      if (!r) throw new ErreurBiblio("Élément invalide");
      b.recents = [r, ...b.recents.filter((x) => !(x.type === r.type && x.id === r.id))].slice(0, MAX_RECENTS);
    } else if (methode === "DELETE") b.recents = [];
  } else if (ressource === "playlists") {
    modifierPlaylists(b, methode, id, sous, cible, corps);
  } else {
    throw new ErreurBiblio("Introuvable", 404);
  }

  await ecrire(b);
  return b;
}

function modifierPlaylists(b: Bibliotheque, methode: string, id: string, sous: string, cible: string, corps: any) {
  const titres = (Array.isArray(corps.titres) ? corps.titres : []).map(nettoyerTitre).filter(Boolean) as Titre[];

  // Nouvelle playlist (éventuellement déjà remplie)
  if (!id && methode === "POST") {
    let n = b.playlists.length + 1;
    while (b.playlists.some((p) => p.nom === `Ma playlist n° ${n}`)) n++;
    const p: MaPlaylist = {
      id: Date.now().toString(36) + randomBytes(3).toString("hex"),
      nom: texte(corps.nom).trim() || `Ma playlist n° ${n}`, description: "",
      titres: titres.map((t) => ({ ...t, ajoute_le: maintenant() })), cree_le: maintenant(), maj_le: maintenant(),
    };
    b.playlists.unshift(p);
    return;
  }

  const p = b.playlists.find((x) => x.id === id);
  if (!p) throw new ErreurBiblio("Playlist introuvable", 404);
  p.maj_le = maintenant();

  if (!sous && methode === "PATCH") {
    if (corps.nom !== undefined) p.nom = texte(corps.nom, 100).trim() || p.nom;
    if (corps.description !== undefined) p.description = texte(corps.description, 300);
  } else if (!sous && methode === "DELETE") {
    b.playlists = b.playlists.filter((x) => x.id !== id);
    b.recents = b.recents.filter((r) => !(r.type === "maPlaylist" && r.id === id));
  } else if (sous === "titres" && methode === "POST") {
    const nouveaux = titres.filter((t) => !p.titres.some((x) => x.id === t.id));
    if (p.titres.length + nouveaux.length > MAX_TITRES) throw new ErreurBiblio("Playlist pleine.");
    p.titres.push(...nouveaux.map((t) => ({ ...t, ajoute_le: maintenant() })));
  } else if (sous === "titres" && cible && methode === "DELETE") {
    p.titres = p.titres.filter((t) => t.id !== cible);
  } else if (sous === "ordre" && methode === "PUT") {
    // Nouvel ordre : les ids dans l'ordre voulu (ceux qui manquent restent à la fin)
    const ids: string[] = Array.isArray(corps.ids) ? corps.ids.map(String) : [];
    const rang = new Map(ids.map((x, i) => [x, i]));
    p.titres.sort((a, c) => (rang.get(a.id) ?? 1e9) - (rang.get(c.id) ?? 1e9));
  } else {
    throw new ErreurBiblio("Méthode non gérée", 405);
  }
}
