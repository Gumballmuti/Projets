// Ma Route : carte, GPS, zones de danger, limitation de vitesse et signalements.

import { cap, cercle, distance, formatDistance, formatDuree, projectionLigne } from "./geo.js";
import { TYPES, caseDe, casesAutour, casesLeLong, chargerCases } from "./radars.js";
import { limiteIci } from "./limites.js";
import { itineraires, rechercher } from "./navigation.js";
import { Alertes, surItineraire } from "./alertes.js";
import * as signalements from "./signalements.js";
import { bipExces, bipInfo, carillonDanger, debloquer, parler, sons } from "./voix.js";

const $ = s => document.querySelector(s);

// ---------- Réglages ----------
const reglages = Object.assign(
  { voix: true, bip: true, marge: 3, peages: false, theme: "auto", zones: true, son: true },
  lireJson("reglages", {}),
);
function enregistrerReglages() {
  localStorage.setItem("reglages", JSON.stringify(reglages));
  sons.voix = reglages.voix;
  sons.actif = reglages.son;
}
enregistrerReglages();

function lireJson(cle, defaut) {
  try {
    return JSON.parse(localStorage.getItem(cle)) ?? defaut;
  } catch {
    return defaut;
  }
}

// ---------- État ----------
const etat = {
  pos: null,
  cap: null,
  vitesse: 0,
  precision: null,
  dernierFix: null,
  posCap: null,
  suivi: true,
  derniereConduite: 0,
  caseChargee: null,
  limite: null,
  exces: false,
  dernierBip: 0,
  destination: null,
  routes: [],
  choix: 0,
  route: null,
  nav: false,
  parcouru: 0,
  index: 0,
  horsRoute: 0,
  recalcul: 0,
  annonces: new Set(),
  surRoute: new Map(),
};
const radarsConnus = new Map();
let mesSignalements = signalements.lister();
const alertes = new Alertes();

// ---------- Carte ----------
const STYLES = {
  clair: "https://tiles.openfreemap.org/styles/liberty",
  sombre: "https://tiles.openfreemap.org/styles/dark",
};
const STYLE_SECOURS = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      maxzoom: 19,
      attribution: "© contributeurs OpenStreetMap",
    },
  },
  layers: [{ id: "osm", type: "raster", source: "osm" }],
};

const depart = lireJson("dernierePos", null);
let themeActuel = choisirTheme(depart);
document.body.classList.toggle("sombre", themeActuel === "sombre");

const carte = new maplibregl.Map({
  container: "carte",
  style: STYLES[themeActuel],
  center: depart || [2.4, 46.6],
  zoom: depart ? 14 : 5,
  attributionControl: { compact: true },
  pitchWithRotate: true,
  dragRotate: true,
});

let styleEnSecours = false;
carte.on("error", e => {
  if (!styleEnSecours && !carte.isStyleLoaded() && /style|Failed to fetch/i.test(String(e.error?.message))) {
    styleEnSecours = true;
    carte.setStyle(STYLE_SECOURS, { diff: false });
  }
});

const vide = () => ({ type: "FeatureCollection", features: [] });

carte.on("style.load", () => {
  if (carte.getSource("points")) return;
  carte.addSource("alternatives", { type: "geojson", data: vide() });
  carte.addSource("itineraire", { type: "geojson", data: vide() });
  carte.addSource("zones", { type: "geojson", data: vide() });
  carte.addSource("points", { type: "geojson", data: vide() });

  carte.addLayer({
    id: "alternatives",
    type: "line",
    source: "alternatives",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": "#8b95a7", "line-width": 6, "line-opacity": 0.7 },
  });
  carte.addLayer({
    id: "itineraire-bord",
    type: "line",
    source: "itineraire",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": "#1a4fb8", "line-width": 11 },
  });
  carte.addLayer({
    id: "itineraire",
    type: "line",
    source: "itineraire",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": "#3d7bfd", "line-width": 7 },
  });
  carte.addLayer({
    id: "zones",
    type: "fill",
    source: "zones",
    minzoom: 10,
    paint: { "fill-color": ["get", "couleur"], "fill-opacity": 0.16 },
  });
  carte.addLayer({
    id: "zones-bord",
    type: "line",
    source: "zones",
    minzoom: 10,
    paint: { "line-color": ["get", "couleur"], "line-width": 1.5, "line-opacity": 0.6 },
  });
  carte.addLayer({
    id: "points",
    type: "circle",
    source: "points",
    paint: {
      "circle-color": ["get", "couleur"],
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 6, 3, 12, 7, 16, 10],
      "circle-stroke-color": "#fff",
      "circle-stroke-width": ["case", ["get", "perso"], 3, 1.5],
    },
  });
  majCarte();
  majItineraireCarte();
});

