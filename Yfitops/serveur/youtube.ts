/**
 * Retrouve sur YouTube la vidéo d'un titre Deezer, pour le lire avec le lecteur officiel de YouTube.
 * 1. Odesli (song.link) : les liens officiels du titre sur YouTube Music / YouTube.
 * 2. Sinon, si YOUTUBE_API_KEY est réglée : la recherche YouTube.
 * Les réponses sont gardées (communes à tous les comptes) pour ne chercher chaque titre qu'une fois.
 */
import { magasinBrut } from "./stockage.js";

interface Trouve {
  ids: string[];
  le: string;
}

const UNE_SEMAINE = 7 * 86400 * 1000;
const idVideo = (url?: string) => {
  try {
    return url ? new URL(url).searchParams.get("v") : null;
  } catch {
    return null;
  }
};

export async function videos(url: URL): Promise<Response> {
  const id = (url.searchParams.get("id") ?? "").replace(/\D/g, "");
  if (!id) return Response.json({ erreur: "id manquant" }, { status: 400 });
  const cle = `yt/${id}.json`;
  const deja = await magasinBrut().lire<Trouve>(cle);
  if (deja && (deja.ids.length || Date.now() - Date.parse(deja.le) < UNE_SEMAINE)) return Response.json({ ids: deja.ids });

  const ids: string[] = [];
  let sur = false; // la réponse est fiable (même vide) : on peut la garder

  const r = await fetch(`https://api.song.link/v1-alpha.1/links?userCountry=FR&url=${encodeURIComponent(`https://www.deezer.com/track/${id}`)}`)
    .catch(() => null);
  if (r?.ok) {
    const j = await r.json().catch(() => null);
    for (const p of ["youtubeMusic", "youtube"]) {
      const v = idVideo(j?.linksByPlatform?.[p]?.url);
      if (v && !ids.includes(v)) ids.push(v);
    }
    sur = true;
  } else if (r && (r.status === 400 || r.status === 404)) {
    sur = true;
  }

  const cleApi = process.env.YOUTUBE_API_KEY;
  const q = `${url.searchParams.get("artiste") ?? ""} ${url.searchParams.get("titre") ?? ""}`.trim();
  if (!ids.length && cleApi && q) {
    const params = new URLSearchParams({ part: "snippet", type: "video", videoEmbeddable: "true", maxResults: "3", q, key: cleApi });
    const s = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`).catch(() => null);
    if (s?.ok) {
      const j = await s.json().catch(() => null);
      for (const it of j?.items ?? []) if (it?.id?.videoId && !ids.includes(it.id.videoId)) ids.push(it.id.videoId);
      sur = true;
    }
  }

  if (sur) await magasinBrut().ecrire(cle, { ids, le: new Date().toISOString() } satisfies Trouve).catch(() => {});
  return Response.json({ ids, limite: !sur });
}
