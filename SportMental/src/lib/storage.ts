/**
 * Service de stockage local.
 *
 * - Une seule clé localStorage, enveloppe versionnée { version, savedAt, data }.
 * - Toute donnée lue (stockage ou import JSON) passe par `sanitize` : champs inconnus ignorés,
 *   valeurs invalides remplacées par des valeurs par défaut. Une ancienne version est migrée.
 * - Si localStorage est indisponible (navigation privée, quota plein, cookies bloqués),
 *   l'app continue en mémoire et signale le problème.
 */
import { DIMENSIONS, OUTILS_UTILISES, RESSENTIS, type DimensionId, type OutilId, type RessentiId } from "@/content/bilan";
import { TYPES_ERREUR, type ControleId, type TypeErreur } from "@/content/erreur";
import type { EnergyLevel } from "@/content/routine";
import type { VolleyPoste } from "@/content/sports";
import type { ProgramId, SportChoice } from "@/content/types";

export const STORAGE_KEY = "sport-mental";
export const SCHEMA_VERSION = 1;

export type Niveau = "debutant" | "loisir" | "intermediaire" | "confirme" | "competition";
export type Theme = "system" | "light" | "dark";

export type Profil = {
  prenom: string;
  sports: SportChoice[];
  sportActif: SportChoice;
  posteVolley: VolleyPoste | null;
  niveau: Niveau | null;
  classement: string;
  objectifPrincipal: string;
  preferences: {
    dureeRoutine: "courte" | "complete";
    pauseRespiration: boolean;
    vibrations: boolean;
    sons: boolean;
  };
  motCle: string;
  intentionsFavorites: string[];
  theme: Theme;
  onboarded: boolean;
};

export type RoutineSession = {
  id: string;
  date: string;
  energie: EnergyLevel | null;
  objectif: string | null;
  intention: string;
  motCle: string;
  planRebond: string | null;
};

export type ErreurLog = {
  id: string;
  date: string;
  type: TypeErreur | null;
  controle: ControleId | null;
};

export type MatchBilan = {
  id: string;
  date: string;
  sport: SportChoice;
  notes: Record<DimensionId, number>;
  momentRebond: string;
  pointFort: string;
  aAmeliorer: string;
  outils: OutilId[];
  resultat: "victoire" | "defaite" | null;
  ressenti: RessentiId | null;
  ressentiTexte: string;
};

export type Preuve = { id: string; date: string; texte: string };

export type ProgrammeProgress = { debut: string; joursTermines: number[] };

export type AppData = {
  profil: Profil;
  routines: RoutineSession[];
  erreurs: ErreurLog[];
  matchs: MatchBilan[];
  preuves: Preuve[];
  programmes: Partial<Record<ProgramId, ProgrammeProgress>>;
  programmeEnCours: ProgramId | null;
  /** Évite de répéter deux fois de suite le même message « Point suivant ». */
  dernierMessageId: string | null;
};

export const LIMITES = {
  texteCourt: 80,
  texteLong: 500,
  motCle: 20,
  liste: 500,
};

export function defaultData(): AppData {
  return {
    profil: {
      prenom: "",
      sports: [],
      sportActif: "autre",
      posteVolley: null,
      niveau: null,
      classement: "",
      objectifPrincipal: "",
      preferences: { dureeRoutine: "complete", pauseRespiration: true, vibrations: true, sons: false },
      motCle: "",
      intentionsFavorites: [],
      theme: "system",
      onboarded: false,
    },
    routines: [],
    erreurs: [],
    matchs: [],
    preuves: [],
    programmes: {},
    programmeEnCours: null,
    dernierMessageId: null,
  };
}

// ————————————————— Validation —————————————————

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown, max: number, fallback = ""): string =>
  typeof v === "string" ? v.slice(0, max) : fallback;
const bool = (v: unknown, fallback: boolean): boolean => (typeof v === "boolean" ? v : fallback);
function oneOf<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T;
function oneOf<T extends string>(v: unknown, allowed: readonly T[], fallback: null): T | null;
function oneOf<T extends string>(v: unknown, allowed: readonly T[], fallback: T | null): T | null {
  return typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;
}
const isoDate = (v: unknown): string | null =>
  typeof v === "string" && !Number.isNaN(Date.parse(v)) ? new Date(v).toISOString() : null;
const id = (v: unknown): string =>
  typeof v === "string" && /^[\w-]{1,64}$/.test(v) ? v : newId();
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v.slice(-LIMITES.liste) : []);

