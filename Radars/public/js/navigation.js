// Recherche d'adresse, calcul d'itinéraire (OSRM) et consignes en français.

import { cumulDistances } from "./geo.js";

async function obtenirJson(url, timeout = 15000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const rep = await fetch(url, { signal: ctrl.signal });
    if (!rep.ok) throw new Error(`${rep.status} ${url}`);
    return await rep.json();
  } finally {
    clearTimeout(t);
  }
}

/** Recherche d'adresses et de lieux : Géoplateforme (IGN, adresses françaises) puis Photon (lieux, étranger). */
export async function rechercher(texte, pres) {
  const q = encodeURIComponent(texte.trim());
  if (!q) return [];
  const proche = pres ? `&lat=${pres[1]}&lon=${pres[0]}` : "";
  const [ign, photon] = await Promise.allSettled([
    obtenirJson(`https://data.geopf.fr/geocodage/search?q=${q}&limit=5${proche}`),
    obtenirJson(`https://photon.komoot.io/api/?q=${q}&lang=fr&limit=5${proche}`),
  ]);
  const resultats = [];
  if (ign.status === "fulfilled") {
    for (const f of ign.value.features || []) {
      resultats.push({ nom: f.properties.label, detail: f.properties.context || "", pos: f.geometry.coordinates });
    }
  }
  if (photon.status === "fulfilled") {
    for (const f of photon.value.features || []) {
      const p = f.properties;
      const rue = [p.housenumber, p.street].filter(Boolean).join(" ");
      const nom = p.name || rue || p.city;
      if (!nom) continue;
      const detail = [p.name && rue, p.postcode, p.city, p.country !== "France" && p.country].filter(Boolean).join(", ");
      resultats.push({ nom, detail, pos: f.geometry.coordinates });
    }
  }
  return resultats.slice(0, 8);
}

const SERVEURS_OSRM = [
  "https://router.project-osrm.org/route/v1/driving/",
  "https://routing.openstreetmap.de/routed-car/route/v1/driving/",
];

/**
 * Itinéraires en voiture de `depart` à `arrivee` ([lon, lat]).
 * Renvoie une liste (meilleur d'abord) de { ligne, cumul, distance, duree, etapes, peages }.
 */
export async function itineraires(depart, arrivee, { sansPeage = false } = {}) {
  const coords = `${depart.join(",")};${arrivee.join(",")}`;
  const params = "?overview=full&geometries=geojson&steps=true&alternatives=true";
  let derniereErreur;
  for (const serveur of SERVEURS_OSRM) {
    for (const exclure of sansPeage ? ["&exclude=toll", ""] : [""]) {
      try {
        const json = await obtenirJson(serveur + coords + params + exclure, 20000);
        if (json.code !== "Ok" || !json.routes?.length) throw new Error(json.message || json.code);
        return json.routes.map(r => convertir(r, sansPeage && !exclure));
      } catch (e) {
        derniereErreur = e;
      }
    }
  }
  throw derniereErreur;
}

function convertir(route, peageNonEvite) {
  const ligne = route.geometry.coordinates;
  const cumul = cumulDistances(ligne);
  const etapes = [];
  let parcouru = 0;
  for (const leg of route.legs) {
    for (const s of leg.steps) {
      etapes.push({
        pos: s.maneuver.location,
        debut: parcouru,
        texte: consigne(s),
        type: s.maneuver.type,
        modif: s.maneuver.modifier || "",
        route: [s.ref, s.name].filter(Boolean).join(" · "),
      });
      parcouru += s.distance;
    }
  }
  // Les distances OSRM et celles de la géométrie diffèrent légèrement : on recale sur la géométrie.
  const echelle = parcouru > 0 ? cumul[cumul.length - 1] / parcouru : 1;
  for (const e of etapes) e.debut *= echelle;
  const peages = route.legs.some(l => l.steps.some(s => s.intersections?.some(i => i.classes?.includes("toll"))));
  return { ligne, cumul, distance: route.distance, duree: route.duration, etapes, peages, peageNonEvite };
}

const DIRECTIONS = {
  uturn: "faites demi-tour",
  "sharp right": "tournez franchement à droite",
  right: "tournez à droite",
  "slight right": "serrez à droite",
  straight: "continuez tout droit",
  "slight left": "serrez à gauche",
  left: "tournez à gauche",
  "sharp left": "tournez franchement à gauche",
};

const ORDINAUX = ["", "première", "deuxième", "troisième", "quatrième", "cinquième", "sixième", "septième", "huitième"];

function maj(t) {
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/** Consigne en français pour une étape OSRM. */
export function consigne(s) {
  const m = s.maneuver;
  const dir = DIRECTIONS[m.modifier] || "continuez";
  const nom = s.ref && s.name ? `${s.name} (${s.ref})` : s.name || s.ref || "";
  const vers = nom ? ` sur ${nom}` : "";
  const dest = s.destinations ? ` direction ${s.destinations.split(":").pop().split(",")[0].trim()}` : "";
  switch (m.type) {
    case "depart":
      return `Partez${vers}`;
    case "arrive":
      return "Vous êtes arrivée à destination";
    case "roundabout":
    case "rotary": {
      const sortie = m.exit && ORDINAUX[m.exit] ? `prenez la ${ORDINAUX[m.exit]} sortie` : "sortez";
      return `Au rond-point, ${sortie}${vers}`;
    }
    case "exit roundabout":
    case "exit rotary":
      return `Sortez du rond-point${vers}`;
    case "on ramp":
      return `Prenez la bretelle${dest || vers}`;
    case "off ramp":
      return `Prenez la sortie${dest || vers}`;
    case "fork":
      return `À l'embranchement, ${m.modifier?.includes("left") ? "restez à gauche" : "restez à droite"}${dest || vers}`;
    case "merge":
      return `Rejoignez${vers || " la voie"}`;
    case "end of road":
      return `Au bout de la route, ${dir}${vers}`;
    case "new name":
    case "continue":
      if (!m.modifier || m.modifier === "straight") return `Continuez${vers}`;
      return `${maj(dir)}${vers}`;
    default:
      return `${maj(dir)}${vers}`;
  }
}
