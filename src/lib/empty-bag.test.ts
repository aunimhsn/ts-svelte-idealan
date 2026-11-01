import { describe, expect, it } from "vitest";
import type { BagGame } from "./bag";
import {
  emptyAction,
  emptyText,
  keptWord,
  removedWord,
  toRemove,
} from "./empty-bag";

const game = (appid: number): BagGame => ({
  appid,
  name: `Game ${appid}`,
  cover: null,
  categories: [],
  genres: [],
  maxPlayers: null,
  addedBy: "j1",
  addedAt: "2026-11-07T18:00:00.000Z",
  votes: {},
});

describe("toRemove", () => {
  it("answers the games not kept, in the order shown", () => {
    const games = [game(30), game(10), game(20)];
    expect(toRemove(games, new Set([10]))).toEqual([30, 20]);
    expect(toRemove(games, new Set([10, 20, 30]))).toEqual([]);
  });

  it("ignores a kept appid no longer in the bag", () => {
    expect(toRemove([game(10)], new Set([99]))).toEqual([10]);
  });
});

describe("the texts", () => {
  it("takes the singular for 0 and 1, the plural from 2", () => {
    expect([0, 1, 2].map(keptWord)).toEqual(["gardé", "gardé", "gardés"]);
    expect([0, 1, 2].map(removedWord)).toEqual(["retiré", "retiré", "retirés"]);
    expect(emptyAction(1)).toBe("Vider (1 jeu)");
    expect(emptyAction(38)).toBe("Vider (38 jeux)");
  });

  it("says how many games the confirmation removes", () => {
    expect(emptyText(1)).toBe(
      "1 jeu sera retiré. Cette action est définitive.",
    );
    expect(emptyText(38)).toBe(
      "38 jeux seront retirés. Cette action est définitive.",
    );
  });
});
