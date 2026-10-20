import { ErreurBiblio, lire, modifier } from "./bibliotheque.js";
import { pour, routesComptes, sessionDe } from "./comptes.js";
import { deezer } from "./deezer.js";
import { videos } from "./youtube.js";

const json = (donnees: unknown, status = 200) => Response.json(donnees, { status });

/** Toute l'API : chemin = ce qui suit /api/ (ex. ["playlists", "abc", "titres"]). */
export async function traiter(req: Request, chemin: string[]): Promise<Response> {
  try {
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
