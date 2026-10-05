import { magasin, nommerMagasin } from "./comptes.mts";

export type Statut = "en_cours" | "ok" | "erreur";

/** Une vidéo TikTok ajoutée, et son analyse. */
export interface Video {
  id: string;
  lien: string; // lien tel que collé (sert à repérer les doublons)
  url: string;
  statut: Statut;
  erreur: string | null;
  sujet: string; // ex. « 5 thrillers à voir sur Netflix »
  auteur: string;
  oeuvres: string[]; // clés des films et séries trouvés
  image: boolean;
  cree_le: string;
  maj_le?: string;
  etape?: "attente" | "analyse"; // « analyse » dès qu'une fonction a commencé le travail
  texte?: string; // liste collée à la main, le cas échéant
}

/** Un film ou une série de la bibliothèque. */
export interface Oeuvre {
  cle: string;
  titre: string;
  titre_original: string;
  type: "film" | "serie";
  annee: string;
  genres: string[];
  resume: string;
  plateformes: string[];
  pourquoi: string; // ce qu'en dit le créateur de la vidéo
  vu: boolean;
  videos: string[]; // vidéos qui en parlent
  ajoute_le: string;
}

// Chaque compte a sa bibliothèque : magasin() ne donne accès qu'à celle de l'utilisateur connecté.
nommerMagasin("films");
export { magasin };

export const cleVideo = (id: string) => `v/${id}`;
export const cleOeuvre = (cle: string) => `o/${cle}`;
export const cleImage = (id: string) => `img/${id}`;

export async function lireVideo(id: string): Promise<Video | null> {
  return magasin().get(cleVideo(id), { type: "json" });
}

export async function ecrireVideo(video: Video) {
  await magasin().setJSON(cleVideo(video.id), video);
}

export async function lireOeuvre(cle: string): Promise<Oeuvre | null> {
  return magasin().get(cleOeuvre(cle), { type: "json" });
}

export async function ecrireOeuvre(oeuvre: Oeuvre) {
  await magasin().setJSON(cleOeuvre(oeuvre.cle), oeuvre);
}

export async function toutLire<T>(prefixe: string): Promise<T[]> {
  const store = magasin();
  const { blobs } = await store.list({ prefix: prefixe });
  const elements = await Promise.all(blobs.map((b) => store.get(b.key, { type: "json" }) as Promise<T | null>));
  return elements.filter(Boolean) as T[];
}

/** Même film, même clé : « Dune (2021) » trouvé dans deux vidéos ne fait qu'une fiche. */
export function cleDe(o: { type: string; titre: string; titre_original: string; annee: string }): string {
  const nom = (o.titre_original || o.titre)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return `${o.type}-${nom}-${(o.annee || "").slice(0, 4)}`.replace(/-$/, "");
}

export function json(donnees: unknown, status = 200) {
  return Response.json(donnees, { status });
}
