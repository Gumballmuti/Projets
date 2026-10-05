import type { BySport, SportChoice, SportTag } from "@/content/types";

/**
 * Le contenu est-il visible pour ce sport ?
 * - « all » est visible partout ;
 * - un contenu spécifique n'est visible que pour son sport ;
 * - « autre » ne voit que le contenu core.
 */
export function isForSport(sports: readonly SportTag[], sport: SportChoice): boolean {
  if (sports.includes("all")) return true;
  if (sport === "autre") return false;
  return sports.includes(sport);
}

export function filterBySport<T extends { sports: readonly SportTag[] }>(
  items: readonly T[],
  sport: SportChoice,
): T[] {
  return items.filter((item) => isForSport(item.sports, sport));
}

/** Texte adapté au sport, avec repli sur la version commune. */
export function bySport<T>(value: BySport<T>, sport: SportChoice): T {
  if (sport !== "autre" && value[sport] !== undefined) return value[sport] as T;
  return value.all;
}

/** Normalise un texte pour la recherche (minuscules, sans accents). */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[’]/g, "'");
}
