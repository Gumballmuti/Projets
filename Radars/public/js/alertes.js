// Moteur d'alertes : décide quand on entre ou sort d'une zone de danger.

import { cap, distance, ecartAngle, projectionLigne, projectionSegment } from "./geo.js";
import { rayonZone } from "./radars.js";

/** Radars situés sur un itinéraire : Map id → mètres depuis le départ. */
export function surItineraire(points, route, tolerance = 35) {
  const res = new Map();
  for (const p of points) {
    const proj = projectionLigne(p.pos, route.ligne, route.cumul);
    if (proj.distance <= tolerance) res.set(p.id, proj.parcouru);
  }
  return res;
}

export class Alertes {
  constructor() {
    this.actives = new Map();
    this.passes = new Map();
  }

  /**
   * @param etat { pos, cap, vitesse (km/h), points, route?: { surRoute: Map, parcouru } }
   * @returns { nouvelles: [], zone: point le plus proche parmi les zones actives (ou null) }
   */
  evaluer({ pos, cap: monCap, vitesse, points, route }) {
    const maintenant = Date.now();
    for (const [id, t] of this.passes) if (maintenant - t > 10 * 60 * 1000) this.passes.delete(id);

    const nouvelles = [];
    const parId = new Map(points.map(p => [p.id, p]));

    for (const [id, p] of this.actives) {
      if (!parId.has(id) || this.estSorti(p, pos, monCap, vitesse)) {
        this.actives.delete(id);
        this.passes.set(id, maintenant);
      }
    }

    if (vitesse < 10) return this.resultat(pos, nouvelles);

    for (const p of points) {
      if (this.actives.has(p.id) || this.passes.has(p.id)) continue;
      const d = distance(pos, p.pos);
      if (d > rayonZone(p, vitesse)) continue;
      if (!this.devant(p, pos, monCap, d, route)) continue;
      this.actives.set(p.id, p);
      nouvelles.push(p);
    }
    return this.resultat(pos, nouvelles);
  }

  devant(p, pos, monCap, d, route) {
    if (route?.surRoute) {
      const k = route.surRoute.get(p.id);
      return k != null && k > route.parcouru - 20;
    }
    if (monCap == null) return false;
    return ecartAngle(monCap, cap(pos, p.pos)) < (d < 300 ? 60 : 35);
  }

  estSorti(p, pos, monCap, vitesse) {
    if (p.type === "troncon" && p.fin) {
      if (distance(pos, p.fin) < 150) return true;
      return projectionSegment(pos, p.pos, p.fin).distance > 1500;
    }
    const d = distance(pos, p.pos);
    if (d > rayonZone(p, vitesse) + 400) return true;
    // Dépassé : le point est derrière nous.
    return monCap != null && d > 80 && ecartAngle(monCap, cap(pos, p.pos)) > 100;
  }

  resultat(pos, nouvelles) {
    let zone = null;
    let dmin = Infinity;
    for (const p of this.actives.values()) {
      const d = distance(pos, p.pos);
      if (d < dmin) [zone, dmin] = [p, d];
    }
    return { nouvelles, zone };
  }

  reinitialiser() {
    this.actives.clear();
    this.passes.clear();
  }
}
