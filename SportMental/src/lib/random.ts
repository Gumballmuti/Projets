/**
 * Tire un élément au hasard sans répéter le précédent.
 * `rng` est injectable pour les tests (Math.random par défaut).
 */
export function pickWithoutRepeat<T extends { id: string }>(
  items: readonly T[],
  previousId: string | null,
  rng: () => number = Math.random,
): T | null {
  if (items.length === 0) return null;
  const pool = items.length > 1 ? items.filter((i) => i.id !== previousId) : items;
  const index = Math.min(pool.length - 1, Math.floor(rng() * pool.length));
  return pool[index] ?? null;
}