carte.on("click", "points", e => {
  const id = e.features[0]?.properties?.id;
  const p = radarsConnus.get(id) || mesSignalements.find(s => s.id === id);
  if (p) ouvrirPoint(p);
});
carte.on("mouseenter", "points", () => (carte.getCanvas().style.cursor = "pointer"));
carte.on("mouseleave", "points", () => (carte.getCanvas().style.cursor = ""));

// Quand je déplace la carte à la main, elle arrête de me suivre.
for (const ev of ["dragstart", "rotatestart", "pitchstart"]) {
  carte.on(ev, e => {
    if (e.originalEvent) arreterSuivi();
  });
}
carte.on("wheel", () => arreterSuivi());

function arreterSuivi() {
  if (!etat.suivi) return;
  etat.suivi = false;
  $("#btn-recentrer").hidden = false;
}

// Appui long sur la carte : signaler à cet endroit.
let appuiLong = null;
let debutAppui = null;
const annulerAppui = () => clearTimeout(appuiLong);
carte.on("touchstart", e => {
  annulerAppui();
  if (e.originalEvent.touches.length !== 1) return;
  debutAppui = e.point;
  const { lng, lat } = e.lngLat;
  appuiLong = setTimeout(() => ouvrirSignaler([lng, lat]), 650);
});
carte.on("touchmove", e => {
  if (debutAppui && Math.hypot(e.point.x - debutAppui.x, e.point.y - debutAppui.y) > 10) annulerAppui();
});
carte.on("touchend", annulerAppui);
carte.on("touchcancel", annulerAppui);
carte.on("contextmenu", e => ouvrirSignaler([e.lngLat.lng, e.lngLat.lat]));

// Mon marqueur : flèche orientée selon mon cap.
const elMoi = document.createElement("div");
elMoi.className = "moi sans-cap";
elMoi.innerHTML = `<svg width="34" height="34" viewBox="0 0 34 34"><path d="M17 2 L30 31 L17 24 L4 31 Z" fill="#2f6fed" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/></svg>`;
const marqueurMoi = new maplibregl.Marker({ element: elMoi, rotationAlignment: "map", pitchAlignment: "map" });
let marqueurDestination = null;

// ---------- Thème ----------
function choisirTheme(pos) {
  if (reglages.theme === "clair" || reglages.theme === "sombre") return reglages.theme;
  return estNuit(new Date(), pos) ? "sombre" : "clair";
}

/** Le soleil est-il couché ? (hauteur du soleil < -3°, formule approchée) */
function estNuit(date, pos) {
  const [lon, lat] = pos || [2.4, 46.6];
  const jour = (Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - Date.UTC(date.getUTCFullYear(), 0, 0)) / 864e5;
  const decl = (-23.44 * Math.cos(((2 * Math.PI) / 365) * (jour + 10)) * Math.PI) / 180;
  const heureSolaire = date.getUTCHours() + date.getUTCMinutes() / 60 + lon / 15;
  const angle = ((heureSolaire - 12) * 15 * Math.PI) / 180;
  const phi = (lat * Math.PI) / 180;
  const hauteur = Math.asin(Math.sin(phi) * Math.sin(decl) + Math.cos(phi) * Math.cos(decl) * Math.cos(angle));
  return (hauteur * 180) / Math.PI < -3;
}

function appliquerTheme() {
  const t = choisirTheme(etat.pos || depart);
  document.body.classList.toggle("sombre", t === "sombre");
  if (t !== themeActuel && !styleEnSecours) {
    themeActuel = t;
    carte.setStyle(STYLES[t], { diff: false });
  }
}
setInterval(appliquerTheme, 5 * 60 * 1000);

// ---------- Points (radars + mes signalements) ----------
function tousLesPoints() {
  return [...radarsConnus.values(), ...mesSignalements];
}

let majPrevue = null;
function majCarte() {
  clearTimeout(majPrevue);
  majPrevue = setTimeout(() => {
    if (!carte.getSource("points")) return;
    const pts = tousLesPoints();
    carte.getSource("points").setData({
      type: "FeatureCollection",
      features: pts.map(p => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: p.pos },
        properties: { id: p.id, couleur: TYPES[p.type]?.couleur || "#e5484d", perso: !!p.perso },
      })),
    });
    carte.getSource("zones").setData({
      type: "FeatureCollection",
      features: reglages.zones
        ? pts.map(p => ({
            type: "Feature",
            geometry: { type: "Polygon", coordinates: [cercle(p.pos, p.type === "danger" || p.type === "bouchon" ? 120 : 250, 24)] },
            properties: { couleur: TYPES[p.type]?.couleur || "#e5484d" },
          }))
        : [],
    });
    carte.setLayoutProperty("points", "visibility", reglages.zones ? "visible" : "none");
  }, 150);
}

