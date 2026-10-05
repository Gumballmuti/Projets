import { DIMENSIONS, type DimensionId } from "@/content/bilan";
import type { MatchBilan } from "./storage";

/** Nombre minimal de matchs avant d'afficher une tendance. */
export const MIN_MATCHS_TENDANCE = 3;
/** Fenêtre de calcul de la tendance (derniers matchs). */
export const FENETRE_TENDANCE = 8;

export type Tendance = "hausse" | "legere-hausse" | "stable" | "legere-baisse" | "baisse";

export const TENDANCE_LABEL: Record<Tendance, string> = {
  hausse: "en hausse",
  "legere-hausse": "en légère hausse",
  stable: "plutôt stable",
  "legere-baisse": "en légère baisse",
  baisse: "en baisse",
};

export function sortByDate(matchs: readonly MatchBilan[]): MatchBilan[] {
  return [...matchs].sort((a, b) => a.date.localeCompare(b.date));
}

export function serie(matchs: readonly MatchBilan[], dim: DimensionId): number[] {
  return sortByDate(matchs).map((m) => m.notes[dim]);
}

export function moyenne(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  return Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 10) / 10;
}

/** Pente de la droite de régression (points par match). */
export function pente(values: readonly number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  const xMean = (n - 1) / 2;
  const yMean = values.reduce((s, v) => s + v, 0) / n;
  let num = 0;
  let den = 0;
  values.forEach((y, x) => {
    num += (x - xMean) * (y - yMean);
    den += (x - xMean) ** 2;
  });
  return den === 0 ? 0 : num / den;
}

/** Tendance sur les derniers matchs, uniquement à partir de 3 matchs. */
export function tendance(values: readonly number[]): Tendance | null {
  if (values.length < MIN_MATCHS_TENDANCE) return null;
  const p = pente(values.slice(-FENETRE_TENDANCE));
  if (p >= 0.5) return "hausse";
  if (p >= 0.15) return "legere-hausse";
  if (p <= -0.5) return "baisse";
  if (p <= -0.15) return "legere-baisse";
  return "stable";
}

export type DimensionStats = {
  id: DimensionId;
  valeurs: number[];
  moyenne: number | null;
  derniere: number | null;
  tendance: Tendance | null;
};

export function statsParDimension(matchs: readonly MatchBilan[]): DimensionStats[] {
  return DIMENSIONS.map((d) => {
    const valeurs = serie(matchs, d.id);
    return {
      id: d.id,
      valeurs,
      moyenne: moyenne(valeurs),
      derniere: valeurs.at(-1) ?? null,
      tendance: tendance(valeurs),
    };
  });
}

/** Moyenne des 6 dimensions d'un match. */
export function moyenneMatch(m: MatchBilan): number {
  return moyenne(DIMENSIONS.map((d) => m.notes[d.id])) ?? 0;
}

/** Dimension la plus basse et la plus haute d'un match (ordre du bilan en cas d'égalité). */
export function extremes(notes: Record<DimensionId, number>): { basse: DimensionId; haute: DimensionId; egales: boolean } {
  let basse = DIMENSIONS[0]!.id;
  let haute = DIMENSIONS[0]!.id;
  for (const d of DIMENSIONS) {
    if (notes[d.id] < notes[basse]) basse = d.id;
    if (notes[d.id] > notes[haute]) haute = d.id;
  }
  return { basse, haute, egales: notes[basse] === notes[haute] };
}
