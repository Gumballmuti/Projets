/**
 * Retrouve sur YouTube la vidéo d'un titre du catalogue, pour le lire avec le lecteur officiel de YouTube.
 * Recherche YouTube (clé YOUTUBE_API_KEY), puis on garde les vidéos dont la durée colle au titre
 * (pas les versions live ni les clips rallongés). Les réponses sont gardées, communes à tous les comptes,
 * pour ne chercher chaque titre qu'une fois (le quota gratuit permet environ 100 recherches par jour).
 */
import { magasinBrut } from "./stockage.js";

interface Trouve {
  ids: string[];
  le: string;
}

const UNE_SEMAINE = 7 * 86400 * 1000;

/** « PT3M25S » → 205 */
function secondes(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  return m ? Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0) : 0;
}

async function chercher(cle: string, artiste: string, titre: string, duree: number): Promise<string[] | null> {
  const recherche = new URLSearchParams({
    part: "snippet", type: "video", videoEmbeddable: "true", videoCategoryId: "10", maxResults: "6",
    q: `${artiste} ${titre}`, key: cle,
  });
  const r = await fetch(`https://www.googleapis.com/youtube/v3/search?${recherche}`).catch(() => null);
  if (!r?.ok) return null;
  const ids: string[] = ((await r.json())?.items ?? []).map((it: any) => it?.id?.videoId).filter(Boolean);
  if (!ids.length || !duree) return ids;

  // Durées des vidéos trouvées : on classe par écart avec la durée du titre
  const details = await fetch(`https://www.googleapis.com/youtube/v3/videos?${new URLSearchParams({ part: "contentDetails", id: ids.join(","), key: cle })}`)
    .then((x) => (x.ok ? x.json() : null)).catch(() => null);
  const durees = new Map<string, number>((details?.items ?? []).map((v: any) => [v.id, secondes(v.contentDetails?.duration ?? "")]));
  const ecart = (id: string) => Math.abs((durees.get(id) ?? 0) - duree);
  const proches = ids.filter((id) => ecart(id) <= Math.max(15, duree * 0.1)).sort((a, b) => ecart(a) - ecart(b));
  return [...proches, ...ids.filter((id) => !proches.includes(id))];
}

export async function videos(url: URL): Promise<Response> {
  const id = (url.searchParams.get("id") ?? "").replace(/\D/g, "");
  if (!id) return Response.json({ erreur: "id manquant" }, { status: 400 });
  const cle = `yt/${id}.json`;
  const deja = await magasinBrut().lire<Trouve>(cle);
  if (deja && (deja.ids.length || Date.now() - Date.parse(deja.le) < UNE_SEMAINE)) return Response.json({ ids: deja.ids });

  const cleApi = process.env.YOUTUBE_API_KEY;
  if (!cleApi) return Response.json({ ids: [], limite: true });
  const ids = await chercher(cleApi, url.searchParams.get("artiste") ?? "", url.searchParams.get("titre") ?? "",
    Number(url.searchParams.get("duree")) || 0);
  if (!ids) return Response.json({ ids: [], limite: true }); // quota du jour atteint, ou clé refusée : on réessaiera
  await magasinBrut().ecrire(cle, { ids, le: new Date().toISOString() } satisfies Trouve).catch(() => {});
  return Response.json({ ids });
}
