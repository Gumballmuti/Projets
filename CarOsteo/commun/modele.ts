// Modèle des dossiers patients CarOstéo et définition des champs affichés.

export type Specialty = "generale" | "migraine" | "atm" | "sport";
export type Json = Record<string, string | string[]>;

export interface Patient {
  id: string;
  last_name: string;
  first_name: string;
  birth_date: string | null;
  sex: "F" | "M" | "X" | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  profession: string | null;
  niss: string | null;
  mutuelle: string | null;
  referring_doctor: string | null;
  dentist: string | null;
  emergency_contact: string | null;
  dominant_hand: string | null;
  specialties: Specialty[];
  main_complaint: string | null;
  history_medical: string | null;
  history_surgical: string | null;
  history_trauma: string | null;
  history_family: string | null;
  treatments: string | null;
  allergies: string | null;
  contraindications: string | null;
  lifestyle: string | null;
  migraine_profile: Json;
  atm_profile: Json;
  sport_profile: Json;
  notes: string | null;
  consent_at: string | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Consultation {
  id: string;
  patient_id: string;
  seance_date: string;
  kind: "premiere" | "suivi" | "urgence" | "bilan";
  focus: Specialty;
  reason: string | null;
  anamnesis: string | null;
  pain_before: number | null;
  pain_after: number | null;
  exam: string | null;
  diagnosis: string | null;
  zones: string[];
  treatment: string | null;
  advice: string | null;
  specifics: Json;
  next_step: string | null;
  created_at: string;
  updated_at: string;
}

export const SPECIALTIES: { value: Specialty; label: string; short: string }[] = [
  { value: "generale", label: "Ostéopathie générale", short: "Général" },
  { value: "migraine", label: "Migraines & céphalées", short: "Migraine" },
  { value: "atm", label: "Mâchoire & ATM", short: "ATM" },
  { value: "sport", label: "Suivi sportif", short: "Sport" },
];
export const specialtyLabel = (s: string) => SPECIALTIES.find((x) => x.value === s)?.short ?? s;

export const KINDS = [
  { value: "premiere", label: "Première consultation" },
  { value: "suivi", label: "Séance de suivi" },
  { value: "urgence", label: "Urgence / crise" },
  { value: "bilan", label: "Bilan" },
];
export const kindLabel = (k: string) => KINDS.find((x) => x.value === k)?.label ?? k;

export const ZONES = [
  "Crâne", "ATM", "Cervicales", "Dorsales", "Lombaires", "Bassin / Sacrum",
  "Côtes / Thorax", "Diaphragme", "Viscéral", "Épaule D", "Épaule G",
  "Coude / Poignet", "Hanche", "Genou", "Cheville / Pied",
];

export type FieldType = "text" | "textarea" | "select" | "number" | "multi";
export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  placeholder?: string;
  wide?: boolean;
}

// ---- Bilans de spécialité (fiche patient)

export const MIGRAINE_FIELDS: FieldDef[] = [
  { key: "type", label: "Type de céphalée", type: "select",
    options: ["Migraine sans aura", "Migraine avec aura", "Céphalée de tension", "Arnoldite / névralgie d'Arnold", "Mixte", "À préciser"] },
  { key: "frequence", label: "Fréquence des crises", type: "text", placeholder: "ex. 3 / mois" },
  { key: "duree", label: "Durée d'une crise", type: "text", placeholder: "ex. 4 h à 2 jours" },
  { key: "intensite", label: "Intensité habituelle (0–10)", type: "number" },
  { key: "localisation", label: "Localisation", type: "multi",
    options: ["Frontale", "Temporale D", "Temporale G", "Occipitale", "Rétro-orbitaire", "Vertex", "Hémicrânie", "Nuque"] },
  { key: "signes", label: "Signes associés", type: "multi",
    options: ["Nausées", "Vomissements", "Photophobie", "Phonophobie", "Aura visuelle", "Vertiges", "Raideur nucale"] },
  { key: "declencheurs", label: "Facteurs déclenchants", type: "multi",
    options: ["Stress", "Manque de sommeil", "Cycle hormonal", "Alimentation", "Écrans", "Météo", "Posture", "Alcool", "Effort"] },
  { key: "traitement_crise", label: "Traitement de crise", type: "text" },
  { key: "traitement_fond", label: "Traitement de fond", type: "text" },
  { key: "suivi_medical", label: "Suivi neurologue / médecin", type: "text" },
  { key: "remarques", label: "Remarques", type: "textarea", wide: true },
];