const SPORTS: readonly SportChoice[] = ["padel", "volley", "autre"];
const POSTES: readonly VolleyPoste[] = ["passeur", "libero", "attaquant", "receptionneur-attaquant", "central", "polyvalent"];
const NIVEAUX: readonly Niveau[] = ["debutant", "loisir", "intermediaire", "confirme", "competition"];
const PROGRAMMES: readonly ProgramId[] = ["erreurs", "confiance", "pression", "concentration"];
const CONTROLES: readonly ControleId[] = ["placement", "respiration", "communication", "intention", "prochain-coup"];
const TYPES: readonly TypeErreur[] = TYPES_ERREUR.map((t) => t.id);
const OUTILS: readonly OutilId[] = OUTILS_UTILISES.map((o) => o.id);
const RESS: readonly RessentiId[] = RESSENTIS.map((r) => r.id);

function sanitizeProfil(v: unknown): Profil {
  const d = defaultData().profil;
  if (!isObj(v)) return d;
  const sports = [...new Set(list(v.sports).filter((s): s is SportChoice => SPORTS.includes(s as SportChoice)))].slice(0, 2);
  const prefs = isObj(v.preferences) ? v.preferences : {};
  const sportActif = oneOf(v.sportActif, SPORTS, sports[0] ?? "autre");
  return {
    prenom: str(v.prenom, 40).trim(),
    sports,
    sportActif: sports.length && !sports.includes(sportActif) ? sports[0]! : sportActif,
    posteVolley: oneOf(v.posteVolley, POSTES, null),
    niveau: oneOf(v.niveau, NIVEAUX, null),
    classement: str(v.classement, 40),
    objectifPrincipal: str(v.objectifPrincipal, LIMITES.texteCourt * 2),
    preferences: {
      dureeRoutine: oneOf(prefs.dureeRoutine, ["courte", "complete"] as const, "complete"),
      pauseRespiration: bool(prefs.pauseRespiration, d.preferences.pauseRespiration),
      vibrations: bool(prefs.vibrations, d.preferences.vibrations),
      sons: bool(prefs.sons, d.preferences.sons),
    },
    motCle: str(v.motCle, LIMITES.motCle).trim(),
    intentionsFavorites: list(v.intentionsFavorites)
      .filter((x): x is string => typeof x === "string")
      .map((x) => x.slice(0, LIMITES.texteCourt * 2))
      .slice(0, 10),
    theme: oneOf(v.theme, ["system", "light", "dark"] as const, "system"),
    onboarded: bool(v.onboarded, false),
  };
}

function clampNote(v: unknown): number {
  const n = typeof v === "number" ? Math.round(v) : NaN;
  return Number.isFinite(n) ? Math.min(10, Math.max(1, n)) : 5;
}

function sanitizeMatch(v: unknown): MatchBilan | null {
  if (!isObj(v)) return null;
  const date = isoDate(v.date);
  if (!date || !isObj(v.notes)) return null;
  const notesIn = v.notes;
  const notes = Object.fromEntries(DIMENSIONS.map((d) => [d.id, clampNote(notesIn[d.id])])) as Record<DimensionId, number>;
  return {
    id: id(v.id),
    date,
    sport: oneOf(v.sport, SPORTS, "autre"),
    notes,
    momentRebond: str(v.momentRebond, LIMITES.texteLong),
    pointFort: str(v.pointFort, LIMITES.texteLong),
    aAmeliorer: str(v.aAmeliorer, LIMITES.texteLong),
    outils: [...new Set(list(v.outils).filter((o): o is OutilId => OUTILS.includes(o as OutilId)))],
    resultat: oneOf(v.resultat, ["victoire", "defaite"] as const, null),
    ressenti: oneOf(v.ressenti, RESS, null),
    ressentiTexte: str(v.ressentiTexte, LIMITES.texteLong),
  };
}

