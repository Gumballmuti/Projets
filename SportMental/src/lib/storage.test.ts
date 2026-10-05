import { describe, expect, it } from "vitest";
import {
  STORAGE_KEY,
  defaultData,
  exportJson,
  importJson,
  readData,
  sanitize,
  writeData,
  type StorageBackend,
} from "./storage";

function memoryBackend(): StorageBackend & { map: Map<string, string> } {
  const map = new Map<string, string>();
  return {
    map,
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  };
}

describe("service de stockage", () => {
  it("renvoie des données par défaut quand rien n'est stocké", () => {
    const r = readData(memoryBackend());
    expect(r.status).toBe("ok");
    expect(r.data).toEqual(defaultData());
  });

  it("écrit puis relit les données", () => {
    const b = memoryBackend();
    const d = defaultData();
    d.profil.prenom = "Sam";
    d.profil.sports = ["padel"];
    d.profil.sportActif = "padel";
    expect(writeData(b, d)).toBe("ok");
    const stored = JSON.parse(b.map.get(STORAGE_KEY)!);
    expect(stored.version).toBe(1);
    expect(readData(b).data.profil.prenom).toBe("Sam");
  });

  it("signale un stockage indisponible", () => {
    expect(readData(null).status).toBe("unavailable");
    expect(writeData(null, defaultData())).toBe("unavailable");
  });

  it("signale un quota plein", () => {
    const b: StorageBackend = {
      getItem: () => null,
      setItem: () => {
        throw new DOMException("plein", "QuotaExceededError");
      },
      removeItem: () => {},
    };
    expect(writeData(b, defaultData())).toBe("quota");
  });

  it("survit à un JSON corrompu", () => {
    const b = memoryBackend();
    b.map.set(STORAGE_KEY, "{pas du json");
    expect(readData(b).data).toEqual(defaultData());
  });

  it("nettoie les valeurs invalides", () => {
    const d = sanitize({
      profil: { prenom: 42, sports: ["padel", "golf", "padel"], sportActif: "golf", theme: "rose" },
      matchs: [
        { date: "2026-01-01", notes: { confiance: 99, concentration: -3 } },
        { date: "pas une date", notes: {} },
      ],
      preuves: [{ date: "2026-01-01", texte: "   " }],
    });
    expect(d.profil.prenom).toBe("");
    expect(d.profil.sports).toEqual(["padel"]);
    expect(d.profil.sportActif).toBe("padel");
    expect(d.profil.theme).toBe("system");
    expect(d.matchs).toHaveLength(1);
    expect(d.matchs[0]!.notes.confiance).toBe(10);
    expect(d.matchs[0]!.notes.concentration).toBe(1);
    expect(d.matchs[0]!.notes.plaisir).toBe(5);
    expect(d.preuves).toHaveLength(0);
  });

  it("exporte et réimporte sans perte", () => {
    const d = defaultData();
    d.preuves.push({ id: "p1", date: new Date("2026-02-01").toISOString(), texte: "Belle série de volées" });
    const r = importJson(exportJson(d));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toEqual(d);
  });

  it("refuse un fichier étranger", () => {
    expect(importJson("[]").ok).toBe(false);
    expect(importJson("nope").ok).toBe(false);
    expect(importJson(JSON.stringify({ app: "autre", data: {} })).ok).toBe(false);
  });
});