function recalculerSurRoute() {
  etat.surRoute = etat.route ? surItineraire(tousLesPoints(), etat.route) : new Map();
}

async function chargerRadars(cases) {
  const avant = radarsConnus.size;
  const radars = await chargerCases(cases);
  for (const r of radars) radarsConnus.set(r.id, r);
  if (radarsConnus.size !== avant) {
    majCarte();
    recalculerSurRoute();
    majZonesRoute();
  }
  return radars;
}

// Charge aussi les radars de la zone affichée quand on explore la carte.
carte.on("moveend", () => {
  if (carte.getZoom() < 9) return;
  chargerRadars(casesAutour([carte.getCenter().lng, carte.getCenter().lat], 1)).catch(() => {});
});

// ---------- GPS ----------
function demarrerGps() {
  if (!("geolocation" in navigator)) return toast("La localisation n'est pas disponible sur cet appareil.");
  navigator.geolocation.watchPosition(surPosition, erreurGps, {
    enableHighAccuracy: true,
    maximumAge: 1000,
    timeout: 20000,
  });
}

function erreurGps(err) {
  if (err.code === 1) {
    toast("Localisation refusée. Sur iPhone : Réglages › Confidentialité › Service de localisation › Safari › « Lorsque l'app est active ».", 9000);
  } else if (!etat.pos) {
    toast("Recherche du signal GPS…");
  }
}

function surPosition(gp) {
  const c = gp.coords;
  const pos = [c.longitude, c.latitude];
  const t = gp.timestamp || Date.now();
  const premier = !etat.pos;

  // Vitesse : celle du GPS, sinon calculée entre deux positions.
  let v = c.speed != null && c.speed >= 0 ? c.speed * 3.6 : null;
  if (v == null && etat.dernierFix && t > etat.dernierFix.t) {
    v = (distance(etat.dernierFix.pos, pos) / ((t - etat.dernierFix.t) / 1000)) * 3.6;
  }
  etat.vitesse = v == null || !isFinite(v) ? 0 : v < 3 ? 0 : v;
  etat.dernierFix = { pos, t };

  // Cap : celui du GPS si on roule, sinon calculé quand on a assez bougé.
  if (c.heading != null && !isNaN(c.heading) && etat.vitesse > 5) {
    etat.cap = c.heading;
    etat.posCap = pos;
  } else if (!etat.posCap || distance(etat.posCap, pos) > 12) {
    if (etat.posCap && etat.vitesse > 3) etat.cap = cap(etat.posCap, pos);
    etat.posCap = pos;
  }

  etat.pos = pos;
  etat.precision = c.accuracy;
  try {
    localStorage.setItem("dernierePos", JSON.stringify(pos.map(n => Math.round(n * 1e4) / 1e4)));
  } catch {}

  marqueurMoi.setLngLat(pos);
  if (premier) {
    marqueurMoi.addTo(carte);
    carte.jumpTo({ center: pos, zoom: 15 });
    appliquerTheme();
  }
  elMoi.classList.toggle("sans-cap", etat.cap == null);
  if (etat.cap != null) marqueurMoi.setRotation(etat.cap);

  // Radars autour de moi (9 cases ≈ 80 × 55 km).
  const k = caseDe(pos).join(":");
  if (k !== etat.caseChargee) {
    etat.caseChargee = k;
    chargerRadars(casesAutour(pos, 1)).catch(() => toast("Radars indisponibles pour l'instant (pas de réseau ?)"));
  }

  if (etat.vitesse > 10) garderEcranAllume();
  majLimite();
  if (etat.nav) suivreItineraire();
  majAlertes();
  majVitesse();
  suivreCamera();
}

function suivreCamera() {
  if (!etat.suivi || !etat.pos) return;
  // On garde la vue « conduite » une minute après le dernier passage au-dessus de 15 km/h (feux, bouchons).
  if (etat.vitesse > 15) etat.derniereConduite = Date.now();
  const roule = etat.nav || Date.now() - etat.derniereConduite < 60000;
  const v = etat.vitesse;
  const zoom = !roule ? Math.max(carte.getZoom(), 15) : v > 100 ? 14.2 : v > 70 ? 15 : v > 40 ? 15.8 : 16.5;
  const h = carte.getContainer().clientHeight;
  carte.easeTo({
    center: etat.pos,
    bearing: roule && etat.cap != null ? etat.cap : carte.getBearing(),
    pitch: roule ? 50 : 0,
    zoom,
    padding: { top: roule ? h * 0.35 : 0, bottom: 0, left: 0, right: 0 },
    duration: 900,
    easing: x => x,
  });
}

$("#btn-recentrer").onclick = () => {
  etat.suivi = true;
  $("#btn-recentrer").hidden = true;
  if (!etat.pos) return toast("Position GPS pas encore trouvée");
  suivreCamera();
};

