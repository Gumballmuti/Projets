import { test } from "node:test";
import assert from "node:assert/strict";

// localStorage minimal pour les modules qui gardent des données sur le téléphone.
const memoire = new Map();
globalThis.localStorage = {
  getItem: k => (memoire.has(k) ? memoire.get(k) : null),
  setItem: (k, v) => memoire.set(k, String(v)),
  removeItem: k => memoire.delete(k),
};

const geo = await import("../public/js/geo.js");
const { lireVitesse } = await import("../public/js/overpass.js");
const { analyserOverpass, rayonZone, casesLeLong } = await import("../public/js/radars.js");
const { choisirRoute } = await import("../public/js/limites.js");
const { consigne } = await import("../public/js/navigation.js");
const { Alertes, surItineraire } = await import("../public/js/alertes.js");
const signalements = await import("../public/js/signalements.js");

// Avance de `m` mètres vers le nord / l'est.
const nord = ([lon, lat], m) => [lon, lat + m / 111195];
const est = ([lon, lat], m) => [lon + m / (111195 * Math.cos((lat * Math.PI) / 180)), lat];
const PARIS = [2.3522, 48.8566];

test("distances et caps", () => {
  assert.ok(Math.abs(geo.distance(PARIS, nord(PARIS, 1000)) - 1000) < 1);
  assert.ok(Math.abs(geo.cap(PARIS, nord(PARIS, 100)) - 0) < 0.5);
  assert.ok(Math.abs(geo.cap(PARIS, est(PARIS, 100)) - 90) < 0.5);
  assert.equal(geo.ecartAngle(350, 10), 20);
  assert.equal(geo.ecartAngle(90, 270), 180);
});

test("projection sur une polyligne", () => {
  const ligne = [PARIS, nord(PARIS, 1000), est(nord(PARIS, 1000), 1000)];
  const p = est(nord(PARIS, 500), 20);
  const r = geo.projectionLigne(p, ligne);
  assert.equal(r.index, 0);
  assert.ok(Math.abs(r.distance - 20) < 1);
  assert.ok(Math.abs(r.parcouru - 500) < 2);
  const q = nord(est(nord(PARIS, 1000), 400), 10);
  assert.ok(Math.abs(geo.projectionLigne(q, ligne).parcouru - 1400) < 3);
});

test("formats", () => {
  assert.equal(geo.formatDistance(30), "maintenant");
  assert.equal(geo.formatDistance(347), "350 m");
  assert.equal(geo.formatDistance(2340), "2,3 km");
  assert.equal(geo.formatDistance(23400), "23 km");
  assert.equal(geo.formatDuree(25 * 60), "25 min");
  assert.equal(geo.formatDuree(80 * 60), "1 h 20");
});

test("limitations OSM", () => {
  assert.equal(lireVitesse("80"), 80);
  assert.equal(lireVitesse("FR:urban"), 50);
  assert.equal(lireVitesse("FR:rural"), 80);
  assert.equal(lireVitesse("30 mph"), 48);
  assert.equal(lireVitesse("50;30"), 50);
  assert.equal(lireVitesse("none"), null);
  assert.equal(lireVitesse(undefined), null);
});

