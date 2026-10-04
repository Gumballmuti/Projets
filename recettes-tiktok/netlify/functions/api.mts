import type { Config, Context } from "@netlify/functions";
import { randomBytes } from "node:crypto";
import {
  type Fiche, cleFiche, cleImage, egal, ecrireFiche, estConnecte, jeton, json, lireFiche, magasin,
} from "../lib/commun.mts";
import { ErreurExtraction, extraireUrl } from "../lib/tiktok.mts";

const UN_AN = 60 * 60 * 24 * 365;

async function lancerAnalyse(req: Request, id: string, video: boolean, texte: string) {
  // Une fonction « -background » répond tout de suite (202) et continue à travailler.
  await fetch(new URL("/.netlify/functions/analyse-background", req.url), {
    method: "POST",
    headers: { "content-type": "application/json", "x-cle": jeton() },
    body: JSON.stringify({ id, video, texte }),
  });
}

export default async (req: Request, context: Context) => {
  const chemin = new URL(req.url).pathname.replace(/^\/api\/?/, "");
  const [ressource, id, action] = chemin.split("/");

  if (ressource === "connexion" && req.method === "POST") {
    const { mot_de_passe } = await req.json().catch(() => ({}));
    const attendu = Netlify.env.get("APP_PASSWORD");
    if (!attendu || !egal(String(mot_de_passe ?? ""), attendu)) return json({ erreur: "Mot de passe incorrect" }, 401);
    return new Response(JSON.stringify({ ok: true }), {
      headers: {
        "content-type": "application/json",
        "set-cookie": `session=${jeton()}; Path=/; Max-Age=${UN_AN}; HttpOnly; Secure; SameSite=Lax`,
      },
    });
  }

  if (!estConnecte(req)) return json({ erreur: "Non connecté" }, 401);
  const store = magasin();

  if (ressource === "image" && id) {
    const image = await store.getWithMetadata(cleImage(id), { type: "arrayBuffer" });
    if (!image) return new Response(null, { status: 404 });
    return new Response(image.data, {
      headers: { "content-type": String(image.metadata.type ?? "image/jpeg"), "cache-control": "private, max-age=31536000" },
    });
  }

  if (ressource !== "recettes") return json({ erreur: "Introuvable" }, 404);

  // Liste
  if (!id && req.method === "GET") {
    const { blobs } = await store.list({ prefix: "r/" });
    const fiches = await Promise.all(blobs.map((b) => store.get(b.key, { type: "json" }) as Promise<Fiche | null>));
    const limite = Date.now() - 16 * 60 * 1000; // au-delà, la fonction d'analyse a forcément été coupée
    const liste = (fiches.filter(Boolean) as Fiche[]).map((f) =>
      f.statut === "en_cours" && Date.parse(f.maj_le ?? f.cree_le) < limite
        ? { ...f, statut: "erreur", erreur: "Analyse interrompue, relance-la." }
        : f,
    );
    return json(liste.sort((a, b) => b.cree_le.localeCompare(a.cree_le)));
  }

  // Ajout
  if (!id && req.method === "POST") {
    const corps = await req.json().catch(() => ({}));
    let url: string;
    try {
      url = extraireUrl(corps.lien);
    } catch (e) {
      return json({ erreur: (e as ErreurExtraction).message }, 400);
    }
    const { blobs } = await store.list({ prefix: "r/" });
    for (const b of blobs) {
      const f = (await store.get(b.key, { type: "json" })) as Fiche | null;
      if (f && (f.url === url || f.lien === url)) return json({ id: f.id, deja: true });
    }
    const fiche: Fiche = {
      id: Date.now().toString(36) + randomBytes(3).toString("hex"),
      url, lien: url, statut: "en_cours", erreur: null, titre: "", auteur: "", source: "",
      donnees: null, image: false, cree_le: new Date().toISOString(),
    };
    await ecrireFiche(fiche);
    await lancerAnalyse(req, fiche.id, !!corps.video, corps.texte ?? "");
    return json({ id: fiche.id }, 201);
  }

  const fiche = await lireFiche(id);
  if (!fiche) return json({ erreur: "Introuvable" }, 404);

  if (req.method === "GET") return json(fiche);

  if (action === "relancer" && req.method === "POST") {
    const corps = await req.json().catch(() => ({}));
    await ecrireFiche({ ...fiche, statut: "en_cours", erreur: null, maj_le: new Date().toISOString() });
    await lancerAnalyse(req, id, corps.video ?? true, corps.texte ?? "");
    return json({ ok: true });
  }

  if (req.method === "PUT") {
    const donnees = await req.json();
    await ecrireFiche({ ...fiche, titre: String(donnees.titre ?? ""), donnees });
    return json({ ok: true });
  }

  if (req.method === "DELETE") {
    await store.delete(cleFiche(id));
    await store.delete(cleImage(id));
    return json({ ok: true });
  }

  return json({ erreur: "Méthode non gérée" }, 405);
};

export const config: Config = { path: "/api/*" };
