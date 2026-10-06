// Tes propres signalements (radar mobile, contrôle, danger…), gardés sur le téléphone.

const CLE = "signalements";

// Durée de vie d'un signalement, en heures (null = permanent).
export const DUREES = { mobile: 3, police: 2, danger: 1, bouchon: 1, fixe: null, feu: null, troncon: null };

export function lister() {
  try {
    const tous = JSON.parse(localStorage.getItem(CLE)) || [];
    const vivants = tous.filter(s => !s.expire || s.expire > Date.now());
    if (vivants.length !== tous.length) enregistrer(vivants);
    return vivants;
  } catch {
    return [];
  }
}

function enregistrer(liste) {
  localStorage.setItem(CLE, JSON.stringify(liste));
}

export function ajouter(type, pos, vitesse = null) {
  const h = DUREES[type];
  const s = {
    id: `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    type,
    pos,
    vitesse,
    cree: Date.now(),
    expire: h ? Date.now() + h * 3600 * 1000 : null,
    perso: true,
  };
  enregistrer([...lister(), s]);
  return s;
}

export function supprimer(id) {
  enregistrer(lister().filter(s => s.id !== id));
}

/** Prolonge un signalement encore présent (« toujours là »). */
export function confirmer(id) {
  const liste = lister();
  const s = liste.find(x => x.id === id);
  if (s?.expire) s.expire = Date.now() + DUREES[s.type] * 3600 * 1000;
  enregistrer(liste);
}

export function exporter() {
  return JSON.stringify({ version: 1, signalements: lister() }, null, 2);
}

export function importer(texte) {
  const { signalements } = JSON.parse(texte);
  if (!Array.isArray(signalements)) throw new Error("Fichier invalide");
  const actuels = lister();
  const ids = new Set(actuels.map(s => s.id));
  const nouveaux = signalements.filter(s => s?.id && Array.isArray(s.pos) && !ids.has(s.id));
  enregistrer([...actuels, ...nouveaux]);
  return nouveaux.length;
}
