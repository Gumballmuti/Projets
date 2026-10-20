/**
 * Catalogue musical : Audius (https://audius.org), plateforme où les artistes publient
 * leur musique en écoute libre et gratuite. Pas de compte ni de clé nécessaires.
 */
import type { Artiste, PlaylistDistante, Titre } from "./types";

const APP = "ma-musique-perso";
const HOTES = ["https://api.audius.co", "https://discoveryprovider.audius.co"];
const CLE = import.meta.env.VITE_AUDIUS_API_KEY as string | undefined;
let hote = HOTES[0];

const cache = new Map<string, { le: number; promesse: Promise<any> }>();
const DUREE_CACHE = 5 * 60 * 1000;

function parametres(extra: Record<string, string | number | undefined> = {}) {
  const p = new URLSearchParams({ app_name: APP });
  if (CLE) p.set("api_key", CLE);
  for (const [k, v] of Object.entries(extra)) if (v !== undefined && v !== "") p.set(k, String(v));
  return p;
}

async function charger(chemin: string, extra: Record<string, string | number | undefined>) {
  let erreur: unknown;
  for (const h of [hote, ...HOTES.filter((x) => x !== hote)]) {
    try {
      const r = await fetch(`${h}/v1${chemin}?${parametres(extra)}`);
      if (r.status === 404) return null;
      if (!r.ok) throw new Error(`Audius a répondu ${r.status}`);
      hote = h;
      return (await r.json()).data;
    } catch (e) {
      erreur = e;
    }
  }
  throw erreur instanceof Error ? erreur : new Error("Catalogue injoignable");
}

function get(chemin: string, extra: Record<string, string | number | undefined> = {}): Promise<any> {
  const cle = chemin + JSON.stringify(extra);
  const deja = cache.get(cle);
  if (deja && Date.now() - deja.le < DUREE_CACHE) return deja.promesse;
  const promesse = charger(chemin, extra);
  cache.set(cle, { le: Date.now(), promesse });
  promesse.catch(() => cache.delete(cle));
  return promesse;
}

export const urlFlux = (id: string) => `${hote}/v1/tracks/${encodeURIComponent(id)}/stream?${parametres()}`;

const image = (a: any, taille = "480x480"): string => a?.[taille] ?? a?.["480x480"] ?? a?.["150x150"] ?? a?.["1000x1000"] ?? "";

export function versTitre(t: any): Titre {
  return {
    id: String(t.id), titre: t.title ?? "", artiste: t.user?.name ?? "", artisteId: String(t.user?.id ?? ""),
    image: image(t.artwork), duree: t.duration ?? 0, genre: t.genre || undefined, ecoutes: t.play_count,
  };
}

export function versArtiste(u: any): Artiste {
  return {
    id: String(u.id), nom: u.name ?? u.handle ?? "", image: image(u.profile_picture),
    banniere: u.cover_photo?.["2000x"] ?? u.cover_photo?.["640x"] ?? "", abonnes: u.follower_count ?? 0,
    verifie: !!u.is_verified, pseudo: u.handle, bio: u.bio ?? "",
  };
}

export function versPlaylist(p: any): PlaylistDistante {
  return {
    id: String(p.id), nom: p.playlist_name ?? "", auteur: p.user?.name ?? "", auteurId: String(p.user?.id ?? ""),
    image: image(p.artwork), album: !!p.is_album, nbTitres: p.track_count ?? p.playlist_contents?.length ?? 0,
    description: p.description ?? "",
  };
}

const lisibles = (liste: any[] | null) =>
  (liste ?? []).filter((t) => t && t.is_streamable !== false && !t.is_delete).map(versTitre);

export const tendances = (genre?: string, periode: "week" | "month" | "allTime" = "week") =>
  get("/tracks/trending", { genre, time: periode, limit: 50 }).then(lisibles);

export const pepites = () => get("/tracks/trending/underground", { limit: 50 }).then(lisibles);

export const playlistsTendance = () =>
  get("/playlists/trending", { time: "week", limit: 30 }).then((l: any[] | null) => (l ?? []).map(versPlaylist));

export async function rechercher(q: string) {
  const [titres, artistes, playlists, albums] = await Promise.allSettled([
    get("/tracks/search", { query: q, limit: 30 }),
    get("/users/search", { query: q, limit: 20 }),
    get("/playlists/search", { query: q, limit: 30 }),
    get("/playlists/search", { query: q, limit: 20, is_album: "true" }),
  ]);
  const ok = <T,>(r: PromiseSettledResult<T>) => (r.status === "fulfilled" ? r.value : null);
  if ([titres, artistes, playlists].every((r) => r.status === "rejected")) throw (titres as PromiseRejectedResult).reason;
  const toutes = [...((ok(playlists) as any[]) ?? []), ...((ok(albums) as any[]) ?? [])].map(versPlaylist);
  const uniques = [...new Map(toutes.map((p) => [p.id, p])).values()];
  return {
    titres: lisibles(ok(titres)),
    artistes: ((ok(artistes) as any[]) ?? []).map(versArtiste),
    playlists: uniques.filter((p) => !p.album),
    albums: uniques.filter((p) => p.album),
  };
}

