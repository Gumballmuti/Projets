/**
 * Le catalogue : Deezer (via notre serveur) pour les titres, artistes, albums, playlists et classements.
 * Le son est lu par le lecteur officiel de YouTube (voir moteur.ts).
 */
import { appel } from "./api";
import type { Artiste, PlaylistDistante, Titre } from "./types";

const cache = new Map<string, { le: number; promesse: Promise<any> }>();
const DUREE_CACHE = 10 * 60 * 1000;

function get(chemin: string, params: Record<string, string | number> = {}): Promise<any> {
  const q = new URLSearchParams({ p: chemin, ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])) });
  const cle = q.toString();
  const deja = cache.get(cle);
  if (deja && Date.now() - deja.le < DUREE_CACHE) return deja.promesse;
  const promesse = appel(`deezer?${cle}`);
  cache.set(cle, { le: Date.now(), promesse });
  promesse.catch(() => cache.delete(cle));
  return promesse;
}

export function versTitre(t: any, album?: any): Titre {
  const a = t.album ?? album;
  return {
    id: String(t.id), titre: t.title ?? "", artiste: t.artist?.name ?? "", artisteId: String(t.artist?.id ?? ""),
    image: a?.cover_big ?? a?.cover_medium ?? "", duree: t.duration ?? 0,
    album: a?.title, albumId: a?.id ? String(a.id) : undefined, apercu: t.preview || undefined,
  };
}

export function versArtiste(a: any): Artiste {
  return {
    id: String(a.id), nom: a.name ?? "", image: a.picture_big ?? a.picture_medium ?? "",
    banniere: a.picture_xl ?? "", abonnes: a.nb_fan ?? 0,
  };
}

export function versAlbum(a: any, artiste?: any): PlaylistDistante {
  const ar = a.artist ?? artiste;
  return {
    id: "a" + a.id, nom: a.title ?? "", auteur: ar?.name ?? "", auteurId: ar?.id ? String(ar.id) : undefined,
    image: a.cover_big ?? a.cover_medium ?? "", album: true, nbTitres: a.nb_tracks,
    annee: a.release_date?.slice(0, 4),
  };
}

export function versPlaylist(p: any): PlaylistDistante {
  return {
    id: "p" + p.id, nom: p.title ?? "", auteur: p.user?.name ?? p.creator?.name ?? "Deezer",
    image: p.picture_big ?? p.picture_medium ?? "", album: false, nbTitres: p.nb_tracks, description: p.description ?? "",
  };
}

const donnees = (r: any) => (r?.data ?? []) as any[];
const titres = (r: any, album?: any) => donnees(r).map((t) => versTitre(t, album));

export const tops = (genre = 0) => get(`/chart/${genre}/tracks`, { limit: 50 }).then((r) => titres(r));
export const albumsTop = (genre = 0) => get(`/chart/${genre}/albums`, { limit: 30 }).then((r) => donnees(r).map((a) => versAlbum(a)));
export const artistesTop = (genre = 0) => get(`/chart/${genre}/artists`, { limit: 30 }).then((r) => donnees(r).map(versArtiste));
export const playlistsTop = (genre = 0) => get(`/chart/${genre}/playlists`, { limit: 30 }).then((r) => donnees(r).map(versPlaylist));
export const nouveautes = () => get("/editorial/0/releases", { limit: 30 }).then((r) => donnees(r).map((a) => versAlbum(a)));

export async function rechercher(q: string) {
  const [t, ar, al, pl] = await Promise.allSettled([
    get("/search", { q, limit: 30 }), get("/search/artist", { q, limit: 20 }),
    get("/search/album", { q, limit: 20 }), get("/search/playlist", { q, limit: 20 }),
  ]);
  if ([t, ar, al, pl].every((r) => r.status === "rejected")) throw (t as PromiseRejectedResult).reason;
  const ok = (r: PromiseSettledResult<any>) => (r.status === "fulfilled" ? r.value : null);
  return {
    titres: titres(ok(t)),
    artistes: donnees(ok(ar)).map(versArtiste),
    albums: donnees(ok(al)).map((a) => versAlbum(a)),
    playlists: donnees(ok(pl)).map(versPlaylist),
  };
}

export const artiste = (id: string) => get(`/artist/${id}`).then(versArtiste);
export const titresArtiste = (id: string) => get(`/artist/${id}/top`, { limit: 50 }).then((r) => titres(r));
export const albumsArtiste = (id: string) =>
  get(`/artist/${id}/albums`, { limit: 50 }).then((r) => donnees(r).map((a) => versAlbum(a))).catch(() => []);
export const playlistsArtiste = (id: string) =>
  get(`/artist/${id}/playlists`, { limit: 20 }).then((r) => donnees(r).map(versPlaylist)).catch(() => []);
export const radioArtiste = (id: string) => get(`/artist/${id}/radio`, { limit: 40 }).then((r) => titres(r)).catch(() => []);
export const artistesProches = (id: string) =>
  get(`/artist/${id}/related`, { limit: 20 }).then((r) => donnees(r).map(versArtiste)).catch(() => []);

/** Un album (« a123 ») ou une playlist (« p123 ») avec ses titres. */
export async function collection(id: string): Promise<{ infos: PlaylistDistante; titres: Titre[] }> {
  const n = id.slice(1);
  if (id.startsWith("a")) {
    const a = await get(`/album/${n}`);
    return { infos: versAlbum(a), titres: donnees(a.tracks).map((t) => versTitre(t, a)) };
  }
  const p = await get(`/playlist/${n}`);
  return { infos: versPlaylist(p), titres: titres(p.tracks) };
}

export interface Genre { id: string; nom: string; image: string }
export const genres = (): Promise<Genre[]> =>
  get("/genre").then((r) => donnees(r).filter((g) => g.id !== 0).map((g) => ({ id: String(g.id), nom: g.name, image: g.picture_big ?? "" })));
export const genre = (id: string): Promise<Genre> => get(`/genre/${id}`).then((g) => ({ id: String(g.id), nom: g.name, image: g.picture_big ?? "" }));
export const artistesGenre = (id: string) => get(`/genre/${id}/artists`).then((r) => donnees(r).map(versArtiste)).catch(() => []);

/** Couleurs des cartes de genres (« Parcourir tout »). */
const COULEURS = ["#dc148c", "#006450", "#8400e7", "#1e3264", "#e8115b", "#bc5900", "#477d95", "#e91429", "#148a08",
  "#503750", "#0d73ec", "#af2896", "#509bf5", "#27856a", "#ba5d07", "#8d67ab", "#7358ff", "#a56752", "#d84000", "#2d46b9"];
export const couleurGenre = (id: string) => COULEURS[Number(id) % COULEURS.length];