/** Transforme n'importe quelle donnée (stockage, import) en AppData valide. */
export function sanitize(raw: unknown): AppData {
  const d = defaultData();
  if (!isObj(raw)) return d;
  const progIn = isObj(raw.programmes) ? raw.programmes : {};
  const programmes: AppData["programmes"] = {};
  for (const p of PROGRAMMES) {
    const v = progIn[p];
    if (!isObj(v)) continue;
    programmes[p] = {
      debut: isoDate(v.debut) ?? new Date().toISOString(),
      joursTermines: [...new Set(list(v.joursTermines).filter((j): j is number => Number.isInteger(j) && (j as number) >= 1 && (j as number) <= 7))].sort(),
    };
  }
  return {
    profil: sanitizeProfil(raw.profil),
    routines: list(raw.routines).flatMap((r): RoutineSession[] => {
      if (!isObj(r)) return [];
      const date = isoDate(r.date);
      if (!date) return [];
      const e = r.energie;
      return [{
        id: id(r.id),
        date,
        energie: typeof e === "number" && [1, 2, 3, 4, 5].includes(e) ? (e as EnergyLevel) : null,
        objectif: typeof r.objectif === "string" ? r.objectif.slice(0, LIMITES.texteCourt * 2) : null,
        intention: str(r.intention, LIMITES.texteCourt * 2),
        motCle: str(r.motCle, LIMITES.motCle),
        planRebond: typeof r.planRebond === "string" ? r.planRebond.slice(0, LIMITES.texteCourt * 2) : null,
      }];
    }),
    erreurs: list(raw.erreurs).flatMap((e): ErreurLog[] => {
      if (!isObj(e)) return [];
      const date = isoDate(e.date);
      if (!date) return [];
      return [{ id: id(e.id), date, type: oneOf(e.type, TYPES, null), controle: oneOf(e.controle, CONTROLES, null) }];
    }),
    matchs: list(raw.matchs).map(sanitizeMatch).filter((m): m is MatchBilan => m !== null),
    preuves: list(raw.preuves).flatMap((p): Preuve[] => {
      if (!isObj(p)) return [];
      const date = isoDate(p.date);
      const texte = str(p.texte, LIMITES.texteLong).trim();
      return date && texte ? [{ id: id(p.id), date, texte }] : [];
    }),
    programmes,
    programmeEnCours: oneOf(raw.programmeEnCours, PROGRAMMES, null),
    dernierMessageId: typeof raw.dernierMessageId === "string" ? raw.dernierMessageId.slice(0, 64) : null,
  };
}

/** Migrations de schéma : ajouter ici une étape par version. */
export function migrate(envelope: unknown): AppData {
  if (!isObj(envelope)) return defaultData();
  const version = typeof envelope.version === "number" ? envelope.version : 0;
  const data: unknown = envelope.data;
  if (version > SCHEMA_VERSION) {
    // Données créées par une version plus récente : on garde ce qu'on comprend.
    return sanitize(data);
  }
  // v0 → v1 : pas de changement de structure (première version publique).
  return sanitize(data);
}

// ————————————————— Accès au stockage —————————————————

export type StorageStatus = "ok" | "unavailable" | "quota";

export type StorageBackend = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function getBrowserStorage(): StorageBackend | null {
  try {
    if (typeof window === "undefined") return null;
    const s = window.localStorage;
    const probe = `${STORAGE_KEY}:probe`;
    s.setItem(probe, "1");
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
}

export function readData(backend: StorageBackend | null): { data: AppData; status: StorageStatus } {
  if (!backend) return { data: defaultData(), status: "unavailable" };
  try {
    const raw = backend.getItem(STORAGE_KEY);
    if (!raw) return { data: defaultData(), status: "ok" };
    return { data: migrate(JSON.parse(raw)), status: "ok" };
  } catch {
    // JSON corrompu : on repart d'une base saine sans planter l'app.
    return { data: defaultData(), status: "ok" };
  }
}

export function writeData(backend: StorageBackend | null, data: AppData): StorageStatus {
  if (!backend) return "unavailable";
  try {
    backend.setItem(STORAGE_KEY, JSON.stringify({ version: SCHEMA_VERSION, savedAt: new Date().toISOString(), data }));
    return "ok";
  } catch (e) {
    const name = e instanceof DOMException ? e.name : "";
    return name === "QuotaExceededError" || name === "NS_ERROR_DOM_QUOTA_REACHED" ? "quota" : "unavailable";
  }
}

export function clearData(backend: StorageBackend | null): void {
  try {
    backend?.removeItem(STORAGE_KEY);
  } catch {
    /* rien à faire */
  }
}

// ————————————————— Export / import —————————————————

export function exportJson(data: AppData): string {
  return JSON.stringify(
    { app: "sport-mental", version: SCHEMA_VERSION, exportedAt: new Date().toISOString(), data },
    null,
    2,
  );
}

export type ImportResult = { ok: true; data: AppData } | { ok: false; error: string };

export function importJson(text: string): ImportResult {
  if (text.length > 5_000_000) return { ok: false, error: "Le fichier est trop volumineux." };
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: "Ce fichier n'est pas un JSON valide." };
  }
  if (!isObj(parsed) || parsed.app !== "sport-mental" || !isObj(parsed.data)) {
    return { ok: false, error: "Ce fichier ne vient pas d'un export Sport Mental." };
  }
  return { ok: true, data: migrate(parsed) };
}

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