test("analyse d'une réponse Overpass", () => {
  const json = {
    elements: [
      { type: "node", id: 1, lat: 48.8, lon: 2.3, tags: { highway: "speed_camera", maxspeed: "80" } },
      { type: "node", id: 2, lat: 48.9, lon: 2.4, tags: { highway: "speed_camera" } },
      { type: "node", id: 3, lat: 48.95, lon: 2.45 },
      { type: "node", id: 4, lat: 48.99, lon: 2.49 },
      { type: "node", id: 5, lat: 48.7, lon: 2.2 },
      { type: "node", id: 6, lat: 48.70001, lon: 2.20001, tags: { highway: "speed_camera" } },
      {
        type: "relation", id: 10, tags: { type: "enforcement", enforcement: "maxspeed", maxspeed: "110" },
        members: [{ type: "node", ref: 2, role: "device" }],
      },
      {
        type: "relation", id: 11, tags: { type: "enforcement", enforcement: "average_speed", maxspeed: "90" },
        members: [{ type: "node", ref: 3, role: "from" }, { type: "node", ref: 4, role: "to" }],
      },
      {
        type: "relation", id: 12, tags: { type: "enforcement", enforcement: "traffic_signals" },
        members: [{ type: "node", ref: 5, role: "device" }],
      },
      { type: "relation", id: 13, tags: { type: "enforcement", enforcement: "check" }, members: [] },
    ],
  };
  const radars = analyserOverpass(json);
  const parId = Object.fromEntries(radars.map(r => [r.id, r]));
  assert.deepEqual(parId.n1, { id: "n1", type: "fixe", pos: [2.3, 48.8], vitesse: 80 });
  assert.equal(parId.n2.vitesse, 110, "la relation donne sa limitation au radar");
  assert.equal(parId.r11.type, "troncon");
  assert.deepEqual(parId.r11.fin, [2.49, 48.99]);
  assert.equal(parId.n5.type, "feu");
  // Le nœud 6, à 1 m du radar feu rouge mais de type différent, est conservé.
  assert.ok(parId.n6);
  assert.equal(radars.length, 5);
});

test("taille des zones de danger", () => {
  assert.equal(rayonZone({ vitesse: 130 }), 2000);
  assert.equal(rayonZone({ vitesse: 80 }), 1000);
  assert.equal(rayonZone({ vitesse: 50 }), 400);
  assert.equal(rayonZone({ vitesse: null }, 90), 1000);
  assert.equal(rayonZone({ vitesse: null }, 10), 400);
});

test("cases le long d'un itinéraire", () => {
  const cases = casesLeLong([[2.01, 48.01], [2.1, 48.1], [2.3, 48.3]]);
  assert.deepEqual(cases, [[8, 192], [9, 193]]);
});

test("choix de la route sous mes roues", () => {
  const g = pts => pts.map(([lon, lat]) => ({ lon, lat }));
  const a = PARIS;
  const voies = [
    { tags: { highway: "primary", maxspeed: "70", name: "Avenue Nord", ref: "D1" }, geometry: g([a, nord(a, 500)]) },
    { tags: { highway: "residential", maxspeed: "30", name: "Rue Est" }, geometry: g([est(a, -300), est(a, 300)]) },
    { tags: { highway: "motorway", name: "Loin" }, geometry: g([est(a, 500), nord(est(a, 500), 500)]) },
  ];
  // Au carrefour, je roule vers le nord : c'est l'avenue.
  const r = choisirRoute(voies, nord(a, 5), 0);
  assert.equal(r.vitesse, 70);
  assert.equal(r.nom, "D1 · Avenue Nord");
  // Je roule vers l'est : c'est la rue.
  assert.equal(choisirRoute(voies, est(a, 5), 90).vitesse, 30);
  // Autoroute sans limitation renseignée : 130 par défaut.
  assert.equal(choisirRoute(voies, est(nord(a, 200), 500), 0).vitesse, 130);
  // Trop loin de toute route.
  assert.equal(choisirRoute(voies, est(nord(a, 250), 250), 0), null);
});

test("consignes en français", () => {
  const m = (type, modifier, extra = {}) => ({ maneuver: { type, modifier, ...extra }, name: "", ref: "" });
  assert.equal(consigne({ ...m("turn", "right"), name: "Rue de Rivoli" }), "Tournez à droite sur Rue de Rivoli");
  assert.equal(consigne(m("roundabout", "right", { exit: 2 })), "Au rond-point, prenez la deuxième sortie");
  assert.equal(consigne({ ...m("off ramp", "slight right"), destinations: "A6: Lyon, Paris" }), "Prenez la sortie direction Lyon");
  assert.equal(consigne(m("arrive")), "Vous êtes arrivée à destination");
  assert.equal(consigne({ ...m("new name", "straight"), name: "Quai", ref: "D7" }), "Continuez sur Quai (D7)");
});