// ---------- Vitesse et limitation ----------
let demandeLimite = 0;
async function majLimite() {
  const n = ++demandeLimite;
  const route = await limiteIci(etat.pos, etat.cap);
  if (n !== demandeLimite) return;
  etat.limite = route;
  const el = $("#limite");
  el.hidden = !route?.vitesse;
  if (route?.vitesse) el.textContent = route.vitesse;
  const nom = $("#route-actuelle");
  nom.hidden = !route?.nom;
  nom.textContent = route?.nom || "";
  majVitesse();
}

function limiteEnVigueur() {
  return etat.limite?.vitesse || alertes.resultat(etat.pos, []).zone?.vitesse || null;
}

function majVitesse() {
  const v = Math.round(etat.vitesse);
  $("#vitesse-val").textContent = etat.pos ? v : "–";
  const lim = limiteEnVigueur();
  const exces = !!lim && v > lim + Number(reglages.marge);
  $("#vitesse").classList.toggle("exces", exces);
  if (exces && reglages.bip && (!etat.exces || Date.now() - etat.dernierBip > 15000)) {
    bipExces();
    etat.dernierBip = Date.now();
  }
  etat.exces = exces;
}

// ---------- Alertes ----------
const MESSAGES = {
  fixe: ["Zone de danger", "Zone de danger"],
  feu: ["Zone de danger", "Zone de danger"],
  troncon: ["Zone de danger", "Zone de danger, contrôle sur un tronçon"],
  passage: ["Zone de danger", "Zone de danger"],
  mobile: ["Zone à risque", "Zone à risque signalée"],
  police: ["Zone à risque", "Zone à risque signalée"],
  danger: ["Danger signalé", "Attention, danger signalé"],
  bouchon: ["Bouchon signalé", "Attention, bouchon signalé"],
};

function majAlertes() {
  const { nouvelles, zone } = alertes.evaluer({
    pos: etat.pos,
    cap: etat.cap,
    vitesse: etat.vitesse,
    points: tousLesPoints(),
    route: etat.nav && etat.horsRoute < 4 ? { surRoute: etat.surRoute, parcouru: etat.parcouru } : null,
  });

  for (const p of nouvelles) {
    const [, voix] = MESSAGES[p.type] || MESSAGES.fixe;
    const info = p.type === "danger" || p.type === "bouchon";
    info ? bipInfo() : carillonDanger();
    parler(voix + (p.vitesse ? `. Limitation ${p.vitesse}.` : "."), { urgent: true });
  }

  const el = $("#alerte");
  el.hidden = !zone;
  if (!zone) return;
  const [titre] = MESSAGES[zone.type] || MESSAGES.fixe;
  el.className = ["mobile", "police"].includes(zone.type) ? "risque" : ["danger", "bouchon"].includes(zone.type) ? "info" : "";
  $("#alerte-icone").textContent = ["danger", "bouchon"].includes(zone.type) ? TYPES[zone.type].icone : "⚠️";
  $("#alerte-titre").textContent = titre;
  $("#alerte-sous").textContent = zone.perso
    ? `Signalé ${depuis(zone.cree)}`
    : zone.type === "troncon"
      ? "Contrôle de vitesse moyenne"
      : "Respecte la limitation";
  const lim = $("#alerte-limite");
  lim.hidden = !zone.vitesse;
  lim.textContent = zone.vitesse || "";
}

function depuis(t) {
  const min = Math.round((Date.now() - t) / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  return h < 24 ? `il y a ${h} h` : `il y a ${Math.floor(h / 24)} j`;
}

// ---------- Écran allumé ----------
let verrou = null;
async function garderEcranAllume() {
  if (verrou || !("wakeLock" in navigator) || document.visibilityState !== "visible") return;
  try {
    verrou = await navigator.wakeLock.request("screen");
    verrou.addEventListener("release", () => (verrou = null));
  } catch {}
}
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && (etat.nav || etat.vitesse > 10)) garderEcranAllume();
});

// ---------- Recherche ----------
let minuteurRecherche = null;
let numRecherche = 0;
const champ = $("#champ");
const listeResultats = $("#resultats");

champ.addEventListener("input", () => {
  $("#effacer").hidden = !champ.value;
  clearTimeout(minuteurRecherche);
  if (champ.value.trim().length < 3) return (listeResultats.hidden = true);
  minuteurRecherche = setTimeout(lancerRecherche, 350);
});
$("#recherche").addEventListener("submit", e => {
  e.preventDefault();
  clearTimeout(minuteurRecherche);
  lancerRecherche();
});
$("#effacer").onclick = () => {
  champ.value = "";
  $("#effacer").hidden = true;
  listeResultats.hidden = true;
  champ.focus();
};

