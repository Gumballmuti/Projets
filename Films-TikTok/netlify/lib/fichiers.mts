/**
 * Vidéos (ou captures d'écran) envoyées depuis le téléphone ou l'ordinateur.
 * Netlify limite la taille d'une requête : la page envoie la vidéo par morceaux de 3 Mo,
 * rangés dans les données de l'utilisateur, puis l'analyse les recolle.
 * Identique dans les deux apps.
 */
import { magasin } from "./comptes.mts";
import { type Image, infosFichier, infosVideo, telechargerVideo } from "./sources.mts";

export const TAILLE_MORCEAU = 3 * 1024 * 1024;
export const TAILLE_MAX_FICHIER = 150 * 1024 * 1024;

const prefixe = (id: string) => `tmp/${id}/`;

export async function recevoirMorceau(id: string, numero: number, req: Request) {
  const donnees = await req.arrayBuffer();
  if (donnees.byteLength > TAILLE_MORCEAU + 1024) throw new Error("Morceau trop gros");
  await magasin().set(prefixe(id) + String(numero).padStart(4, "0"), donnees);
}

/** Une capture d'écran (déjà réduite en JPEG par la page). */
export async function recevoirImage(id: string, numero: number, req: Request) {
  const donnees = await req.arrayBuffer();
  if (donnees.byteLength > TAILLE_MORCEAU + 1024) throw new Error("Image trop grosse");
  await magasin().set(`${prefixe(id)}i-${String(numero).padStart(4, "0")}`, donnees);
}

async function lireImages(id: string): Promise<Image[]> {
  const store = magasin();
  const { blobs } = await store.list({ prefix: `${prefixe(id)}i-` });
  const cles = blobs.map((b) => b.key).sort();
  const images = await Promise.all(cles.map((cle) => store.get(cle, { type: "arrayBuffer" }) as Promise<ArrayBuffer>));
  return images.map((donnees) => ({ donnees, type: "image/jpeg" }));
}

export async function assemblerFichier(id: string): Promise<Buffer | null> {
  const store = magasin();
  const { blobs } = await store.list({ prefix: prefixe(id) });
  const cles = blobs.map((b) => b.key).filter((cle) => !cle.slice(prefixe(id).length).startsWith("i-")).sort();
  if (!cles.length) return null;
  const morceaux = await Promise.all(cles.map((cle) => store.get(cle, { type: "arrayBuffer" }) as Promise<ArrayBuffer>));
  return Buffer.concat(morceaux.map((m) => Buffer.from(m)));
}

export async function effacerFichier(id: string) {
  const store = magasin();
  const { blobs } = await store.list({ prefix: prefixe(id) });
  await Promise.all(blobs.map((b) => store.delete(b.key)));
}

/**
 * Rassemble de quoi analyser : la vidéo envoyée en fichier, ou les infos du lien
 * et la vidéo téléchargée quand c'est possible (YouTube est regardé directement par Gemini).
 */
export async function preparerVideo(element: { id: string; url: string; lien?: string; fichier?: boolean }) {
  if (element.fichier) {
    const infos = infosFichier();
    infos.images = await lireImages(element.id);
    return { infos, video: await assemblerFichier(element.id) };
  }
  // Le lien d'origine d'abord : l'adresse reconstruite après une analyse ratée peut être fausse.
  const infos = await infosVideo(element.lien || element.url);
  let video: Buffer | null = null;
  if (!infos.youtube) {
    try {
      video = await telechargerVideo(infos);
    } catch {
      // on se contente de la description, des sous-titres et du contenu de la page
    }
  }
  return { infos, video };
}
