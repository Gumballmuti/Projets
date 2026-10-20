/**
 * Où sont rangées les données : Vercel Blob (privé) en ligne,
 * un simple fichier (.donnees-dev.json) en local avec « npm run dev ».
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { del, get, list, put } from "@vercel/blob";

export interface Magasin {
  lire<T>(cle: string): Promise<T | null>;
  ecrire(cle: string, valeur: unknown): Promise<void>;
  supprimer(cle: string): Promise<void>;
  lister(prefixe: string): Promise<string[]>;
}

const enLigne: Magasin = {
  async lire(cle) {
    const r = await get(cle, { access: "private", useCache: false }).catch(() => null);
    if (!r || r.statusCode !== 200) return null;
    return JSON.parse(await new Response(r.stream).text());
  },
  async ecrire(cle, valeur) {
    await put(cle, JSON.stringify(valeur), {
      access: "private", allowOverwrite: true, addRandomSuffix: false, contentType: "application/json",
    });
  },
  async supprimer(cle) {
    await del(cle).catch(() => {});
  },
  async lister(prefixe) {
    const cles: string[] = [];
    let cursor: string | undefined;
    do {
      const r = await list({ prefix: prefixe, cursor });
      cles.push(...r.blobs.map((b) => b.pathname));
      cursor = r.hasMore ? r.cursor : undefined;
    } while (cursor);
    return cles;
  },
};

const FICHIER = ".donnees-dev.json";
let memoire: Record<string, unknown> | null = null;
const donnees = () => (memoire ??= existsSync(FICHIER) ? JSON.parse(readFileSync(FICHIER, "utf8")) : {});
const sauver = () => writeFileSync(FICHIER, JSON.stringify(donnees()));

const enLocal: Magasin = {
  async lire<T>(cle: string) {
    return (donnees()[cle] as T) ?? null;
  },
  async ecrire(cle, valeur) {
    donnees()[cle] = JSON.parse(JSON.stringify(valeur));
    sauver();
  },
  async supprimer(cle) {
    delete donnees()[cle];
    sauver();
  },
  async lister(prefixe) {
    return Object.keys(donnees()).filter((c) => c.startsWith(prefixe));
  },
};

export const magasinBrut = (): Magasin => (process.env.BLOB_READ_WRITE_TOKEN ? enLigne : enLocal);
