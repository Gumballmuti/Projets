/** Appels à notre serveur (comptes et bibliothèque). */
export class NonConnecte extends Error {}

export async function appel<T = any>(chemin: string, methode = "GET", corps?: unknown): Promise<T> {
  const r = await fetch("/api/" + chemin, {
    method: methode, headers: { "Content-Type": "application/json" },
    body: corps === undefined ? undefined : JSON.stringify(corps),
  });
  const json = await r.json().catch(() => ({}));
  if (r.status === 401) throw new NonConnecte(json.erreur || "Non connecté");
  if (!r.ok) throw new Error(json.erreur || "Erreur " + r.status);
  return json as T;
}
