// Calculs géographiques (distances en mètres, angles en degrés, coordonnées [lon, lat] comme GeoJSON).

const R = 6371008.8;
const rad = d => (d * Math.PI) / 180;
const deg = r => (r * 180) / Math.PI;

export function distance([lon1, lat1], [lon2, lat2]) {
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** Cap de a vers b, de 0 (nord) à 360, dans le sens des aiguilles d'une montre. */
export function cap([lon1, lat1], [lon2, lat2]) {
  const y = Math.sin(rad(lon2 - lon1)) * Math.cos(rad(lat2));
  const x = Math.cos(rad(lat1)) * Math.sin(rad(lat2)) - Math.sin(rad(lat1)) * Math.cos(rad(lat2)) * Math.cos(rad(lon2 - lon1));
  return (deg(Math.atan2(y, x)) + 360) % 360;
}

/** Écart entre deux caps, de 0 à 180. */
export function ecartAngle(a, b) {
  const d = Math.abs(((a - b) % 360) + 360) % 360;
  return d > 180 ? 360 - d : d;
}

/** Projection plane locale (suffisante à l'échelle de quelques kilomètres). */
function versXY([lon, lat], lat0) {
  return [rad(lon) * R * Math.cos(rad(lat0)), rad(lat) * R];
}

/** Point le plus proche de p sur le segment [a, b] : { distance, t } avec t ∈ [0, 1]. */
export function projectionSegment(p, a, b) {
  const lat0 = p[1];
  const [px, py] = versXY(p, lat0);
  const [ax, ay] = versXY(a, lat0);
  const [bx, by] = versXY(b, lat0);
  const dx = bx - ax;
  const dy = by - ay;
  const l2 = dx * dx + dy * dy;
  const t = l2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l2));
  return { distance: Math.hypot(px - (ax + t * dx), py - (ay + t * dy)), t };
}

/**
 * Point le plus proche de p sur une polyligne.
 * Renvoie { distance, index, t, parcouru } : `parcouru` = mètres depuis le début de la ligne.
 * `depuis` permet de ne chercher qu'à partir d'un segment (on n'avance que vers l'avant sur un itinéraire).
 */
export function projectionLigne(p, ligne, cumul = cumulDistances(ligne), depuis = 0) {
  let best = { distance: Infinity, index: 0, t: 0, parcouru: 0 };
  for (let i = Math.max(0, depuis); i < ligne.length - 1; i++) {
    const { distance: d, t } = projectionSegment(p, ligne[i], ligne[i + 1]);
    if (d < best.distance) {
      best = { distance: d, index: i, t, parcouru: cumul[i] + t * (cumul[i + 1] - cumul[i]) };
    }
  }
  return best;
}

export function cumulDistances(ligne) {
  const c = [0];
  for (let i = 1; i < ligne.length; i++) c.push(c[i - 1] + distance(ligne[i - 1], ligne[i]));
  return c;
}

/** Cercle approximé en polygone GeoJSON (pour dessiner une zone de danger). */
export function cercle(centre, rayon, pas = 32) {
  const [lon, lat] = centre;
  const pts = [];
  for (let i = 0; i <= pas; i++) {
    const a = (i / pas) * 2 * Math.PI;
    pts.push([
      lon + deg((rayon * Math.sin(a)) / (R * Math.cos(rad(lat)))),
      lat + deg((rayon * Math.cos(a)) / R),
    ]);
  }
  return pts;
}

export function formatDistance(m) {
  if (m < 50) return "maintenant";
  if (m < 1000) return `${Math.round(m / 10) * 10} m`;
  if (m < 10000) return `${(m / 1000).toFixed(1).replace(".", ",")} km`;
  return `${Math.round(m / 1000)} km`;
}

export function formatDuree(s) {
  const min = Math.round(s / 60);
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, "0")}`;
}