test("alertes : entrée et sortie de zone", () => {
  const radar = { id: "n1", type: "fixe", pos: nord(PARIS, 3000), vitesse: 80 };
  const derriere = { id: "n2", type: "fixe", pos: nord(PARIS, -500), vitesse: 80 };
  const cote = { id: "n3", type: "fixe", pos: est(nord(PARIS, 2500), 900), vitesse: 80 };
  const points = [radar, derriere, cote];
  const a = new Alertes();
  const ev = pos => a.evaluer({ pos, cap: 0, vitesse: 80, points });

  assert.equal(ev(PARIS).nouvelles.length, 0, "radar à 3 km : pas encore d'alerte");
  let r = ev(nord(PARIS, 2100));
  assert.deepEqual(r.nouvelles.map(p => p.id), ["n1"], "zone de 1 km pour un radar à 80");
  assert.equal(r.zone.id, "n1");
  assert.equal(ev(nord(PARIS, 2500)).nouvelles.length, 0, "pas d'annonce en double");
  assert.equal(ev(nord(PARIS, 2900)).zone.id, "n1");
  r = ev(nord(PARIS, 3200));
  assert.equal(r.zone, null, "radar dépassé : fin de zone");
  assert.equal(ev(nord(PARIS, 3300)).nouvelles.length, 0);

  // À l'arrêt, aucune alerte.
  const b = new Alertes();
  assert.equal(b.evaluer({ pos: nord(PARIS, 2500), cap: 0, vitesse: 0, points }).nouvelles.length, 0);
});

test("alertes : sur un itinéraire, seuls les radars du trajet comptent", () => {
  const ligne = [PARIS, nord(PARIS, 5000)];
  const route = { ligne, cumul: geo.cumulDistances(ligne) };
  const surLeTrajet = { id: "a", type: "mobile", pos: est(nord(PARIS, 1500), 10), vitesse: null, perso: true };
  const aCote = { id: "b", type: "fixe", pos: est(nord(PARIS, 1500), 200), vitesse: 50 };
  const points = [surLeTrajet, aCote];
  const surRoute = surItineraire(points, route);
  assert.deepEqual([...surRoute.keys()], ["a"]);
  const a = new Alertes();
  const r = a.evaluer({ pos: nord(PARIS, 1000), cap: 0, vitesse: 50, points, route: { surRoute, parcouru: 1000 } });
  assert.deepEqual(r.nouvelles.map(p => p.id), ["a"]);
});

test("alertes : radar tronçon actif jusqu'à la fin du tronçon", () => {
  const troncon = { id: "t", type: "troncon", pos: nord(PARIS, 500), fin: nord(PARIS, 6000), vitesse: 110 };
  const a = new Alertes();
  const ev = m => a.evaluer({ pos: nord(PARIS, m), cap: 0, vitesse: 110, points: [troncon] });
  assert.equal(ev(0).nouvelles.length, 1);
  assert.equal(ev(3000).zone?.id, "t", "toujours dans le tronçon");
  assert.equal(ev(5900).zone, null, "fin du tronçon");
});

test("signalements : ajout, expiration, import", () => {
  memoire.clear();
  const s = signalements.ajouter("mobile", PARIS, 80);
  signalements.ajouter("fixe", nord(PARIS, 100));
  assert.equal(signalements.lister().length, 2);
  assert.ok(s.expire > Date.now() + 2.9 * 3600 * 1000);

  // Expiration.
  const liste = JSON.parse(localStorage.getItem("signalements"));
  liste[0].expire = Date.now() - 1;
  localStorage.setItem("signalements", JSON.stringify(liste));
  assert.deepEqual(signalements.lister().map(x => x.type), ["fixe"]);

  const exporte = signalements.exporter();
  memoire.clear();
  assert.equal(signalements.importer(exporte), 1);
  assert.equal(signalements.importer(exporte), 0, "pas de doublons");
  assert.throws(() => signalements.importer("{}"));
});
