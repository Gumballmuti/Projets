/**
 * Dossiers patients du compte connecté.
 *
 * Rangement (chiffré, voir stockage.ts) :
 * - « index.json »      : la liste des patients (résumés) pour l'écran d'accueil et la recherche ;
 * - « p/<id>.json »     : le dossier complet d'un patient, fiche + séances.
 *
 * Tout ce qui arrive du navigateur est filtré ici : seuls les champs connus passent,
 * avec une longueur maximale. Rien d'autre n'est enregistré.
 */
import { randomUUID } from "node:crypto";
import {
  CHAMPS_SEANCE_TEXTE, CHAMPS_TEXTE_COURT, CHAMPS_TEXTE_LONG, KINDS, PROFILE_FIELDS, SESSION_SPECIFICS,
  SPECIALTIES, ZONES,
  type Consultation, type Dossier, type FieldDef, type Json, type Patient, type Resume, type Specialty,
} from "../commun/modele.js";
import { magasin } from "./comptes.js";

export class ErreurDossier extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

const COURT = 200;
const LONG = 10000;
const ID = /^[0-9a-f-]{36}$/;
type Corps = Record<string, unknown>;

// ---------- Nettoyage des données reçues ----------

function texte(v: unknown, max: number): string | null {
  if (v === null || v === undefined) return null;
  const t = String(v).replace(/\u0000/g, "").trim();
  return t ? t.slice(0, max) : null;
}

function date(v: unknown): string | null {
  const t = String(v ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return null;
  return Number.isNaN(Date.parse(t)) ? null : t;
}

function parmi<T extends string>(v: unknown, valeurs: readonly T[]): T | null {
  return valeurs.includes(v as T) ? (v as T) : null;
}

function note(v: unknown): number | null {
  if (v === "" || v === null || v === undefined) return null;
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n >= 0 && n <= 10 ? n : null;
}

const specialites = SPECIALTIES.map((s) => s.value);

/** Ne garde que les champs prévus d'un bilan, avec leurs valeurs autorisées. */
function bilan(v: unknown, defs: FieldDef[]): Json {
  const entree = (v && typeof v === "object" ? v : {}) as Corps;
  const sortie: Json = {};
  for (const d of defs) {
    const brut = entree[d.key];
    if (d.type === "multi") {
      const liste = (Array.isArray(brut) ? brut : []).filter((x) => d.options?.includes(String(x))).map(String);
      if (liste.length) sortie[d.key] = [...new Set(liste)];
    } else if (d.type === "select") {
      if (d.options?.includes(String(brut))) sortie[d.key] = String(brut);
    } else if (d.type === "number") {
      const n = Number(brut);
      if (brut !== "" && brut !== null && brut !== undefined && Number.isFinite(n) && n >= 0 && n <= 1000) sortie[d.key] = String(n);
    } else {
      const t = texte(brut, d.type === "textarea" ? LONG : COURT);
      if (t) sortie[d.key] = t;
    }
  }
  return sortie;
}

function nettoyerPatient(c: Corps, ancien?: Patient): Patient {
  const maintenant = new Date().toISOString();
  const p = {
    id: ancien?.id ?? randomUUID(),
    created_at: ancien?.created_at ?? maintenant,
    updated_at: maintenant,
  } as Patient;
  for (const k of CHAMPS_TEXTE_COURT) (p as unknown as Record<string, string | null>)[k] = texte(c[k], COURT);
  for (const k of CHAMPS_TEXTE_LONG) (p as unknown as Record<string, string | null>)[k] = texte(c[k], LONG);
  if (!p.last_name || !p.first_name) throw new ErreurDossier("Le nom et le prénom sont obligatoires.");
  p.birth_date = date(c.birth_date);
  p.consent_at = date(c.consent_at);
  p.sex = parmi(c.sex, ["F", "M", "X"] as const);
  p.dominant_hand = parmi(c.dominant_hand, ["droite", "gauche", "ambidextre"] as const);
  p.specialties = [...new Set((Array.isArray(c.specialties) ? c.specialties : []).filter((s) => specialites.includes(s as Specialty)))] as Specialty[];
  p.migraine_profile = bilan(c.migraine_profile, PROFILE_FIELDS.migraine.defs);
  p.atm_profile = bilan(c.atm_profile, PROFILE_FIELDS.atm.defs);
  p.sport_profile = bilan(c.sport_profile, PROFILE_FIELDS.sport.defs);
  p.archived = c.archived === true;
  return p;
}

function nettoyerSeance(c: Corps, patientId: string, ancienne?: Consultation): Consultation {
  const maintenant = new Date().toISOString();
  const focus = parmi(c.focus, specialites) ?? "generale";
  const s = {
    id: ancienne?.id ?? randomUUID(),
    patient_id: patientId,
    created_at: ancienne?.created_at ?? maintenant,
    updated_at: maintenant,
  } as Consultation;
  for (const k of CHAMPS_SEANCE_TEXTE) (s as unknown as Record<string, string | null>)[k] = texte(c[k], LONG);
  s.seance_date = date(c.seance_date) ?? maintenant.slice(0, 10);
  s.kind = parmi(c.kind, KINDS.map((k) => k.value) as Consultation["kind"][]) ?? "suivi";
  s.focus = focus;
  s.pain_before = note(c.pain_before);
  s.pain_after = note(c.pain_after);
  s.zones = [...new Set((Array.isArray(c.zones) ? c.zones : []).filter((z) => ZONES.includes(String(z))).map(String))];
  s.specifics = bilan(c.specifics, SESSION_SPECIFICS[focus]);
  return s;
}

// ---------- Lecture / écriture ----------

const trier = (seances: Consultation[]) =>
  seances.sort((a, b) => b.seance_date.localeCompare(a.seance_date) || b.created_at.localeCompare(a.created_at));

function resume({ patient: p, seances }: Dossier): Resume {
  return {
    id: p.id, last_name: p.last_name, first_name: p.first_name, birth_date: p.birth_date, phone: p.phone,
    specialties: p.specialties, main_complaint: p.main_complaint, archived: p.archived, updated_at: p.updated_at,
    derniere_seance: seances[0]?.seance_date ?? null, nb_seances: seances.length,
  };
}

async function lireIndex(): Promise<Resume[]> {
  return (await magasin().lire<Resume[]>("index.json")) ?? [];
}

async function lireDossier(id: string): Promise<Dossier> {
  if (!ID.test(id)) throw new ErreurDossier("Dossier introuvable", 404);
  const d = await magasin().lire<Dossier>(`p/${id}.json`);
  if (!d) throw new ErreurDossier("Dossier introuvable", 404);
  return d;
}

async function enregistrer(d: Dossier): Promise<Dossier> {
  trier(d.seances);
  await magasin().ecrire(`p/${d.patient.id}.json`, d);
  const index = (await lireIndex()).filter((r) => r.id !== d.patient.id);
  index.push(resume(d));
  index.sort((a, b) => a.last_name.localeCompare(b.last_name, "fr") || a.first_name.localeCompare(b.first_name, "fr"));
  await magasin().ecrire("index.json", index);
  return d;
}

const cleNom = (nom: string, prenom: string) =>
  `${nom} ${prenom}`.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z]/g, "");

