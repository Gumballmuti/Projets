/**
 * Comptes et sessions : mêmes règles que dans les apps de recettes, de films et Yfitops,
 * renforcées pour des données de santé.
 *
 * - Le compte « admin » se connecte avec APP_PASSWORD (variable Vercel) et crée les autres comptes.
 *   Il gère les comptes mais n'a pas accès aux dossiers patients.
 * - Chaque compte a ses propres données : magasin() range tout sous « d/<identifiant>/ ».
 * - Session : cookie HttpOnly, Secure, SameSite=Strict, signé, valable 30 jours après la dernière visite.
 * - 5 essais ratés sur un identifiant le bloquent 15 minutes. Les connexions sont journalisées.
 */
import { AsyncLocalStorage } from "node:async_hooks";
import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { magasinBrut } from "./stockage.js";

export const ADMIN = "admin";
const DUREE_SESSION = 60 * 60 * 24 * 30;
const RENOUVELER_SOUS = 60 * 60 * 24 * 25;
const ESSAIS_MAX = 5;
const BLOCAGE_MS = 15 * 60 * 1000;
const MDP_MIN = 10;
const COOKIE = "__Host-session";

export interface Utilisateur {
  identifiant: string;
  nom: string;
  hash: string;
  sel: string; // change à chaque nouveau mot de passe, ce qui déconnecte les anciennes sessions
  cree_le: string;
}

export interface Session {
  identifiant: string;
  admin: boolean;
  /** cookie renouvelé à renvoyer, quand la session approche de sa fin */
  renouveler?: string;
}

// ---------- Stockage ----------

const proprietaire = new AsyncLocalStorage<string>();

/** Exécute fn avec les données de cet utilisateur : magasin() n'y verra que les siennes. */
export function pour<T>(identifiant: string, fn: () => T): T {
  return proprietaire.run(identifiant, fn);
}

/** Les données de l'utilisateur en cours (clés relatives). */
export function magasin() {
  const identifiant = proprietaire.getStore();
  if (!identifiant || identifiant === ADMIN) throw new Error("Aucun utilisateur pour accéder aux données.");
  const brut = magasinBrut();
  const p = `d/${identifiant}/`;
  return {
    lire: <T,>(cle: string) => brut.lire<T>(p + cle),
    ecrire: (cle: string, valeur: unknown) => brut.ecrire(p + cle, valeur),
    supprimer: (cle: string) => brut.supprimer(p + cle),
  };
}

// ---------- Journal ----------

interface Evenement {
  le: string;
  qui: string;
  quoi: string;
}

export async function journaliser(qui: string, quoi: string) {
  const brut = magasinBrut();
  const journal = (await brut.lire<Evenement[]>("journal.json")) ?? [];
  journal.unshift({ le: new Date().toISOString(), qui, quoi });
  await brut.ecrire("journal.json", journal.slice(0, 500));
}

// ---------- Comptes ----------

export function normaliser(identifiant: unknown): string {
  return String(identifiant ?? "").trim().toLowerCase();
}

export function identifiantValide(identifiant: string): boolean {
  return /^[a-z0-9._-]{2,30}$/.test(identifiant);
}

function motDePasseFaible(mdp: string): string | null {
  if (mdp.length < MDP_MIN) return `Le mot de passe doit faire au moins ${MDP_MIN} caractères.`;
  if (mdp.length > 200) return "Mot de passe trop long.";
  if (!/[a-zA-Z]/.test(mdp) || !/[0-9]/.test(mdp)) return "Le mot de passe doit contenir des lettres et des chiffres.";
  return null;
}

const hacher = (motDePasse: string, sel: string) =>
  scryptSync(motDePasse, sel, 64, { N: 1 << 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }).toString("hex");

export async function lireUtilisateur(identifiant: string): Promise<Utilisateur | null> {
  if (!identifiantValide(identifiant)) return null;
  return magasinBrut().lire<Utilisateur>(`u/${identifiant}.json`);
}

export async function listerUtilisateurs(): Promise<Utilisateur[]> {
  const brut = magasinBrut();
  const cles = await brut.lister("u/");
  const comptes = await Promise.all(cles.map((c) => brut.lire<Utilisateur>(c)));
  return (comptes.filter(Boolean) as Utilisateur[]).sort((a, b) => a.identifiant.localeCompare(b.identifiant));
}