async function lancerRecherche() {
  const n = ++numRecherche;
  const pres = etat.pos || [carte.getCenter().lng, carte.getCenter().lat];
  let res;
  try {
    res = await rechercher(champ.value, pres);
  } catch {
    res = null;
  }
  if (n !== numRecherche) return;
  listeResultats.innerHTML = "";
  listeResultats.hidden = false;
  if (!res?.length) {
    const li = document.createElement("li");
    li.className = "vide";
    li.textContent = res ? "Aucun résultat" : "Recherche impossible (pas de réseau ?)";
    return listeResultats.append(li);
  }
  for (const r of res) {
    const li = document.createElement("li");
    li.textContent = r.nom;
    if (r.detail) {
      const s = document.createElement("small");
      s.textContent = r.detail;
      li.append(s);
    }
    li.onclick = () => choisirDestination(r);
    listeResultats.append(li);
  }
}

function choisirDestination(r) {
  listeResultats.hidden = true;
  champ.value = r.nom;
  champ.blur();
  etat.destination = r;
  marqueurDestination?.remove();
  marqueurDestination = new maplibregl.Marker({ color: "#e5484d" }).setLngLat(r.pos).addTo(carte);
  calculerItineraires();
}

// ---------- Itinéraire ----------
async function calculerItineraires() {
  const dest = etat.destination;
  let dep = etat.pos;
  if (!dep) {
    dep = [carte.getCenter().lng, carte.getCenter().lat];
    toast("GPS pas encore prêt : départ depuis le centre de la carte");
  }
  ouvrir("#feuille-itineraire");
  $("#iti-titre").textContent = dest.nom;
  $("#iti-detail").textContent = "Calcul de l'itinéraire…";
  $("#iti-liste").innerHTML = "";
  $("#btn-demarrer").disabled = true;
  $("#iti-peages").checked = reglages.peages;
  try {
    etat.routes = await itineraires(dep, dest.pos, { sansPeage: reglages.peages });
  } catch {
    $("#iti-detail").textContent = "Impossible de calculer l'itinéraire (pas de réseau ?). Réessaie dans un instant.";
    return;
  }
  etat.choix = 0;
  $("#iti-detail").textContent = dest.detail || "";
  if (etat.routes[0]?.peageNonEvite) $("#iti-detail").textContent = "Le serveur n'a pas pu éviter les péages.";
  $("#btn-demarrer").disabled = false;
  afficherOptions();
  cadrerRoutes();
  majItineraireCarte();
  // Les radars le long des trajets (pour compter les zones).
  const cases = etat.routes.flatMap(r => casesLeLong(r.ligne));
  chargerRadars(cases)
    .then(() => afficherOptions())
    .catch(() => {});
}

$("#iti-peages").onchange = e => {
  reglages.peages = e.target.checked;
  enregistrerReglages();
  if (etat.destination) calculerItineraires();
};

function afficherOptions() {
  const liste = $("#iti-liste");
  liste.innerHTML = "";
  const pts = tousLesPoints();
  etat.routes.forEach((r, i) => {
    const nbZones = surItineraire(pts, r).size;
    const b = document.createElement("button");
    b.className = "option-iti" + (i === etat.choix ? " choisie" : "");
    const arrivee = new Date(Date.now() + r.duree * 1000).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    b.innerHTML = `<div><strong>${formatDuree(r.duree)}</strong><small>${formatDistance(r.distance)} · arrivée ${arrivee}${r.peages ? " · péages" : ""}</small></div><span class="pastille">⚠️ ${nbZones}</span>`;
    b.onclick = () => {
      etat.choix = i;
      afficherOptions();
      majItineraireCarte();
    };
    liste.append(b);
  });
}

function cadrerRoutes() {
  const b = new maplibregl.LngLatBounds();
  for (const r of etat.routes) for (const p of r.ligne) b.extend(p);
  if (b.isEmpty()) return;
  arreterSuivi();
  carte.fitBounds(b, { padding: { top: 90, bottom: Math.min(420, innerHeight * 0.5), left: 40, right: 40 }, bearing: 0, pitch: 0, duration: 800 });
}

function majItineraireCarte() {
  if (!carte.getSource("itineraire")) return;
  const ligne = l => ({ type: "Feature", geometry: { type: "LineString", coordinates: l }, properties: {} });
  const principale = etat.nav ? etat.route : etat.routes[etat.choix];
  carte.getSource("itineraire").setData(principale ? { type: "FeatureCollection", features: [ligne(principale.ligne)] } : vide());
  carte.getSource("alternatives").setData({
    type: "FeatureCollection",
    features: etat.nav ? [] : etat.routes.filter((_, i) => i !== etat.choix).map(r => ligne(r.ligne)),
  });
}

