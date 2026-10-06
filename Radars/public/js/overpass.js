// Accès à l'API Overpass (données OpenStreetMap), avec plusieurs serveurs de secours.

const SERVEURS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

let prefere = 0;

export async function overpass(requete, { timeout = 25000 } = {}) {
  let derniereErreur;
  for (let essai = 0; essai < SERVEURS.length; essai++) {
    const i = (prefere + essai) % SERVEURS.length;
    const ctrl = new AbortController();
    const minuteur = setTimeout(() => ctrl.abort(), timeout);
    try {
      const rep = await fetch(SERVEURS[i], {
        method: "POST",
        body: new URLSearchParams({ data: requete }),
        signal: ctrl.signal,
      });
      if (!rep.ok) throw new Error(`Overpass ${rep.status}`);
      const json = await rep.json();
      prefere = i;
      return json;
    } catch (e) {
      derniereErreur = e;
    } finally {
      clearTimeout(minuteur);
    }
  }
  throw derniereErreur;
}

/** Limitation OSM (« 80 », « FR:urban », « 50 mph »…) → km/h, ou null si inconnue. */
export function lireVitesse(valeur) {
  if (!valeur) return null;
  const v = String(valeur).split(";")[0].trim();
  const implicites = {
    "FR:urban": 50,
    "FR:rural": 80,
    "FR:zone30": 30,
    "FR:walk": 20,
    "FR:motorway": 130,
    "FR:expressway": 110,
    walk: 20,
    "FR:zone20": 20,
  };
  if (implicites[v] != null) return implicites[v];
  const m = v.match(/^(\d+)\s*(mph)?$/);
  if (!m) return null;
  const n = Number(m[1]);
  return m[2] ? Math.round(n * 1.609) : n;
}
