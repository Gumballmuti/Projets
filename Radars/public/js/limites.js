// Limitation de vitesse de la route sur laquelle on roule (tag maxspeed d'OpenStreetMap).

import { overpass, lireVitesse } from "./overpass.js";
import { cap, distance, ecartAngle, projectionSegment } from "./geo.js";

// Valeurs par défaut en France quand la route n'a pas de limitation renseignée.
const PAR_DEFAUT = { motorway: 130, motorway_link: 90, living_street: 20 };

/** Choisit la route la plus probable parmi les voies OSM autour de `pos`, en tenant compte du cap. */
export function choisirRoute(voies, pos, capActuel) {
  let best = null;
  for (const v of voies) {
    const g = v.geometry;
    if (!g || g.length < 2) continue;
    for (let i = 0; i < g.length - 1; i++) {
      const a = [g[i].lon, g[i].lat];
      const b = [g[i + 1].lon, g[i + 1].lat];
      const { distance: d } = projectionSegment(pos, a, b);
      let score = d;
      if (capActuel != null && distance(a, b) > 3) {
        const c = cap(a, b);
        const sens = v.tags.oneway === "yes" ? ecartAngle(c, capActuel) : Math.min(ecartAngle(c, capActuel), ecartAngle(c + 180, capActuel));
        score += sens > 60 ? 40 : sens / 3;
      }
      if (!best || score < best.score) best = { score, voie: v, distance: d };
    }
  }
  if (!best || best.distance > 35) return null;
  const t = best.voie.tags;
  const vitesse =
    lireVitesse(t["maxspeed:forward"] ?? t.maxspeed) ?? PAR_DEFAUT[t.highway] ?? null;
  return { vitesse, nom: t.ref ? `${t.ref}${t.name ? " · " + t.name : ""}` : t.name || "", type: t.highway };
}

let derniere = null;
let enCours = null;
let echec = 0;

/**
 * Limitation au point donné. Télécharge les routes dans un rayon de 200 m,
 * puis les réutilise tant qu'on ne s'est pas éloigné de plus de 150 m.
 */
export async function limiteIci(pos, capActuel) {
  const aJour = derniere && distance(derniere.pos, pos) < 150;
  if (!enCours && !aJour && Date.now() - echec > 20000) {
    const [lon, lat] = pos;
    enCours = overpass(
      `[out:json][timeout:10];way(around:200,${lat},${lon})["highway"~"^(motorway|trunk|primary|secondary|tertiary|unclassified|residential|motorway_link|trunk_link|primary_link|secondary_link|tertiary_link|living_street)$"];out tags geom;`,
      { timeout: 10000 },
    )
      .then(json => {
        derniere = { t: Date.now(), pos, voies: json.elements || [] };
      })
      .catch(() => (echec = Date.now()))
      .finally(() => (enCours = null));
    await enCours;
  }
  return derniere ? choisirRoute(derniere.voies, pos, capActuel) : null;
}