$("#btn-demarrer").onclick = () => {
  debloquer();
  etat.route = etat.routes[etat.choix];
  etat.routes = [];
  etat.nav = true;
  etat.parcouru = 0;
  etat.index = 0;
  etat.horsRoute = 0;
  etat.annonces.clear();
  alertes.reinitialiser();
  recalculerSurRoute();
  fermerFeuilles();
  document.body.classList.add("navigue");
  $("#recherche").hidden = true;
  $("#consigne").hidden = false;
  $("#barre-nav").hidden = false;
  etat.suivi = true;
  $("#btn-recentrer").hidden = true;
  majItineraireCarte();
  garderEcranAllume();
  if (etat.pos) suivreItineraire();
  suivreCamera();
  const premiere = etat.route.etapes.find(e => e.type !== "depart");
  parler(`C'est parti. ${formatDuree(etat.route.duree)} de trajet.` + (premiere ? ` ${premiere.texte}.` : ""));
};

$("#btn-arreter").onclick = () => arreterNavigation();

function arreterNavigation(message) {
  etat.nav = false;
  etat.route = null;
  etat.routes = [];
  etat.destination = null;
  etat.surRoute = new Map();
  marqueurDestination?.remove();
  marqueurDestination = null;
  document.body.classList.remove("navigue");
  $("#recherche").hidden = false;
  $("#consigne").hidden = true;
  $("#barre-nav").hidden = true;
  champ.value = "";
  $("#effacer").hidden = true;
  majItineraireCarte();
  if (message) parler(message);
  suivreCamera();
}

const FLECHES = {
  uturn: "↶",
  "sharp right": "↘",
  right: "→",
  "slight right": "↗",
  straight: "↑",
  "slight left": "↖",
  left: "←",
  "sharp left": "↙",
};

function suivreItineraire() {
  const r = etat.route;
  const proj = projectionLigne(etat.pos, r.ligne, r.cumul, Math.max(0, etat.index - 5));
  const tolerance = Math.max(45, Math.min(100, etat.precision || 0));
  if (proj.distance > tolerance) {
    etat.horsRoute++;
    if (etat.horsRoute >= 4 && Date.now() - etat.recalcul > 12000) recalculer();
  } else {
    etat.horsRoute = 0;
    etat.index = proj.index;
    etat.parcouru = proj.parcouru;
  }

  const total = r.cumul[r.cumul.length - 1];
  const restant = Math.max(0, total - etat.parcouru);
  if (restant < 35 || (distance(etat.pos, r.ligne[r.ligne.length - 1]) < 30)) {
    return arreterNavigation("Vous êtes arrivée à destination.");
  }

  const i = r.etapes.findIndex(e => e.debut > etat.parcouru + 3 && e.type !== "depart");
  const etape = r.etapes[i];
  if (etape) {
    const d = etape.debut - etat.parcouru;
    $("#consigne-dist").textContent = formatDistance(d);
    $("#consigne-texte").textContent = etape.texte;
    $("#consigne-fleche").textContent =
      etape.type === "arrive" ? "🏁" : etape.type === "roundabout" || etape.type === "rotary" ? "⟳" : FLECHES[etape.modif] || "↑";

    const v = etat.vitesse;
    const loin = v > 80 ? 1500 : v > 50 ? 600 : 300;
    const proche = Math.max(60, (v / 3.6) * 6);
    if (d <= proche && !etat.annonces.has(`${i}p`)) {
      etat.annonces.add(`${i}p`).add(`${i}l`);
      parler(etape.texte);
    } else if (d <= loin && d > proche + 100 && !etat.annonces.has(`${i}l`)) {
      etat.annonces.add(`${i}l`);
      parler(`Dans ${formatDistance(d)}, ${etape.texte.charAt(0).toLowerCase()}${etape.texte.slice(1)}`);
    }
  }

  const reste = r.duree * (restant / total);
  $("#nav-arrivee").textContent = new Date(Date.now() + reste * 1000).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  $("#nav-reste").textContent = `${formatDistance(restant)} · ${formatDuree(reste)}`;
  majZonesRoute();
}

function majZonesRoute() {
  if (!etat.nav) return;
  let n = 0;
  for (const k of etat.surRoute.values()) if (k > etat.parcouru) n++;
  $("#nav-zones").textContent = `⚠️ ${n} zone${n > 1 ? "s" : ""}`;
}

async function recalculer() {
  etat.recalcul = Date.now();
  try {
    const [r] = await itineraires(etat.pos, etat.destination.pos, { sansPeage: reglages.peages });
    if (!etat.nav) return;
    etat.route = r;
    etat.index = 0;
    etat.parcouru = 0;
    etat.horsRoute = 0;
    etat.annonces.clear();
    majItineraireCarte();
    parler("Nouvel itinéraire.");
    chargerRadars(casesLeLong(r.ligne)).catch(() => {});
    recalculerSurRoute();
  } catch {
    toast("Recalcul impossible pour l'instant");
  }
}

