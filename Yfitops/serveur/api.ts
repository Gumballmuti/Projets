import { ErreurBiblio, lire, modifier } from "./bibliotheque.js";
import { pour, routesComptes, sessionDe } from "./comptes.js";
import { deezer } from "./deezer.js";
import { videos } from "./youtube.js";

const json = (donnees: unknown, status = 200) => Response.json(donnees, { status });

/** Toute l'API : chemin = ce qui suit /api/ (ex. ["playlists", "abc", "titres"]). */
export async function traiter(req: Request, chemin: string[]): Promise<Response> {
  try {
    if (chemin[0] === "sante" && req.method === "GET") return await sante();
    const session = await sessionDe(req);
    const reponse = await routesComptes(req, chemin, session);
    if (reponse) return reponse;
    if (!session) return json({ erreur: "Non connecté" }, 401);
    const url = new URL(req.url);
    if (chemin[0] === "deezer" && req.method === "GET") return await deezer(url);
    if (chemin[0] === "youtube" && req.method === "GET") return await videos(url);
    return await pour(session.identifiant, () => routesMusique(req, chemin));
  } catch (e) {
    console.error(e);
    return json({ erreur: "Erreur du serveur" }, 500);
  }
}

async function routesMusique(req: Request, chemin: string[]) {
  if (chemin[0] === "bibliotheque" && req.method === "GET") return json(await lire());
  try {
    const corps = req.method === "GET" || req.method === "DELETE" ? {} : await req.json().catch(() => ({}));
    return json(await modifier(req.method, chemin, corps));
  } catch (e) {
    if (e instanceof ErreurBiblio) return json({ erreur: e.message }, e.status);
    throw e;
  }
}

export const cheminDe = (texte: string) => texte.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean).map(decodeURIComponent);

/** Diagnostic sans connexion : le catalogue et la recherche YouTube répondent-ils depuis le serveur ? */
async function sante() {
  const essai = async (url: string) => {
    const r = await fetch(url).catch((e) => ({ ok: false, status: String(e) }) as const);
    return "json" in r ? { status: r.status, extrait: (await r.text()).slice(0, 300) } : r;
  };
  return json({
    deezer: await essai("https://api.deezer.com/chart/0/tracks?limit=1"),
    odesli: await essai("https://api.song.link/v1-alpha.1/links?userCountry=FR&url=https%3A%2F%2Fwww.deezer.com%2Ftrack%2F3135556"),
    stockage: !!process.env.BLOB_READ_WRITE_TOKEN,
  });
}
