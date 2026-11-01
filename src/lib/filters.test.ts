import { describe, expect, it } from "vitest";
import type { BagGame } from "./bag";
import {
  NO_FILTERS,
  clampPlayers,
  isFiltering,
  passes,
  playersOf,
  shownOf,
  tagChoices,
} from "./filters";

const gameOf = (
  categories: number[],
  genres: string[],
  maxPlayers: number | null = null,
): Pick<BagGame, "categories" | "genres" | "maxPlayers"> => ({
  categories: categories.map((id) => ({ id, name: `Steam ${id}` })),
  genres,
  maxPlayers,
});

describe("tagChoices", () => {
  it("offers the kinds of the bag in the order of the cards, then its genres by frequency", () => {
    expect(
      tagChoices([
        gameOf([2, 47], ["Stratégie", "Action"]),
        gameOf([9], ["Action", "Action"]),
        gameOf([47, 24], ["Aventure"]),
      ]),
    ).toEqual([
      "Coop",
      "JcJ en LAN",
      "Écran partagé",
      "Action",
      "Aventure",
      "Stratégie",
    ]);
  });

  it("offers nothing for an empty bag", () => {
    expect(tagChoices([])).toEqual([]);
  });
});

describe("passes", () => {
  const game = gameOf([9, 48], ["Action"], 4);

  it("lets every game through without filters", () => {
    expect(passes(game, NO_FILTERS)).toBe(true);
  });

  it("asks for every tag pressed", () => {
    expect(
      passes(game, { tags: ["Coop en LAN", "Action"], players: null }),
    ).toBe(true);
    expect(
      passes(game, { tags: ["Coop en LAN", "Stratégie"], players: null }),
    ).toBe(false);
  });

  it("hides a game for fewer players than N, keeps a game without a number", () => {
    expect(passes(game, { tags: [], players: 4 })).toBe(true);
    expect(passes(game, { tags: [], players: 5 })).toBe(false);
    expect(passes(gameOf([], [], null), { tags: [], players: 99 })).toBe(true);
  });
});

describe("isFiltering", () => {
  it("is on with a tag or with « Jouable à N »", () => {
    expect(isFiltering(NO_FILTERS)).toBe(false);
    expect(isFiltering({ tags: ["Coop"], players: null })).toBe(true);
    expect(isFiltering({ tags: [], players: 9 })).toBe(true);
  });
});

describe("clampPlayers", () => {
  it("keeps N from 1 to 99", () => {
    expect(clampPlayers(0)).toBe(1);
    expect(clampPlayers(9)).toBe(9);
    expect(clampPlayers(100)).toBe(99);
  });
});

describe("playersOf", () => {
  it("follows the bag until the friend chooses N", () => {
    expect(playersOf(null, 9)).toBe(9);
    expect(playersOf(null, 120)).toBe(99);
    expect(playersOf(5, 9)).toBe(5);
  });
});

describe("shownOf", () => {
  it("keeps the singular for 0 and 1 game", () => {
    expect(shownOf(0, 47)).toBe("jeu sur 47");
    expect(shownOf(1, 47)).toBe("jeu sur 47");
    expect(shownOf(2, 47)).toBe("jeux sur 47");
  });
});