// ---------- Signaler ----------
let posSignalement = null;

$("#btn-signaler").onclick = () => {
  debloquer();
  ouvrirSignaler(null);
};

function ouvrirSignaler(pos) {
  posSignalement = pos;
  $("#sig-ou").textContent = pos ? "À l'endroit touché sur la carte" : etat.pos ? "À ta position actuelle" : "Au centre de la carte (GPS pas encore prêt)";
  $("#sig-vitesse").value = etat.limite?.vitesse && [30, 50, 70, 80, 90, 110, 130].includes(etat.limite.vitesse) ? String(etat.limite.vitesse) : "";
  ouvrir("#feuille-signaler");
}

for (const b of document.querySelectorAll("#feuille-signaler [data-type]")) {
  b.onclick = () => {
    const pos = posSignalement || etat.pos || [carte.getCenter().lng, carte.getCenter().lat];
    const vitesse = Number($("#sig-vitesse").value) || null;
    signalements.ajouter(b.dataset.type, pos, vitesse);
    mesSignalements = signalements.lister();
    majCarte();
    recalculerSurRoute();
    fermerFeuilles();
    const duree = signalements.DUREES[b.dataset.type];
    toast(`${TYPES[b.dataset.type].nom} enregistré${duree ? ` pour ${duree} h` : ""} ✓`);
  };
}

// Les signalements expirent tout seuls.
setInterval(() => {
  const n = mesSignalements.length;
  mesSignalements = signalements.lister();
  if (mesSignalements.length !== n) {
    majCarte();
    recalculerSurRoute();
  }
}, 60000);

// ---------- Fiche d'un point ----------
let pointOuvert = null;
function ouvrirPoint(p) {
  pointOuvert = p;
  const t = TYPES[p.type] || TYPES.fixe;
  $("#pt-titre").textContent = `${t.icone} ${t.nom}`;
  const morceaux = [];
  if (p.vitesse) morceaux.push(`Limitation ${p.vitesse} km/h`);
  if (p.perso) {
    morceaux.push(`signalé ${depuis(p.cree)}`);
    if (p.expire) morceaux.push(`disparaît dans ${formatDuree((p.expire - Date.now()) / 1000)}`);
  } else {
    morceaux.push("source : OpenStreetMap");
  }
  if (etat.pos) morceaux.push(`à ${formatDistance(distance(etat.pos, p.pos))}`);
  $("#pt-detail").textContent = morceaux.join(" · ");
  $("#pt-supprimer").hidden = !p.perso;
  $("#pt-confirmer").hidden = !p.perso || !p.expire;
  ouvrir("#feuille-point");
}

$("#pt-supprimer").onclick = () => {
  signalements.supprimer(pointOuvert.id);
  mesSignalements = signalements.lister();
  majCarte();
  recalculerSurRoute();
  fermerFeuilles();
  toast("Signalement supprimé");
};
$("#pt-confirmer").onclick = () => {
  signalements.confirmer(pointOuvert.id);
  mesSignalements = signalements.lister();
  fermerFeuilles();
  toast("Merci, signalement prolongé");
};

// ---------- Réglages ----------
$("#btn-reglages").onclick = () => {
  $("#r-voix").checked = reglages.voix;
  $("#r-bip").checked = reglages.bip;
  $("#r-marge").value = String(reglages.marge);
  $("#r-peages").checked = reglages.peages;
  $("#r-theme").value = reglages.theme;
  $("#r-zones").checked = reglages.zones;
  listerMesSignalements();
  infoCache();
  ouvrir("#feuille-reglages");
};

for (const [id, cle] of [["#r-voix", "voix"], ["#r-bip", "bip"], ["#r-peages", "peages"], ["#r-zones", "zones"]]) {
  $(id).onchange = e => {
    reglages[cle] = e.target.checked;
    enregistrerReglages();
    if (cle === "zones") majCarte();
  };
}
$("#r-marge").onchange = e => {
  reglages.marge = Number(e.target.value);
  enregistrerReglages();
};
$("#r-theme").onchange = e => {
  reglages.theme = e.target.value;
  enregistrerReglages();
  appliquerTheme();
};

function majBoutonSon() {
  $("#btn-son").textContent = reglages.son ? "🔊" : "🔇";
  $("#btn-son").setAttribute("aria-label", reglages.son ? "Couper le son" : "Remettre le son");
}
$("#btn-son").onclick = () => {
  debloquer();
  reglages.son = !reglages.son;
  enregistrerReglages();
  majBoutonSon();
  if (!reglages.son) window.speechSynthesis?.cancel();
  toast(reglages.son ? "Son activé" : "Son coupé");
};
majBoutonSon();

