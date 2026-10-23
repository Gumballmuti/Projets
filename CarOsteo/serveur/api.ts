import { pour, routesComptes, sessionDe } from "./comptes.js";
import { ErreurDossier, routesDossiers } from "./dossiers.js";

const TAILLE_MAX = 256 * 1024;

const json = (donnees: unknown, status = 200) => Response.json(donnees, { status });

/**
 * Toute l'API : chemin = ce qui suit /api/ (ex. ["patients", "<id>", "seances"]).
 *
 * Protections communes :
 * - les requêtes qui modifient quelque chose doivent venir de l'app elle-même
 *   (en-tête X-CarOsteo + JSON), ce qu'un autre site ne peut pas imiter ;
 * - taille des envois limitée ;
 * - aucune erreur interne n'est renvoyée au navigateur.
 */
export async function traiter(req: Request, chemin: string[]): Promise<Response> {
  try {
    if (req.method !== "GET") {
      const typeJson = (req.headers.get("content-type") ?? "").startsWith("application/json");
      if (req.headers.get("x-carosteo") !== "1" || !typeJson) return json({ erreur: "Requête refusée" }, 403);
      if (Number(req.headers.get("content-length") ?? 0) > TAILLE_MAX) return json({ erreur: "Envoi trop volumineux" }, 413);
    }
    const session = await sessionDe(req);
    const reponse = (await routesComptes(req, chemin, session)) ?? (await routesPrivees(req, chemin, session));
    if (session?.renouveler && !reponse.headers.has("set-cookie")) {
      const h = new Headers(reponse.headers);
      h.set("set-cookie", session.renouveler);
      return new Response(reponse.body, { status: reponse.status, headers: h });
    }
    return reponse;
  } catch (e) {
    console.error(e);
    return json({ erreur: "Erreur du serveur" }, 500);
  }
}

async function routesPrivees(req: Request, chemin: string[], session: Awaited<ReturnType<typeof sessionDe>>) {
  if (!session) return json({ erreur: "Non connecté" }, 401);
  // l'admin gère les comptes, il n'a pas accès aux dossiers médicaux
  if (session.admin) return json({ erreur: "Le compte admin n'a pas accès aux dossiers patients." }, 403);
  try {
    const texte = req.method === "GET" || req.method === "DELETE" ? "" : await req.text();
    if (texte.length > TAILLE_MAX) return json({ erreur: "Envoi trop volumineux" }, 413);
    const corps = texte ? JSON.parse(texte) : {};
    if (typeof corps !== "object" || corps === null || Array.isArray(corps)) return json({ erreur: "Requête invalide" }, 400);
    return json(await pour(session.identifiant, () => routesDossiers(req.method, chemin, corps)));
  } catch (e) {
    if (e instanceof ErreurDossier) return json({ erreur: e.message }, e.status);
    if (e instanceof SyntaxError) return json({ erreur: "Requête invalide" }, 400);
    throw e;
  }
}

export const cheminDe = (texte: string) => texte.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean).map(decodeURIComponent);
