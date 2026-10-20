/**
 * Remplace @netlify/blobs pendant « npm run dev » : les données restent sur l'ordinateur,
 * dans .donnees-dev.json. En ligne, c'est le vrai Netlify Blobs qui est utilisé.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const FICHIER = ".donnees-dev.json";
const donnees: Record<string, { texte: string; metadata: Record<string, unknown> }> =
  existsSync(FICHIER) ? JSON.parse(readFileSync(FICHIER, "utf8")) : {};
const sauver = () => writeFileSync(FICHIER, JSON.stringify(donnees));

function magasin(nom: string) {
  const k = (cle: string) => `${nom}:${cle}`;
  const lire = (texte: string, type?: string) =>
    type === "json" ? JSON.parse(texte) : type === "arrayBuffer" ? new TextEncoder().encode(texte).buffer : texte;
  return {
    async get(cle: string, options?: { type?: string }) {
      const e = donnees[k(cle)];
      return e ? lire(e.texte, options?.type) : null;
    },
    async getWithMetadata(cle: string, options?: { type?: string }) {
      const e = donnees[k(cle)];
      return e ? { data: lire(e.texte, options?.type), metadata: e.metadata } : null;
    },
    async set(cle: string, valeur: unknown, options?: { metadata?: Record<string, unknown> }) {
      donnees[k(cle)] = { texte: String(valeur), metadata: options?.metadata ?? {} };
      sauver();
    },
    async setJSON(cle: string, valeur: unknown) {
      donnees[k(cle)] = { texte: JSON.stringify(valeur), metadata: {} };
      sauver();
    },
    async delete(cle: string) {
      delete donnees[k(cle)];
      sauver();
    },
    async list({ prefix = "" }: { prefix?: string } = {}) {
      const debut = `${nom}:${prefix}`;
      return { blobs: Object.keys(donnees).filter((c) => c.startsWith(debut)).map((c) => ({ key: c.slice(nom.length + 1), etag: "" })) };
    },
  };
}

export const getStore = ({ name }: { name: string }) => magasin(name);
export const getDeployStore = getStore;