function listerMesSignalements() {
  const ul = $("#mes-signalements");
  ul.innerHTML = "";
  if (!mesSignalements.length) {
    ul.innerHTML = `<li><div class="gris">Aucun signalement pour l'instant. Utilise le bouton orange ＋ ou un appui long sur la carte.</div></li>`;
    return;
  }
  for (const s of [...mesSignalements].sort((a, b) => b.cree - a.cree)) {
    const t = TYPES[s.type] || TYPES.fixe;
    const li = document.createElement("li");
    li.innerHTML = `<span class="grand">${t.icone}</span><div>${t.nom}${s.vitesse ? ` · ${s.vitesse} km/h` : ""}<small>${depuis(s.cree)}${s.expire ? ` · expire dans ${formatDuree((s.expire - Date.now()) / 1000)}` : " · permanent"}</small></div>`;
    const voir = document.createElement("button");
    voir.textContent = "Voir";
    voir.style.color = "var(--accent)";
    voir.onclick = () => {
      fermerFeuilles();
      arreterSuivi();
      carte.flyTo({ center: s.pos, zoom: 16 });
    };
    const suppr = document.createElement("button");
    suppr.textContent = "Supprimer";
    suppr.onclick = () => {
      signalements.supprimer(s.id);
      mesSignalements = signalements.lister();
      majCarte();
      recalculerSurRoute();
      listerMesSignalements();
    };
    li.append(voir, suppr);
    ul.append(li);
  }
}

$("#btn-exporter").onclick = async () => {
  const texte = signalements.exporter();
  const fichier = new File([texte], "mes-signalements.json", { type: "application/json" });
  if (navigator.canShare?.({ files: [fichier] })) {
    try {
      await navigator.share({ files: [fichier], title: "Mes signalements" });
      return;
    } catch (e) {
      if (e.name === "AbortError") return;
    }
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(fichier);
  a.download = fichier.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
};
$("#btn-importer").onclick = () => $("#fichier-import").click();
$("#fichier-import").onchange = async e => {
  const f = e.target.files[0];
  e.target.value = "";
  if (!f) return;
  try {
    const n = signalements.importer(await f.text());
    mesSignalements = signalements.lister();
    majCarte();
    recalculerSurRoute();
    listerMesSignalements();
    toast(`${n} signalement${n > 1 ? "s" : ""} importé${n > 1 ? "s" : ""}`);
  } catch {
    toast("Ce fichier n'est pas un export de Ma Route");
  }
};

function infoCache() {
  let cases = 0;
  for (let i = 0; i < localStorage.length; i++) if (localStorage.key(i).startsWith("radars:")) cases++;
  $("#info-cache").textContent = `${radarsConnus.size} radars fixes chargés (${cases} secteurs gardés 7 jours sur le téléphone).`;
}
$("#btn-vider").onclick = () => {
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const k = localStorage.key(i);
    if (k.startsWith("radars:")) localStorage.removeItem(k);
  }
  radarsConnus.clear();
  majCarte();
  etat.caseChargee = null;
  const ici = etat.pos || [carte.getCenter().lng, carte.getCenter().lat];
  chargerRadars(casesAutour(ici, 1))
    .then(() => {
      infoCache();
      toast("Radars rechargés");
    })
    .catch(() => toast("Rechargement impossible (pas de réseau ?)"));
};

// ---------- Feuilles et messages ----------
function ouvrir(sel) {
  fermerFeuilles();
  $(sel).hidden = false;
}
function fermerFeuilles() {
  for (const f of document.querySelectorAll(".feuille")) f.hidden = true;
}
for (const b of document.querySelectorAll("[data-fermer]")) {
  b.onclick = () => {
    const dansIti = b.closest("#feuille-itineraire");
    fermerFeuilles();
    if (dansIti && !etat.nav) {
      etat.routes = [];
      etat.destination = null;
      marqueurDestination?.remove();
      marqueurDestination = null;
      champ.value = "";
      $("#effacer").hidden = true;
      majItineraireCarte();
    }
  };
}

let minuteurToast = null;
function toast(texte, duree = 3500) {
  const el = $("#toast");
  el.textContent = texte;
  el.hidden = false;
  clearTimeout(minuteurToast);
  minuteurToast = setTimeout(() => (el.hidden = true), duree);
}

// ---------- Démarrage ----------
document.addEventListener("pointerdown", debloquer, { once: true });

if (!localStorage.getItem("accueilVu")) {
  $("#accueil").hidden = false;
  $("#btn-commencer").onclick = () => {
    debloquer();
    localStorage.setItem("accueilVu", "1");
    $("#accueil").hidden = true;
    demarrerGps();
  };
} else {
  demarrerGps();
}

if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});

// Pour les tests automatisés.
window.__maRoute = { etat, radarsConnus, alertes };