export async function enregistrerMotDePasse(identifiant: string, motDePasse: string, nom: string, cree_le?: string) {
  const sel = randomBytes(16).toString("hex");
  const compte: Utilisateur = {
    identifiant, nom, sel, hash: hacher(motDePasse, sel), cree_le: cree_le ?? new Date().toISOString(),
  };
  await magasinBrut().ecrire(`u/${identifiant}.json`, compte);
}

/** Supprime le compte et toutes ses données. */
export async function supprimerUtilisateur(identifiant: string) {
  const brut = magasinBrut();
  for (const cle of await brut.lister(`d/${identifiant}/`)) await brut.supprimer(cle);
  await brut.supprimer(`u/${identifiant}.json`);
  await brut.supprimer(`t/${identifiant}.json`);
}

// ---------- Anti force brute ----------

interface Tentatives {
  echecs: number;
  bloque_jusqua: number;
}

async function bloque(identifiant: string): Promise<number> {
  const t = await magasinBrut().lire<Tentatives>(`t/${identifiant}.json`);
  return t && t.bloque_jusqua > Date.now() ? t.bloque_jusqua : 0;
}

async function noterEchec(identifiant: string) {
  const brut = magasinBrut();
  const t = (await brut.lire<Tentatives>(`t/${identifiant}.json`)) ?? { echecs: 0, bloque_jusqua: 0 };
  t.echecs += 1;
  if (t.echecs >= ESSAIS_MAX) {
    t.bloque_jusqua = Date.now() + BLOCAGE_MS;
    t.echecs = 0;
  }
  await brut.ecrire(`t/${identifiant}.json`, t);
}

async function effacerEchecs(identifiant: string) {
  await magasinBrut().supprimer(`t/${identifiant}.json`);
}

// ---------- Sessions ----------

const motDePasseAdmin = () => (process.env.APP_PASSWORD ?? "").trim();

/** Clé de signature des sessions, dérivée des deux secrets du serveur. */
function secret(): string {
  const admin = motDePasseAdmin();
  if (!admin) return "";
  return createHash("sha256").update(`session:${admin}:${process.env.CHIFFREMENT_CLE ?? ""}`).digest("hex");
}

function signer(identifiant: string, sel: string, expire: number) {
  return createHmac("sha256", secret()).update(`${identifiant}:${sel}:${expire}`).digest("hex");
}

