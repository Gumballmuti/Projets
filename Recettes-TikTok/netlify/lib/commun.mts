import { createHmac, timingSafeEqual } from "node:crypto";
import { getDeployStore, getStore } from "@netlify/blobs";

export type Statut = "en_cours" | "ok" | "erreur";

export interface Fiche {
  id: string;
  lien: string; // lien tel que collé (sert à repérer les doublons)
  url: string;
  statut: Statut;
  erreur: string | null;
  titre: string;
  auteur: string;
  source: string;
  donnees: Record<string, unknown> | null;
  image: boolean;
  cree_le: string;
  maj_le?: string;
  etape?: "attente" | "analyse"; // « analyse » dès qu'une fonction a commencé le travail
  texte?: string; // recette collée à la main, le cas échéant
}

// Les recettes de production restent séparées des tests (deploy previews).
export function magasin() {
  if (Netlify.context?.deploy?.context === "production") {
    return getStore({ name: "recettes", consistency: "strong" });
  }
  return getDeployStore({ name: "recettes", consistency: "strong" });
}

export const cleFiche = (id: string) => `r/${id}`;
export const cleImage = (id: string) => `img/${id}`;

export async function lireFiche(id: string): Promise<Fiche | null> {
  return magasin().get(cleFiche(id), { type: "json" });
}

export async function ecrireFiche(fiche: Fiche) {
  await magasin().setJSON(cleFiche(fiche.id), fiche);
}

// ---------- Authentification : un cookie signé avec le mot de passe ----------

export function jeton(): string {
  const motDePasse = Netlify.env.get("APP_PASSWORD") ?? "";
  return createHmac("sha256", motDePasse).update("mes-recettes").digest("hex");
}

export function egal(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function estConnecte(req: Request): boolean {
  if (!Netlify.env.get("APP_PASSWORD")) return false;
  const cookie = req.headers.get("cookie") ?? "";
  const m = cookie.match(/(?:^|;\s*)session=([a-f0-9]+)/);
  return !!m && egal(m[1], jeton());
}

export function json(donnees: unknown, status = 200) {
  return Response.json(donnees, { status });
}
