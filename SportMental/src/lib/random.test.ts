import { describe, expect, it } from "vitest";
import { POINT_SUIVANT_MESSAGES } from "@/content/messages";
import { filterBySport } from "./content";
import { pickWithoutRepeat } from "./random";

const items = [{ id: "a" }, { id: "b" }, { id: "c" }];

describe("sélection aléatoire des messages", () => {
  it("renvoie null pour une liste vide", () => {
    expect(pickWithoutRepeat([], null)).toBeNull();
  });

  it("ne répète jamais le message précédent", () => {
    let prev: string | null = null;
    for (let i = 0; i < 1000; i++) {
      const m: { id: string } = pickWithoutRepeat(items, prev)!;
      expect(m.id).not.toBe(prev);
      prev = m.id;
    }
  });

  it("garde l'unique élément s'il n'y en a qu'un", () => {
    expect(pickWithoutRepeat([{ id: "seul" }], "seul")?.id).toBe("seul");
  });

  it("reste dans les bornes même si rng renvoie 1", () => {
    expect(pickWithoutRepeat(items, "a", () => 0.999999)?.id).toBe("c");
    expect(pickWithoutRepeat(items, null, () => 1)?.id).toBe("c");
    expect(pickWithoutRepeat(items, "a", () => 0)?.id).toBe("b");
  });

  it("finit par proposer tous les messages d'un sport", () => {
    const pool = filterBySport(POINT_SUIVANT_MESSAGES, "volley");
    const seen = new Set<string>();
    let prev: string | null = null;
    for (let i = 0; i < 5000; i++) {
      const m: { id: string } = pickWithoutRepeat(pool, prev)!;
      seen.add(m.id);
      prev = m.id;
    }
    expect(seen.size).toBe(pool.length);
    expect([...seen].every((id) => !id.startsWith("p"))).toBe(true);
  });
});
