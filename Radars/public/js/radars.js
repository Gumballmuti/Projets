// Radars fixes issus d'OpenStreetMap, mis en cache par cases de 0,25° pendant 7 jours.

import { overpass, lireVitesse } from "./overpass.js";
import { distance } from "./geo.js";

const TAILLE = 0.25;
const DUREE_CACHE = 7 * 24 * 3600 * 1000;
const PAR_REQUETE = 12;

export const TYPES = {
  fixe: { nom: "Radar fixe", icone: "📷", couleur: "#e5484d" },
  feu: { nom: "Radar feu rouge", icone: "🚦", couleur: "#e5484d" },
  troncon: { nom: "Radar tronçon", icone: "📏", couleur: "#e5484d" },
  passage: { nom: "Radar passage à niveau", icone: "🚂", couleur: "#e5484d" },
  mobile: { nom: "Radar mobile", icone: "🚓", couleur: "#f76b15" },
  police: { nom: "Contrôle", icone: "👮", couleur: "#3e63dd" },
  danger: { nom: "Danger", icone: "⚠️", couleur: "#ffb224" },
  bouchon: { nom: "Bouchon", icone: "🚗", couleur: "#ad7f58" },
};

const ENFORCEMENT = {
  maxspeed: "fixe",
  average_speed: "troncon",
  traffic_signals: "feu",
  level_crossing: "passage",
};

/** Transforme une réponse Overpass en liste de radars { id, type, pos:[lon,lat], vitesse, fin? }. */
export function analyserOverpass(json) {
  const noeuds = new Map();
  for (const e of json.elements || []) if (e.type === "node") noeuds.set(e.id, e);
  const radars = new Map();
  const posNoeud = id => {
    const n = noeuds.get(id);
    return n ? [n.lon, n.lat] : null;
  };

  for (const e of json.elements || []) {
    if (e.type !== "relation" || e.tags?.type !== "enforcement") continue;
    const type = ENFORCEMENT[e.tags.enforcement];
    if (!type) continue;
    const role = r => e.members.find(m => m.type === "node" && m.role === r)?.ref;
    const device = role("device");
    const from = role("from");
    const to = role("to");
    const pos = posNoeud(type === "troncon" ? from ?? device : device ?? from);
    if (!pos) continue;
    const id = type === "troncon" ? `r${e.id}` : device ? `n${device}` : `r${e.id}`;
    const vitesse = lireVitesse(e.tags.maxspeed) ?? lireVitesse(noeuds.get(device)?.tags?.maxspeed);
    const radar = { id, type, pos, vitesse };
    if (type === "troncon" && posNoeud(to)) radar.fin = posNoeud(to);
    radars.set(id, radar);
  }

  for (const n of noeuds.values()) {
    if (n.tags?.highway !== "speed_camera" || radars.has(`n${n.id}`)) continue;
    radars.set(`n${n.id}`, { id: `n${n.id}`, type: "fixe", pos: [n.lon, n.lat], vitesse: lireVitesse(n.tags.maxspeed) });
  }

  // Une même installation est parfois cartographiée deux fois (nœud seul + relation).
  const liste = [...radars.values()];
  return liste.filter(
    (r, i) => !liste.some((o, j) => j < i && o.type === r.type && distance(o.pos, r.pos) < 30),
  );
}

const cle = (x, y) => `radars:${x}:${y}`;
export const caseDe = ([lon, lat]) => [Math.floor(lon / TAILLE), Math.floor(lat / TAILLE)];

function lireCache(x, y) {
  try {
    const c = JSON.parse(localStorage.getItem(cle(x, y)));
    if (c && Date.now() - c.t < DUREE_CACHE) return c.radars;
  } catch {}
  return null;
}

function ecrireCache(x, y, radars) {
  try {
    localStorage.setItem(cle(x, y), JSON.stringify({ t: Date.now(), radars }));
  } catch {}
}

function requete(cases) {
  const bbox = ([x, y]) => `(${y * TAILLE},${x * TAILLE},${(y + 1) * TAILLE},${(x + 1) * TAILLE})`;
  const parties = cases
    .map(c => `node["highway"="speed_camera"]${bbox(c)};relation["type"="enforcement"]${bbox(c)};`)
    .join("");
  return `[out:json][timeout:60];(${parties});out body;>;out body qt;`;
}

const enCours = new Map();

/**
 * Renvoie les radars des cases demandées (cache, sinon Overpass).
 * `cases` est une liste de [x, y] ; les doublons sont ignorés.
 */
export async function chargerCases(cases) {
  const uniques = [...new Map(cases.map(c => [c.join(":"), c])).values()];
  const resultat = [];
  const manquantes = [];
  for (const [x, y] of uniques) {
    const c = lireCache(x, y);
    if (c) resultat.push(...c);
    else manquantes.push([x, y]);
  }

  for (let i = 0; i < manquantes.length; i += PAR_REQUETE) {
    const lot = manquantes.slice(i, i + PAR_REQUETE);
    const k = lot.map(c => c.join(":")).join("|");
    if (!enCours.has(k)) {
      enCours.set(
        k,
        overpass(requete(lot), { timeout: 60000 })
          .then(json => {
            const radars = analyserOverpass(json);
            for (const [x, y] of lot) {
              const dans = radars.filter(r => caseDe(r.pos)[0] === x && caseDe(r.pos)[1] === y);
              ecrireCache(x, y, dans);
            }
            return radars;
          })
          .finally(() => enCours.delete(k)),
      );
    }
    try {
      resultat.push(...(await enCours.get(k)));
    } catch (e) {
      console.warn("Radars indisponibles pour", lot, e);
    }
  }
  return [...new Map(resultat.map(r => [r.id, r])).values()];
}

/** Cases autour d'un point (rayon en cases). */
export function casesAutour(pos, rayon = 1) {
  const [cx, cy] = caseDe(pos);
  const cases = [];
  for (let dx = -rayon; dx <= rayon; dx++) for (let dy = -rayon; dy <= rayon; dy++) cases.push([cx + dx, cy + dy]);
  return cases;
}

/** Cases traversées par un itinéraire. */
export function casesLeLong(ligne) {
  const vues = new Map();
  for (const p of ligne) {
    const [x, y] = caseDe(p);
    vues.set(`${x}:${y}`, [x, y]);
  }
  return [...vues.values()];
}

/**
 * Longueur de la « zone de danger » annoncée avant un radar, selon le type de route
 * (comme Coyote / Waze en France : on annonce une zone, pas l'emplacement exact).
 */
export function rayonZone(radar, vitesseActuelle = 0) {
  const v = radar.vitesse;
  if (v >= 110) return 2000;
  if (v >= 70) return 1000;
  if (v) return 400;
  return Math.max(400, Math.min(2000, (vitesseActuelle / 3.6) * 40));
}
