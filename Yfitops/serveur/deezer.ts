/**
 * Le catalogue (titres, artistes, albums, playlists, classements) vient de l'API publique de Deezer.
 * Elle n'accepte pas les appels directs depuis une page web : le serveur fait l'intermédiaire.
 */
const AUTORISES = new RegExp(
  "^/(chart/\\d+/(tracks|albums|artists|playlists)|search(/(artist|album|playlist))?" +
  "|artist/\\d+(/(top|albums|related|playlists|radio))?|album/\\d+(/tracks)?|playlist/\\d+(/tracks)?" +
  "|genre(/\\d+(/artists)?)?|editorial/\\d+/(charts|releases))$",
);
const cache = new Map<string, { le: number; texte: string }>();
const DUREE = 15 * 60 * 1000;

export async function deezer(url: URL): Promise<Response> {
  const chemin = url.searchParams.get("p") ?? "";
  if (!AUTORISES.test(chemin)) return Response.json({ erreur: "Chemin refusé" }, { status: 400 });
  const params = new URLSearchParams(url.searchParams);
  params.delete("p");
  params.delete("chemin");
  const cible = `https://api.deezer.com${chemin}?${params}`;

  const garde = cache.get(cible);
  let texte = garde && garde.le > Date.now() - DUREE ? garde.texte : "";
  if (!texte) {
    const r = await fetch(cible, { headers: { "accept-language": "fr-FR,fr;q=0.9" } }).catch(() => null);
    if (!r?.ok) return Response.json({ erreur: "Catalogue injoignable" }, { status: 502 });
    texte = await r.text();
    const j = JSON.parse(texte);
    if (j?.error) return Response.json({ erreur: j.error.message ?? "Erreur du catalogue" }, { status: j.error.code === 800 ? 404 : 502 });
    cache.set(cible, { le: Date.now(), texte });
  }
  return new Response(texte, {
    headers: { "content-type": "application/json", "cache-control": "public, s-maxage=900, stale-while-revalidate=3600" },
  });
}
