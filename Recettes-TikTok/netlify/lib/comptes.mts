/**
 * Comptes et sessions, partagés à l'identique par les deux apps.
 *
 * - Le compte « admin » se connecte avec APP_PASSWORD (variable Netlify) et crée les autres comptes.
 * - Chaque compte a ses propres données : magasin() range tout sous « d/<identifiant>/ ».
 */
import { AsyncLocalStorage } from "node:async_hooks";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { getDeployStore, getStore } from "@netlify/blobs";

export const ADMIN = "admin";
const UN_AN = 60 * 60 * 24 * 365;

export interface Utilisateur {
  identifiant: string;
  hash: string;
  sel: string; // change à chaque nouveau mot de passe, ce qui déconnecte les anciennes sessions
  cree_le: string;
}

export interface Session {
  identifiant: string;
  admin: boolean;
}

// ---------- Stockage ----------

let nomDuMagasin = "donnees";
export function nommerMagasin(nom: string) {
  nomDuMagasin = nom;
}

/** Le magasin entier (comptes + données de tout le monde). Production séparée des tests. */
export function magasinBrut() {
  if (Netlify.context?.deploy?.context === "production") {
    return getStore({ name: nomDuMagasin, consistency: "strong" });
  }
  return getDeployStore({ name: nomDuMagasin, consistency: "strong" });
}

const proprietaire = new AsyncLocalStorage<string>();

/** Exécute fn avec les données de cet utilisateur : magasin() n'y verra que les siennes. */
export function pour<T>(identifiant: string, fn: () => T): T {
  return proprietaire.run(identifiant, fn);
}

/** Les données de l'utilisateur en cours (mêmes méthodes que Netlify Blobs, clés relatives). */
export function magasin() {
  const identifiant = proprietaire.getStore();
  if (!identifiant) throw new Error("Aucun utilisateur pour accéder aux données.");
  return espace(identifiant);
}

function espace(identifiant: string) {
  const brut = magasinBrut();
  const p = `d/${identifiant}/`;
  return {
    get: (cle: string, options?: any): Promise<any> => brut.get(p + cle, options),
    getWithMetadata: (cle: string, options?: any): Promise<any> => brut.getWithMetadata(p + cle, options),
    set: (cle: string, valeur: any, options?: any) => brut.set(p + cle, valeur, options),
    setJSON: (cle: string, valeur: any) => brut.setJSON(p + cle, valeur),
    delete: (cle: string) => brut.delete(p + cle),
    list: async ({ prefix = "" }: { prefix?: string } = {}) => {
      const { blobs } = await brut.list({ prefix: p + prefix });
      return { blobs: blobs.map((b) => ({ ...b, key: b.key.slice(p.length) })) };
    },
  };
}

/** Les données d'avant les comptes (rangées à la racine) reviennent au compte admin. */
export async function migrerAnciennesDonnees(prefixes: string[]) {
  const brut = magasinBrut();
  for (const prefixe of prefixes) {
    const { blobs } = await brut.list({ prefix: prefixe });
    for (const { key } of blobs) {
      const element = await brut.getWithMetadata(key, { type: "arrayBuffer" });
      if (element) await brut.set(`d/${ADMIN}/${key}`, element.data, { metadata: element.metadata });
      await brut.delete(key);
    }
  }
}

// ---------- Comptes ----------

export function normaliser(identifiant: unknown): string {
  return String(identifiant ?? "").trim().toLowerCase();
}

export function identifiantValide(identifiant: string): boolean {
  return /^[a-z0-9._-]{2,30}$/.test(identifiant);
}

const hacher = (motDePasse: string, sel: string) => scryptSync(motDePasse, sel, 32).toString("hex");

export async function lireUtilisateur(identifiant: string): Promise<Utilisateur | null> {
  return magasinBrut().get(`u/${identifiant}`, { type: "json" });
}

export async function listerUtilisateurs(): Promise<Utilisateur[]> {
  const brut = magasinBrut();
  const { blobs } = await brut.list({ prefix: "u/" });
  const comptes = await Promise.all(blobs.map((b) => brut.get(b.key, { type: "json" }) as Promise<Utilisateur | null>));
  return (comptes.filter(Boolean) as Utilisateur[]).sort((a, b) => a.identifiant.localeCompare(b.identifiant));
}

export async function enregistrerMotDePasse(identifiant: string, motDePasse: string, cree_le?: string) {
  const sel = randomBytes(16).toString("hex");
  const compte: Utilisateur = {
    identifiant, sel, hash: hacher(motDePasse, sel), cree_le: cree_le ?? new Date().toISOString(),
  };
  await magasinBrut().setJSON(`u/${identifiant}`, compte);
}

/** Supprime le compte et toutes ses données. */
export async function supprimerUtilisateur(identifiant: string) {
  const brut = magasinBrut();
  const { blobs } = await brut.list({ prefix: `d/${identifiant}/` });
  for (const { key } of blobs) await brut.delete(key);
  await brut.delete(`u/${identifiant}`);
}

// ---------- Sessions ----------

const secret = () => Netlify.env.get("APP_PASSWORD") ?? "";

function signer(identifiant: string, sel: string) {
  return createHmac("sha256", secret()).update(`${identifiant}:${sel}`).digest("hex");
}