export const artiste = (id: string) => get(`/users/${id}`).then((u) => (u ? versArtiste(u) : null));

export const titresArtiste = (id: string) =>
  get(`/users/${id}/tracks`, { sort: "plays", limit: 50 })
    .catch(() => get(`/users/${id}/tracks`, { limit: 50 }))
    .then(lisibles)
    .then((l) => [...new Map(l.map((t) => [t.id, t])).values()].sort((a, b) => (b.ecoutes ?? 0) - (a.ecoutes ?? 0)));

export const albumsArtiste = (id: string) =>
  get(`/users/${id}/albums`, { limit: 20 }).then((l: any[] | null) => (l ?? []).map(versPlaylist)).catch(() => []);

export const playlistsArtiste = (id: string) =>
  get(`/users/${id}/playlists`, { limit: 20 }).then((l: any[] | null) => (l ?? []).map(versPlaylist)).catch(() => []);

export const artistesProches = (id: string) =>
  get(`/users/${id}/related`, { limit: 12 }).then((l: any[] | null) => (l ?? []).map(versArtiste)).catch(() => []);

export const playlist = (id: string) =>
  get(`/playlists/${id}`).then((l: any) => {
    const p = Array.isArray(l) ? l[0] : l;
    return p ? versPlaylist(p) : null;
  });

export const titresPlaylist = (id: string) => get(`/playlists/${id}/tracks`).then(lisibles);

/** Les genres d'Audius, avec la couleur de leur carte dans « Parcourir tout ». */
export const GENRES: { nom: string; libelle: string; couleur: string }[] = [
  { nom: "Hip-Hop/Rap", libelle: "Hip-hop / Rap", couleur: "#bc5900" },
  { nom: "Electronic", libelle: "Électro", couleur: "#0d73ec" },
  { nom: "Pop", libelle: "Pop", couleur: "#8d67ab" },
  { nom: "R&B/Soul", libelle: "R&B / Soul", couleur: "#dc148c" },
  { nom: "Lo-Fi", libelle: "Lo-fi", couleur: "#477d95" },
  { nom: "Rock", libelle: "Rock", couleur: "#e91429" },
  { nom: "Alternative", libelle: "Alternative", couleur: "#608108" },
  { nom: "House", libelle: "House", couleur: "#148a08" },
  { nom: "Techno", libelle: "Techno", couleur: "#503750" },
  { nom: "Trap", libelle: "Trap", couleur: "#af2896" },
  { nom: "Ambient", libelle: "Ambient", couleur: "#1e3264" },
  { nom: "Jazz", libelle: "Jazz", couleur: "#a56752" },
  { nom: "Latin", libelle: "Latino", couleur: "#e1118c" },
  { nom: "Dubstep", libelle: "Dubstep", couleur: "#7358ff" },
  { nom: "Drum & Bass", libelle: "Drum & Bass", couleur: "#ba5d07" },
  { nom: "Classical", libelle: "Classique", couleur: "#7d4b32" },
  { nom: "Acoustic", libelle: "Acoustique", couleur: "#27856a" },
  { nom: "Soundtrack", libelle: "Musiques de films", couleur: "#2d46b9" },
  { nom: "Metal", libelle: "Metal", couleur: "#777777" },
  { nom: "Funk", libelle: "Funk", couleur: "#e8115b" },
  { nom: "Reggae", libelle: "Reggae", couleur: "#056952" },
  { nom: "Folk", libelle: "Folk", couleur: "#a0c3d2" },
  { nom: "Experimental", libelle: "Expérimental", couleur: "#006450" },
  { nom: "World", libelle: "Musiques du monde", couleur: "#d84000" },
  { nom: "Country", libelle: "Country", couleur: "#9cf0e1" },
  { nom: "Blues", libelle: "Blues", couleur: "#1e3264" },
  { nom: "Punk", libelle: "Punk", couleur: "#ff4632" },
  { nom: "Deep House", libelle: "Deep house", couleur: "#509bf5" },
  { nom: "Disco", libelle: "Disco", couleur: "#f59b23" },
  { nom: "Trance", libelle: "Trance", couleur: "#8400e7" },
  { nom: "Podcasts", libelle: "Podcasts", couleur: "#006450" },
  { nom: "Kids", libelle: "Enfants", couleur: "#ffc864" },
];

export const libelleGenre = (nom: string) => GENRES.find((g) => g.nom === nom)?.libelle ?? nom;
