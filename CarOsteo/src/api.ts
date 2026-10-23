/** Appels à notre serveur (comptes et dossiers). */
export class NonConnecte extends Error {}

export async function appel<T = any>(chemin: string, methode = "GET", corps?: unknown): Promise<T> {
  const r = await fetch("/api/" + chemin, {
    method: methode,
    credentials: "same-origin",
    // X-CarOsteo prouve au serveur que la demande vient de l'app (protection contre les autres sites)
    headers: { "Content-Type": "application/json", "X-CarOsteo": "1" },
    body: corps === undefined ? undefined : JSON.stringify(corps),
  });
  const json = await r.json().catch(() => ({}));
  if (r.status === 401) {
    window.dispatchEvent(new Event("carosteo:deconnecte"));
    throw new NonConnecte(json.erreur || "Non connecté");
  }
  if (!r.ok) throw new Error(json.erreur || "Erreur " + r.status);
  return json as T;
}