export const ATM_FIELDS: FieldDef[] = [
  { key: "bruxisme", label: "Bruxisme", type: "select", options: ["Non", "Nocturne", "Diurne", "Nocturne + diurne", "Suspecté"] },
  { key: "ouverture", label: "Ouverture buccale (mm)", type: "number" },
  { key: "deviation", label: "Trajet d'ouverture", type: "select", options: ["Rectiligne", "Déviation D", "Déviation G", "Déflexion D", "Déflexion G", "En baïonnette"] },
  { key: "bruits", label: "Bruits articulaires", type: "multi", options: ["Claquement D", "Claquement G", "Crépitement D", "Crépitement G", "Aucun"] },
  { key: "blocage", label: "Blocage", type: "select", options: ["Non", "Bouche ouverte", "Bouche fermée", "Intermittent"] },
  { key: "douleurs", label: "Douleurs", type: "multi", options: ["ATM D", "ATM G", "Masséters", "Temporaux", "Ptérygoïdiens", "Oreille", "Dents"] },
  { key: "associes", label: "Signes associés", type: "multi", options: ["Acouphènes", "Otalgie", "Vertiges", "Céphalées", "Cervicalgies"] },
  { key: "gouttiere", label: "Gouttière", type: "select", options: ["Non", "Oui – nuit", "Oui – jour et nuit", "Ancienne"] },
  { key: "orthodontie", label: "Orthodontie / soins dentaires", type: "text" },
  { key: "langue", label: "Position de langue / déglutition", type: "text" },
  { key: "remarques", label: "Remarques", type: "textarea", wide: true },
];

export const SPORT_FIELDS: FieldDef[] = [
  { key: "sport", label: "Sport(s)", type: "text" },
  { key: "niveau", label: "Niveau", type: "select", options: ["Loisir", "Régional", "National", "International / pro"] },
  { key: "volume", label: "Entraînements / semaine", type: "text", placeholder: "ex. 4 × 1h30" },
  { key: "poste", label: "Poste / discipline", type: "text" },
  { key: "objectifs", label: "Objectifs / compétitions à venir", type: "text", wide: true },
  { key: "blessures", label: "Blessures antérieures", type: "textarea", wide: true },
  { key: "equipe", label: "Kiné / coach / préparateur", type: "text" },
  { key: "remarques", label: "Remarques", type: "textarea", wide: true },
];

export const PROFILE_FIELDS: Record<Exclude<Specialty, "generale">, { title: string; field: "migraine_profile" | "atm_profile" | "sport_profile"; defs: FieldDef[] }> = {
  migraine: { title: "Bilan migraines & céphalées", field: "migraine_profile", defs: MIGRAINE_FIELDS },
  atm: { title: "Bilan mâchoire & ATM", field: "atm_profile", defs: ATM_FIELDS },
  sport: { title: "Bilan sportif", field: "sport_profile", defs: SPORT_FIELDS },
};

// ---- Mesures propres à une séance, selon son orientation

export const SESSION_SPECIFICS: Record<Specialty, FieldDef[]> = {
  generale: [],
  migraine: [
    { key: "crises", label: "Crises depuis la dernière séance", type: "number" },
    { key: "intensite_moy", label: "Intensité moyenne (0–10)", type: "number" },
    { key: "medication", label: "Prises médicamenteuses", type: "text" },
    { key: "evolution", label: "Évolution", type: "select", options: ["Nette amélioration", "Amélioration", "Stable", "Aggravation"] },
  ],
  atm: [
    { key: "ouverture", label: "Ouverture buccale (mm)", type: "number" },
    { key: "deviation", label: "Trajet d'ouverture", type: "select", options: ["Rectiligne", "Déviation D", "Déviation G", "Déflexion D", "Déflexion G", "En baïonnette"] },
    { key: "bruits", label: "Bruits", type: "multi", options: ["Claquement D", "Claquement G", "Crépitement D", "Crépitement G", "Aucun"] },
    { key: "palpation", label: "Douleur à la palpation", type: "text" },
  ],
  sport: [
    { key: "phase", label: "Phase", type: "select", options: ["Prévention", "Blessure aiguë", "Rééducation", "Reprise progressive", "Retour à la compétition"] },
    { key: "charge", label: "Charge d'entraînement actuelle", type: "text" },
    { key: "reprise", label: "Reprise envisagée", type: "text" },
  ],
};

export function age(birth: string | null): string {
  if (!birth) return "";
  const b = new Date(birth);
  const n = new Date();
  let a = n.getFullYear() - b.getFullYear();
  if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) a--;
  return `${a} ans`;
}

export function fmtDate(d: string | null): string {
  if (!d) return "";
  return new Date(d.length === 10 ? d + "T12:00:00" : d).toLocaleDateString("fr-BE", { day: "numeric", month: "long", year: "numeric" });
}

/** Un dossier = la fiche du patient + l'historique de ses séances (plus récente en premier). */
export interface Dossier {
  patient: Patient;
  seances: Consultation[];
}

/** Ligne de la liste des patients. */
export interface Resume {
  id: string;
  last_name: string;
  first_name: string;
  birth_date: string | null;
  phone: string | null;
  specialties: Specialty[];
  main_complaint: string | null;
  archived: boolean;
  updated_at: string;
  derniere_seance: string | null;
  nb_seances: number;
}

export const CHAMPS_TEXTE_COURT = [
  "last_name", "first_name", "phone", "email", "profession", "niss", "mutuelle",
  "referring_doctor", "dentist", "emergency_contact", "main_complaint",
] as const;

export const CHAMPS_TEXTE_LONG = [
  "address", "history_medical", "history_surgical", "history_trauma", "history_family",
  "treatments", "allergies", "contraindications", "lifestyle", "notes",
] as const;

export const CHAMPS_SEANCE_TEXTE = ["reason", "anamnesis", "exam", "diagnosis", "treatment", "advice", "next_step"] as const;
