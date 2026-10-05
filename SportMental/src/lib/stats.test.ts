import { describe, expect, it } from "vitest";
import type { DimensionId } from "@/content/bilan";
import { extremes, moyenne, moyenneMatch, pente, statsParDimension, tendance } from "./stats";
import type { MatchBilan } from "./storage";

const notes = (v: Partial<Record<DimensionId, number>> = {}): Record<DimensionId, number> => ({
  confiance: 5, concentration: 5, erreurs: 5, pression: 5, communication: 5, plaisir: 5, ...v,
});

const match = (date: string, n: Partial<Record<DimensionId, number>>): MatchBilan => ({
  id: date, date, sport: "padel", notes: notes(n), momentRebond: "", pointFort: "", aAmeliorer: "",
  outils: [], resultat: null, ressenti: null, ressentiTexte: "",
});

describe("statistiques", () => {
  it("calcule une moyenne arrondie au dixième", () => {
    expect(moyenne([])).toBeNull();
    expect(moyenne([7, 8, 8])).toBe(7.7);
  });

  it("calcule la pente de régression", () => {
    expect(pente([5])).toBe(0);
    expect(pente([1, 2, 3, 4])).toBeCloseTo(1);
    expect(pente([6, 6, 6])).toBe(0);
  });

  it("n'affiche aucune tendance avant 3 matchs", () => {
    expect(tendance([])).toBeNull();
    expect(tendance([4, 9])).toBeNull();
  });

  it("décrit les tendances avec nuance", () => {
    expect(tendance([4, 5, 6, 7])).toBe("hausse");
    expect(tendance([6, 6, 7, 6, 7])).toBe("legere-hausse");
    expect(tendance([6, 6, 6])).toBe("stable");
    expect(tendance([7, 7, 6, 7, 6])).toBe("legere-baisse");
    expect(tendance([8, 6, 4])).toBe("baisse");
  });

  it("calcule les stats par dimension dans l'ordre chronologique", () => {
    const s = statsParDimension([
      match("2026-03-03T10:00:00.000Z", { confiance: 8 }),
      match("2026-03-01T10:00:00.000Z", { confiance: 4 }),
      match("2026-03-02T10:00:00.000Z", { confiance: 6 }),
    ]);
    const c = s.find((x) => x.id === "confiance")!;
    expect(c.valeurs).toEqual([4, 6, 8]);
    expect(c.derniere).toBe(8);
    expect(c.moyenne).toBe(6);
    expect(c.tendance).toBe("hausse");
  });

  it("renvoie des stats vides sans match", () => {
    for (const d of statsParDimension([])) {
      expect(d.moyenne).toBeNull();
      expect(d.derniere).toBeNull();
      expect(d.tendance).toBeNull();
    }
  });

  it("trouve la dimension la plus basse et la plus haute", () => {
    expect(extremes(notes({ erreurs: 3, plaisir: 9 }))).toEqual({ basse: "erreurs", haute: "plaisir", egales: false });
    expect(extremes(notes()).egales).toBe(true);
    expect(moyenneMatch(match("2026-01-01", { confiance: 8, plaisir: 8 }))).toBe(6);
  });
});
