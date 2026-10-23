/**
 * Où sont rangées les données : Vercel Blob (privé) en ligne,
 * un simple fichier (.donnees-dev.json) en local avec « npm run dev ».
 *
 * Tout est chiffré (AES-256-GCM) avant d'être rangé, avec la clé CHIFFREMENT_CLE
 * (variable Vercel) : sans elle, le contenu du stockage est illisible.
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { del, get, list, put } from "@vercel/blob";

export interface Magasin {
  lire<T>(cle: string): Promise<T | null>;
  ecrire(cle: string, valeur: unknown): Promise<void>;
  supprimer(cle: string): Promise<void>;
  lister(prefixe: string): Promise<string[]>;
}

interface Chiffre {
  v: 1;
  iv: string;
  tag: string;
  data: string;
}

const enProduction = () => !!process.env.BLOB_READ_WRITE_TOKEN;

/** Clé de 32 octets : CHIFFREMENT_CLE en ligne (obligatoire), une clé fixe en local. */
function cle(): Buffer {
  const brute = process.env.CHIFFREMENT_CLE ?? "";
  if (!brute) {
    if (enProduction()) throw new Error("CHIFFREMENT_CLE manquante");
    return createHash("sha256").update("carosteo-dev-uniquement").digest();
  }
  const octets = Buffer.from(brute, "base64");
  if (octets.length !== 32) throw new Error("CHIFFREMENT_CLE doit faire 32 octets (base64)");
  return octets;
}

function chiffrer(valeur: unknown, chemin: string): Chiffre {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", cle(), iv);
  // le chemin est lié au contenu : un fichier déplacé ailleurs ne se déchiffre plus
  c.setAAD(Buffer.from(chemin));
  const data = Buffer.concat([c.update(JSON.stringify(valeur), "utf8"), c.final()]);
  return { v: 1, iv: iv.toString("base64"), tag: c.getAuthTag().toString("base64"), data: data.toString("base64") };
}

function dechiffrer<T>(boite: Chiffre, chemin: string): T {
  const d = createDecipheriv("aes-256-gcm", cle(), Buffer.from(boite.iv, "base64"));
  d.setAAD(Buffer.from(chemin));
  d.setAuthTag(Buffer.from(boite.tag, "base64"));
  const clair = Buffer.concat([d.update(Buffer.from(boite.data, "base64")), d.final()]);
  return JSON.parse(clair.toString("utf8"));
}

const enLigne: Magasin = {
  async lire<T>(chemin: string) {
    const r = await get(chemin, { access: "private", useCache: false }).catch(() => null);
    if (!r || r.statusCode !== 200) return null;
    return dechiffrer<T>(JSON.parse(await new Response(r.stream).text()), chemin);
  },
  async ecrire(chemin, valeur) {
    await put(chemin, JSON.stringify(chiffrer(valeur, chemin)), {
      access: "private", allowOverwrite: true, addRandomSuffix: false, contentType: "application/json",
    });
  },
  async supprimer(chemin) {
    await del(chemin).catch(() => {});
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
let memoire: Record<string, Chiffre> | null = null;
const donnees = () => (memoire ??= existsSync(FICHIER) ? JSON.parse(readFileSync(FICHIER, "utf8")) : {});
const sauver = () => writeFileSync(FICHIER, JSON.stringify(donnees()));

const enLocal: Magasin = {
  async lire<T>(chemin: string) {
    const boite = donnees()[chemin];
    return boite ? dechiffrer<T>(boite, chemin) : null;
  },
  async ecrire(chemin, valeur) {
    donnees()[chemin] = chiffrer(valeur, chemin);
    sauver();
  },
  async supprimer(chemin) {
    delete donnees()[chemin];
    sauver();
  },
  async lister(prefixe) {
    return Object.keys(donnees()).filter((c) => c.startsWith(prefixe));
  },
};

export const magasinBrut = (): Magasin => (enProduction() ? enLigne : enLocal);