/**
 * Import de dossiers (reprise des anciennes fiches, ou fichier d'export CarOstéo).
 * Chaque fiche et chaque séance passent par le même filtrage qu'une saisie normale.
 * Un patient dont le nom + prénom existe déjà est ignoré : importer deux fois ne crée pas de doublons.
 */
async function importer(corps: Corps) {
  const entrants = Array.isArray(corps.dossiers) ? corps.dossiers.slice(0, 3000) : null;
  if (!entrants) throw new ErreurDossier("Fichier d'import invalide.");
  const index = await lireIndex();
  const connus = new Set(index.map((r) => cleNom(r.last_name, r.first_name)));
  const nouveaux: Dossier[] = [];
  const erreurs: string[] = [];
  let ignores = 0;
  for (const [n, brut] of entrants.entries()) {
    const d = (brut && typeof brut === "object" ? brut : {}) as Corps;
    try {
      const patient = nettoyerPatient((d.patient ?? {}) as Corps);
      const cle = cleNom(patient.last_name, patient.first_name);
      if (connus.has(cle)) { ignores++; continue; }
      connus.add(cle);
      const seances = (Array.isArray(d.seances) ? d.seances.slice(0, 500) : []).map((s) => nettoyerSeance((s ?? {}) as Corps, patient.id));
      nouveaux.push({ patient, seances: trier(seances) });
    } catch (e) {
      erreurs.push(`Dossier n°${n + 1} : ${(e as Error).message}`);
    }
  }
  // écriture par petits paquets en parallèle, puis l'index une seule fois
  for (let i = 0; i < nouveaux.length; i += 8) {
    await Promise.all(nouveaux.slice(i, i + 8).map((d) => magasin().ecrire(`p/${d.patient.id}.json`, d)));
  }
  const complet = [...index, ...nouveaux.map(resume)];
  complet.sort((a, b) => a.last_name.localeCompare(b.last_name, "fr") || a.first_name.localeCompare(b.first_name, "fr"));
  await magasin().ecrire("index.json", complet);
  return {
    importes: nouveaux.length,
    seances: nouveaux.reduce((n, d) => n + d.seances.length, 0),
    ignores,
    erreurs: erreurs.slice(0, 20),
  };
}

/** Routes /api/patients/..., /api/import et /api/export. */
export async function routesDossiers(methode: string, chemin: string[], corps: Corps): Promise<unknown> {
  const [ressource, id, sous, seanceId] = chemin;

  if (ressource === "import" && methode === "POST") return importer(corps);

  if (ressource === "export" && methode === "GET") {
    const index = await lireIndex();
    return { exporte_le: new Date().toISOString(), dossiers: await Promise.all(index.map((r) => lireDossier(r.id))) };
  }

  if (ressource !== "patients") throw new ErreurDossier("Adresse inconnue", 404);

  if (!id) {
    if (methode === "GET") return lireIndex();
    if (methode === "POST") return enregistrer({ patient: nettoyerPatient(corps), seances: [] });
    throw new ErreurDossier("Méthode non gérée", 405);
  }

  const dossier = await lireDossier(id);

  if (!sous) {
    if (methode === "GET") return dossier;
    if (methode === "PUT") return enregistrer({ ...dossier, patient: nettoyerPatient(corps, dossier.patient) });
    if (methode === "DELETE") {
      await magasin().supprimer(`p/${id}.json`);
      await magasin().ecrire("index.json", (await lireIndex()).filter((r) => r.id !== id));
      return { ok: true };
    }
    throw new ErreurDossier("Méthode non gérée", 405);
  }

  if (sous !== "seances") throw new ErreurDossier("Adresse inconnue", 404);

  if (!seanceId && methode === "POST") {
    dossier.seances.push(nettoyerSeance(corps, id));
    return enregistrer(dossier);
  }

  const i = dossier.seances.findIndex((s) => s.id === seanceId);
  if (i < 0) throw new ErreurDossier("Séance introuvable", 404);
  if (methode === "PUT") {
    dossier.seances[i] = nettoyerSeance(corps, id, dossier.seances[i]);
    return enregistrer(dossier);
  }
  if (methode === "DELETE") {
    dossier.seances.splice(i, 1);
    return enregistrer(dossier);
  }
  throw new ErreurDossier("Méthode non gérée", 405);
}