export function egal(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Le mot de passe admin est-il assez solide pour ouvrir le compte admin en ligne ? */
function adminUtilisable(): boolean {
  return !!motDePasseAdmin() && (!process.env.BLOB_READ_WRITE_TOKEN || motDePasseAdmin().length >= 12);
}

/** Renvoie le « sel » du compte si le mot de passe est bon (pour signer la session), sinon null. */
export async function verifier(identifiant: string, motDePasse: string): Promise<string | null> {
  if (!secret()) return null;
  if (identifiant === ADMIN) return adminUtilisable() && egal(motDePasse.trim(), motDePasseAdmin()) ? ADMIN : null;
  const compte = await lireUtilisateur(identifiant);
  // même temps de calcul que le compte existe ou non
  const hash = hacher(motDePasse, compte?.sel ?? "0000000000000000");
  if (!compte) return null;
  return egal(hash, compte.hash) ? compte.sel : null;
}

export function cookieSession(identifiant: string, sel: string): string {
  const expire = Math.floor(Date.now() / 1000) + DUREE_SESSION;
  const valeur = `${identifiant}.${expire}.${signer(identifiant, sel, expire)}`;
  return `${COOKIE}=${valeur}; Path=/; Max-Age=${DUREE_SESSION}; HttpOnly; Secure; SameSite=Strict`;
}

export const cookieDeconnexion = `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`;

export async function sessionDe(req: Request): Promise<Session | null> {
  if (!secret()) return null;
  const m = (req.headers.get("cookie") ?? "").match(/(?:^|;\s*)__Host-session=([a-z0-9._-]{2,30})\.(\d{10})\.([a-f0-9]{64})/);
  if (!m) return null;
  const [, identifiant, texteExpire, signature] = m;
  const expire = Number(texteExpire);
  const maintenant = Math.floor(Date.now() / 1000);
  if (expire < maintenant) return null;
  const sel = identifiant === ADMIN ? (adminUtilisable() ? ADMIN : null) : (await lireUtilisateur(identifiant))?.sel;
  if (!sel || !egal(signature, signer(identifiant, sel, expire))) return null;
  return {
    identifiant,
    admin: identifiant === ADMIN,
    renouveler: expire - maintenant < RENOUVELER_SOUS ? cookieSession(identifiant, sel) : undefined,
  };
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
    if (!identifiantValide(id)) return json({ erreur: "Identifiant ou mot de passe incorrect" }, 401);
    const jusqua = await bloque(id);
    if (jusqua) {
      const minutes = Math.ceil((jusqua - Date.now()) / 60000);
      return json({ erreur: `Trop d'essais. Réessaie dans ${minutes} min.` }, 429);
    }
    const sel = await verifier(id, String(mot_de_passe ?? ""));
    if (!sel) {
      await noterEchec(id);
      await journaliser(id, "connexion refusée");
      return json({ erreur: "Identifiant ou mot de passe incorrect" }, 401);
    }
    await effacerEchecs(id);
    await journaliser(id, "connexion");
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

  if (ressource === "moi" && req.method === "GET") {
    const nom = session.admin ? "Administrateur" : (await lireUtilisateur(session.identifiant))?.nom ?? "";
    return json({ identifiant: session.identifiant, admin: session.admin, nom });
  }

  // Changer son propre mot de passe (le compte admin, lui, change APP_PASSWORD dans Vercel).
  // Le sel change : toutes les autres sessions (téléphone perdu…) sont déconnectées.
  if (ressource === "mot-de-passe" && req.method === "POST") {
    if (session.admin) return json({ erreur: "Le mot de passe admin se change dans Vercel (APP_PASSWORD)." }, 400);
    const { ancien, nouveau } = await corps();
    if (!(await verifier(session.identifiant, String(ancien ?? "")))) return json({ erreur: "Ancien mot de passe incorrect" }, 400);
    const faible = motDePasseFaible(String(nouveau ?? ""));
    if (faible) return json({ erreur: faible }, 400);
    const compte = await lireUtilisateur(session.identifiant);
    await enregistrerMotDePasse(session.identifiant, String(nouveau), compte?.nom ?? "", compte?.cree_le);
    await journaliser(session.identifiant, "mot de passe changé");
    const sel = (await lireUtilisateur(session.identifiant))!.sel;
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "content-type": "application/json", "set-cookie": cookieSession(session.identifiant, sel) },
    });
  }

  if (ressource === "journal" && req.method === "GET") {
    if (!session.admin) return json({ erreur: "Réservé à l'administrateur" }, 403);
    return json((await magasinBrut().lire<Evenement[]>("journal.json")) ?? []);
  }

  if (ressource !== "utilisateurs") return null;
  if (!session.admin) return json({ erreur: "Réservé à l'administrateur" }, 403);

  if (!cible && req.method === "GET") {
    return json((await listerUtilisateurs()).map(({ identifiant, nom, cree_le }) => ({ identifiant, nom, cree_le })));
  }

  if (!cible && req.method === "POST") {
    const { identifiant, nom, mot_de_passe } = await corps();
    const id = normaliser(identifiant);
    if (!identifiantValide(id) || id === ADMIN) {
      return json({ erreur: "Identifiant invalide : 2 à 30 caractères, lettres sans accent, chiffres, point, tiret." }, 400);
    }
    if (await lireUtilisateur(id)) return json({ erreur: "Cet identifiant existe déjà." }, 400);
    const faible = motDePasseFaible(String(mot_de_passe ?? ""));
    if (faible) return json({ erreur: faible }, 400);
    await enregistrerMotDePasse(id, String(mot_de_passe), String(nom ?? "").trim().slice(0, 80));
    await journaliser(ADMIN, `compte « ${id} » créé`);
    return json({ ok: true }, 201);
  }

  const compte = cible ? await lireUtilisateur(normaliser(cible)) : null;
  if (!compte) return json({ erreur: "Compte introuvable" }, 404);

  if (req.method === "PUT") {
    const { mot_de_passe } = await corps();
    const faible = motDePasseFaible(String(mot_de_passe ?? ""));
    if (faible) return json({ erreur: faible }, 400);
    await enregistrerMotDePasse(compte.identifiant, String(mot_de_passe), compte.nom, compte.cree_le);
    await effacerEchecs(compte.identifiant);
    await journaliser(ADMIN, `mot de passe de « ${compte.identifiant} » réinitialisé`);
    return json({ ok: true });
  }

  if (req.method === "DELETE") {
    await supprimerUtilisateur(compte.identifiant);
    await journaliser(ADMIN, `compte « ${compte.identifiant} » supprimé avec ses dossiers`);
    return json({ ok: true });
  }

  return json({ erreur: "Méthode non gérée" }, 405);
}
