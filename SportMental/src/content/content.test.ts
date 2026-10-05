import { describe, expect, it } from "vitest";
import { filterBySport, isForSport } from "@/lib/content";
import { CONTROLES } from "./erreur";
import { EXERCICES } from "./exercices";
import { POINT_SUIVANT_MESSAGES } from "./messages";
import { SITUATIONS_PRESSION } from "./pression";
import { PROGRAMMES } from "./programmes";
import type { ExerciseCategory, SportTag } from "./types";

const only = (tag: SportTag) => (x: { sports: readonly SportTag[] }) =>
  x.sports.length === 1 && x.sports[0] === tag;

/** Négations qui ramènent l'attention vers ce qu'on veut éviter. */
const NEGATION = /\b(ne|n'|n’)\s?\w*\s+(pas|plus|jamais)\b|\bne pense\b|\bévite\b|\bstresse pas\b/i;

describe("messages Point suivant", () => {
  it("respecte la répartition minimale", () => {
    expect(POINT_SUIVANT_MESSAGES.length).toBeGreaterThanOrEqual(30);
    expect(POINT_SUIVANT_MESSAGES.filter(only("all")).length).toBeGreaterThanOrEqual(20);
    expect(POINT_SUIVANT_MESSAGES.filter(only("padel")).length).toBeGreaterThanOrEqual(8);
    expect(POINT_SUIVANT_MESSAGES.filter(only("volley")).length).toBeGreaterThanOrEqual(8);
  });

  it("offre au moins 30 messages quel que soit le sport", () => {
    for (const sport of ["padel", "volley", "autre"] as const) {
      expect(filterBySport(POINT_SUIVANT_MESSAGES, sport).length).toBeGreaterThanOrEqual(30);
    }
  });

  it("est formulé en positif", () => {
    for (const m of POINT_SUIVANT_MESSAGES) expect(m.text, m.text).not.toMatch(NEGATION);
  });

  it("a des identifiants uniques", () => {
    const ids = POINT_SUIVANT_MESSAGES.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("exercices", () => {
  it("respecte la répartition minimale", () => {
    expect(EXERCICES.length).toBeGreaterThanOrEqual(30);
    expect(EXERCICES.filter(only("all")).length).toBeGreaterThanOrEqual(15);
    expect(EXERCICES.filter(only("padel")).length).toBeGreaterThanOrEqual(8);
    expect(EXERCICES.filter(only("volley")).length).toBeGreaterThanOrEqual(7);
  });

  it("couvre chaque catégorie au moins 3 fois", () => {
    const categories: ExerciseCategory[] = [
      "confiance", "concentration", "pression", "respiration", "erreurs",
      "motivation", "communication", "avant-match", "apres-match",
    ];
    for (const c of categories) {
      expect(EXERCICES.filter((e) => e.categorie === c).length, c).toBeGreaterThanOrEqual(3);
      // Un joueur « autre sport » voit au moins un exercice par catégorie.
      expect(filterBySport(EXERCICES, "autre").some((e) => e.categorie === c), c).toBe(true);
    }
  });

  it("a des variantes express de 20 secondes maximum", () => {
    for (const e of EXERCICES) if (e.express) expect(e.express.secondes, e.id).toBeLessThanOrEqual(20);
  });

  it("a des identifiants uniques et des étapes", () => {
    const ids = EXERCICES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const e of EXERCICES) expect(e.etapes.length, e.id).toBeGreaterThanOrEqual(3);
  });
});

describe("situations de pression", () => {
  it("contient les 8 situations demandées", () => {
    const ids = SITUATIONS_PRESSION.map((s) => s.id);
    for (const id of [
      "balle-de-break", "tie-break", "fin-de-set", "match-serre",
      "balle-de-match", "adversaire-plus-fort", "peur-de-perdre", "peur-de-decevoir",
    ]) expect(ids).toContain(id);
  });

  it("propose au moins deux options de plan par sport concerné", () => {
    for (const s of SITUATIONS_PRESSION) {
      for (const sport of ["padel", "volley", "autre"] as const) {
        if (!isForSport(s.sports, sport)) continue;
        expect(filterBySport(s.plan.options, sport).length, `${s.id}/${sport}`).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it("n'est pas copié-collé d'une situation à l'autre", () => {
    const corps = SITUATIONS_PRESSION.map((s) => s.corps);
    expect(new Set(corps).size).toBe(corps.length);
  });
});

describe("programmes", () => {
  it("contient 4 programmes de 7 jours", () => {
    expect(PROGRAMMES.map((p) => p.id).sort()).toEqual(["concentration", "confiance", "erreurs", "pression"]);
    for (const p of PROGRAMMES) {
      expect(p.jours.map((j) => j.jour)).toEqual([1, 2, 3, 4, 5, 6, 7]);
      for (const j of p.jours) {
        expect(j.exercice.duree).toBeGreaterThanOrEqual(5);
        expect(j.exercice.duree).toBeLessThanOrEqual(10);
        if (j.exercice.exerciceId) {
          expect(EXERCICES.some((e) => e.id === j.exercice.exerciceId), j.exercice.exerciceId).toBe(true);
        }
      }
    }
  });
});

describe("mode erreur", () => {
  it("propose les 5 choses à contrôler", () => {
    expect(CONTROLES.map((c) => c.id)).toEqual([
      "placement", "respiration", "communication", "intention", "prochain-coup",
    ]);
  });
});
