import type { Config, Context } from "@netlify/functions";
import { randomBytes } from "node:crypto";
import { analyser } from "../lib/analyse.mts";
import {
  type Oeuvre, type Video, cleImage, cleOeuvre, cleVideo, ecrireOeuvre, ecrireVideo, json,
  lireOeuvre, lireVideo, magasin, toutLire,
} from "../lib/commun.mts";
import { cleInterne, migrerAnciennesDonnees, pour, routesComptes, sessionDe } from "../lib/comptes.mts";
import { effacerFichier, recevoirMorceau } from "../lib/fichiers.mts";
import { ErreurExtraction, extraireUrl } from "../lib/sources.mts";

async function lancerAnalyse(req: Request, proprio: string, id: string) {
  // Une fonction « -background » répond tout de suite (202) et continue à travailler.
  // Si elle ne démarre pas (selon le plan Netlify), la page appelle /analyser à la place.
  await fetch(new URL("/.netlify/functions/analyse-background", req.url), {
    method: "POST",
    headers: { "content-type": "application/json", "x-cle": cleInterne() },
    body: JSON.stringify({ proprio, id }),
  }).catch(() => null);
}

export default async (req: Request, _context: Context) => {
  const chemin = new URL(req.url).pathname.replace(/^\/api\/?/, "").split("/").map(decodeURIComponent);
  const session = await sessionDe(req);
  const reponse = await routesComptes(req, chemin, session);
  if (reponse) return reponse;
  if (!session) return json({ erreur: "Non connecté" }, 401);
  if (session.admin) await migrerAnciennesDonnees(["v/", "o/", "img/"]);
  return pour(session.identifiant, () => routesBibliotheque(req, chemin, session.identifiant));
};

async function routesBibliotheque(req: Request, [ressource, id, action, numero]: string[], proprio: string) {
  const store = magasin();

  if (ressource === "image" && id) {
    const image = await store.getWithMetadata(cleImage(id), { type: "arrayBuffer" });
    if (!image) return new Response(null, { status: 404 });
    return new Response(image.data, {
      headers: { "content-type": String(image.metadata.type ?? "image/jpeg"), "cache-control": "private, max-age=31536000" },
    });
  }

  // ---------- Films et séries ----------
  if (ressource === "oeuvres") {
    if (!id && req.method === "GET") return json(await toutLire<Oeuvre>("o/"));
    const oeuvre = await lireOeuvre(id);
    if (!oeuvre) return json({ erreur: "Introuvable" }, 404);
    if (req.method === "PATCH") {
      const champs = await req.json().catch(() => ({}));
      const modifiable = ["titre", "titre_original", "type", "annee", "genres", "resume", "plateformes", "pourquoi", "vu"] as const;
      const maj: Oeuvre = { ...oeuvre };
      for (const champ of modifiable) if (champ in champs) (maj as any)[champ] = champs[champ];
      await ecrireOeuvre(maj);
      return json(maj);
    }
    if (req.method === "DELETE") {
      await store.delete(cleOeuvre(id));
      return json({ ok: true });
    }
    return json({ erreur: "Méthode non gérée" }, 405);
  }

  if (ressource !== "videos") return json({ erreur: "Introuvable" }, 404);

  // ---------- Vidéos TikTok ----------
  if (!id && req.method === "GET") {
    const limite = Date.now() - 5 * 60 * 1000; // une analyse prend moins de 2 min : au-delà, elle a été coupée
    const videos = (await toutLire<Video>("v/")).map((v) =>
      v.statut === "en_cours" && Date.parse(v.maj_le ?? v.cree_le) < limite
        ? { ...v, statut: "erreur", erreur: "Analyse interrompue, relance-la." }
        : v,
    );
    return json(videos.sort((a, b) => b.cree_le.localeCompare(a.cree_le)));
  }

  if (!id && req.method === "POST") {
    const corps = await req.json().catch(() => ({}));
    let url: string;
    try {
      url = extraireUrl(corps.lien);
    } catch (e) {
      return json({ erreur: (e as ErreurExtraction).message }, 400);
    }
    const deja = (await toutLire<Video>("v/")).find((v) => v.url && (v.url === url || v.lien === url));
    if (deja) return json({ id: deja.id, deja: true });
    const maintenant = new Date().toISOString();
    const video: Video = {
      id: Date.now().toString(36) + randomBytes(3).toString("hex"),
      lien: url, url, statut: "en_cours", erreur: null, sujet: "", auteur: "", oeuvres: [], image: false,
      cree_le: maintenant, maj_le: maintenant, etape: "attente",
    };
    await ecrireVideo(video);
    await lancerAnalyse(req, proprio, video.id);
    return json({ id: video.id }, 201);
  }

  // Vidéo envoyée en fichier : on crée l'entrée, la page envoie ensuite les morceaux
  if (id === "fichier" && !action && req.method === "POST") {
    const maintenant = new Date().toISOString();
    const video: Video = {
      id: Date.now().toString(36) + randomBytes(3).toString("hex"),
      lien: "", url: "", statut: "en_cours", erreur: null, sujet: "", auteur: "", oeuvres: [], image: false, fichier: true,
      cree_le: maintenant, maj_le: maintenant, etape: "televersement",
    };
    await ecrireVideo(video);
    return json({ id: video.id }, 201);
  }

  const video = await lireVideo(id);
  if (!video) return json({ erreur: "Introuvable" }, 404);

  if (action === "morceau" && req.method === "PUT") {
    try {
      await recevoirMorceau(id, Number(numero) || 0, req);
    } catch (e) {
      return json({ erreur: (e as Error).message }, 413);
    }
    return json({ ok: true });
  }

  if (action === "miniature" && req.method === "PUT") {
    await store.set(cleImage(id), await req.arrayBuffer(), { metadata: { type: "image/jpeg" } });
    await ecrireVideo({ ...video, image: true });
    return json({ ok: true });
  }

  if (action === "televerse" && req.method === "POST") {
    await ecrireVideo({ ...video, etape: "attente", maj_le: new Date().toISOString() });
    await lancerAnalyse(req, proprio, id);
    return json({ ok: true });
  }

  if (!action && req.method === "GET") return json(video);

  if (action === "relancer" && req.method === "POST") {
    const corps = await req.json().catch(() => ({}));
    await ecrireVideo({
      ...video, statut: "en_cours", erreur: null, maj_le: new Date().toISOString(), etape: "attente",
      texte: corps.texte ?? video.texte ?? "",
    });
    await lancerAnalyse(req, proprio, id);
    return json({ ok: true });
  }

  // Secours : analyse directe, quand la fonction d'arrière-plan n'a pas démarré
  if (action === "analyser" && req.method === "POST") {
    await analyser(id);
    return json(await lireVideo(id));
  }

  // Supprimer une vidéo retire aussi les films qu'elle seule recommandait (sauf ceux déjà vus).
  if (!action && req.method === "DELETE") {
    for (const cle of video.oeuvres) {
      const oeuvre = await lireOeuvre(cle);
      if (!oeuvre) continue;
      const videos = oeuvre.videos.filter((v) => v !== id);
      if (videos.length || oeuvre.vu) await ecrireOeuvre({ ...oeuvre, videos });
      else await store.delete(cleOeuvre(cle));
    }
    await store.delete(cleVideo(id));
    await store.delete(cleImage(id));
    await effacerFichier(id);
    return json({ ok: true });
  }

  return json({ erreur: "Méthode non gérée" }, 405);
}

export const config: Config = { path: "/api/*" };
