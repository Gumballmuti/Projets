import { MOTS_DETRESSE } from "@/content/sante";
import { normalize } from "./content";

/** Le texte libre contient-il un signe de détresse ? (heuristique simple, locale) */
export function detectDistress(...texts: Array<string | undefined | null>): boolean {
  const joined = normalize(texts.filter(Boolean).join(" "));
  if (!joined.trim()) return false;
  return MOTS_DETRESSE.some((mot) => joined.includes(normalize(mot)));
}
