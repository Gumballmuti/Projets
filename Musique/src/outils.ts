import type { Titre } from "./types";

export function duree(secondes: number) {
  const s = Math.max(0, Math.floor(secondes || 0));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}` : `${m}:${String(r).padStart(2, "0")}`;
}

export function dureeTotale(titres: Titre[]) {
  const s = titres.reduce((t, x) => t + (x.duree || 0), 0);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return h ? `${h} h ${m} min` : `${m} min ${s % 60} s`;
}

export const nombre = (n: number) => new Intl.NumberFormat("fr-FR").format(n || 0);

export function dateRelative(iso?: string) {
  if (!iso) return "";
  const jours = Math.floor((Date.now() - Date.parse(iso)) / 86400000);
  if (jours < 1) return "Aujourd'hui";
  if (jours < 2) return "Hier";
  if (jours < 7) return `Il y a ${jours} jours`;
  if (jours < 30) return `Il y a ${Math.floor(jours / 7)} sem.`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

/** Une couleur stable pour chaque playlist ou artiste (fond dégradé des en-têtes). */
export function teinte(cle: string) {
  let h = 0;
  for (const c of cle) h = (h * 31 + c.charCodeAt(0)) % 360;
  return `hsl(${h} 42% 36%)`;
}

export function melanger<T>(liste: T[]): T[] {
  const l = [...liste];
  for (let i = l.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [l[i], l[j]] = [l[j], l[i]];
  }
  return l;
}

export function salutation() {
  const h = new Date().getHours();
  return h < 5 ? "Bonne nuit" : h < 12 ? "Bonjour" : h < 18 ? "Bon après-midi" : "Bonsoir";
}

export function lire<T>(cle: string, defaut: T): T {
  try {
    const v = localStorage.getItem(cle);
    return v ? (JSON.parse(v) as T) : defaut;
  } catch {
    return defaut;
  }
}

export function ecrire(cle: string, valeur: unknown) {
  try {
    localStorage.setItem(cle, JSON.stringify(valeur));
  } catch {}
}