export function egal(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Renvoie le « sel » du compte si le mot de passe est bon (pour signer la session), sinon null. */
export async function verifier(identifiant: string, motDePasse: string): Promise<string | null> {
  if (!secret()) return null;
  if (identifiant === ADMIN) return egal(motDePasse.trim(), secret().trim()) ? ADMIN : null;
  const compte = await lireUtilisateur(identifiant);
  if (!compte) return null;
  return egal(hacher(motDePasse, compte.sel), compte.hash) ? compte.sel : null;
}

export function cookieSession(identifiant: string, sel: string): string {
  return `session=${identifiant}.${signer(identifiant, sel)}; Path=/; Max-Age=${UN_AN}; HttpOnly; Secure; SameSite=Lax`;
}

export const cookieDeconnexion = "session=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax";

export async function sessionDe(req: Request): Promise<Session | null> {
  if (!secret()) return null;
  const m = (req.headers.get("cookie") ?? "").match(/(?:^|;\s*)session=([a-z0-9._-]+)\.([a-f0-9]{64})/);
  if (!m) return null;
  const [, identifiant, signature] = m;
  const sel = identifiant === ADMIN ? ADMIN : (await lireUtilisateur(identifiant))?.sel;
  if (!sel || !egal(signature, signer(identifiant, sel))) return null;
  return { identifiant, admin: identifiant === ADMIN };
}

/** Clé partagée entre l'API et la fonction d'arrière-plan. */
export function cleInterne(): string {
  return createHmac("sha256", secret()).update("fonction-interne").digest("hex");
}

/**
 * Routes communes : connexion, déconnexion, mon compte, gestion des comptes (admin).
 * Renvoie une réponse si la route est traitée ici, sinon null.
 */
export async function routesComptes(req: Request, chemin: string[], session: Session | null): Promise<Response | null> {
  const [ressource, cible] = chemin;
  const json = (donnees: unknown, status = 200) => Response.json(donnees, { status });
  const corps = () => req.json().catch(() => ({}));

  if (ressource === "connexion" && req.method === "POST") {
    const { identifiant, mot_de_passe } = await corps();
    const id = normaliser(identifiant || ADMIN);
    const sel = await verifier(id, String(mot_de_passe ?? ""));
    if (!sel) return json({ erreur: "Identifiant ou mot de passe incorrect" }, 401);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "content-type": "application/json", "set-cookie": cookieSession(id, sel) },
    });
  }

  if (ressource === "deconnexion" && req.method === "POST") {
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "content-type": "application/json", "set-cookie": cookieDeconnexion },
    });
  }

  if (!session) return null;

  if (ressource === "moi" && req.method === "GET") return json(session);

  // Changer son propre mot de passe (le compte admin, lui, change APP_PASSWORD dans Netlify)
  if (ressource === "mot-de-passe" && req.method === "POST") {
    if (session.admin) return json({ erreur: "Le mot de passe admin se change dans Netlify (APP_PASSWORD)." }, 400);
    const { ancien, nouveau } = await corps();
    if (!(await verifier(session.identifiant, String(ancien ?? "")))) return json({ erreur: "Ancien mot de passe incorrect" }, 400);
    if (String(nouveau ?? "").length < 6) return json({ erreur: "Le nouveau mot de passe doit faire au moins 6 caractères." }, 400);
    const compte = await lireUtilisateur(session.identifiant);
    await enregistrerMotDePasse(session.identifiant, String(nouveau), compte?.cree_le);
    const sel = (await lireUtilisateur(session.identifiant))!.sel;
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "content-type": "application/json", "set-cookie": cookieSession(session.identifiant, sel) },
    });
  }

  if (ressource !== "utilisateurs") return null;
  if (!session.admin) return json({ erreur: "Réservé à l'administrateur" }, 403);

  if (!cible && req.method === "GET") {
    return json((await listerUtilisateurs()).map(({ identifiant, cree_le }) => ({ identifiant, cree_le })));
  }

  if (!cible && req.method === "POST") {
    const { identifiant, mot_de_passe } = await corps();
    const id = normaliser(identifiant);
    if (!identifiantValide(id) || id === ADMIN) {
      return json({ erreur: "Identifiant invalide : 2 à 30 caractères, lettres sans accent, chiffres, point, tiret." }, 400);
    }
    if (await lireUtilisateur(id)) return json({ erreur: "Cet identifiant existe déjà." }, 400);
    if (String(mot_de_passe ?? "").length < 6) return json({ erreur: "Le mot de passe doit faire au moins 6 caractères." }, 400);
    await enregistrerMotDePasse(id, String(mot_de_passe));
    return json({ ok: true }, 201);
  }

  const compte = cible ? await lireUtilisateur(normaliser(cible)) : null;
  if (!compte) return json({ erreur: "Compte introuvable" }, 404);

  if (req.method === "PUT") {
    const { mot_de_passe } = await corps();
    if (String(mot_de_passe ?? "").length < 6) return json({ erreur: "Le mot de passe doit faire au moins 6 caractères." }, 400);
    await enregistrerMotDePasse(compte.identifiant, String(mot_de_passe), compte.cree_le);
    return json({ ok: true });
  }

  if (req.method === "DELETE") {
    await supprimerUtilisateur(compte.identifiant);
    return json({ ok: true });
  }

  return json({ erreur: "Méthode non gérée" }, 405);
}
