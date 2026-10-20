import type { Config, Context } from "@netlify/functions";
import { ErreurBiblio, lire, modifier } from "../lib/bibliotheque.mts";
import { pour, routesComptes, sessionDe } from "../lib/comptes.mts";

const json = (donnees: unknown, status = 200) => Response.json(donnees, { status });

export default async (req: Request, _context: Context) => {
  const chemin = new URL(req.url).pathname.replace(/^\/api\/?/, "").split("/").map(decodeURIComponent);
  const session = await sessionDe(req);
  const reponse = await routesComptes(req, chemin, session);
  if (reponse) return reponse;
  if (!session) return json({ erreur: "Non connecté" }, 401);
  return pour(session.identifiant, () => routesMusique(req, chemin));
};

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

export const config: Config = { path: "/api/*" };
