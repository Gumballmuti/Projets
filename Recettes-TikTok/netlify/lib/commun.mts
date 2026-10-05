import { magasin, nommerMagasin } from "./comptes.mts";

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

// Chaque compte a ses recettes : magasin() ne donne accès qu'à celles de l'utilisateur connecté.
nommerMagasin("recettes");
export { magasin };

export const cleFiche = (id: string) => `r/${id}`;
export const cleImage = (id: string) => `img/${id}`;

export async function lireFiche(id: string): Promise<Fiche | null> {
  return magasin().get(cleFiche(id), { type: "json" });
}

export async function ecrireFiche(fiche: Fiche) {
  await magasin().setJSON(cleFiche(fiche.id), fiche);
}

export function json(donnees: unknown, status = 200) {
  return Response.json(donnees, { status });
}
