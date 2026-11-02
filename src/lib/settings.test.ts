import { describe, expect, it } from "vitest";
import type { BagGame, BagView } from "./bag";
import {
  accountsOf,
  countsOf,
  deleteText,
  formatWhen,
  renameCountText,
  renamesLeftOf,
  renamesLeftText,
} from "./settings";

const game = (
  appid: number,
  addedBy: string,
  votes: BagGame["votes"],
): BagGame => ({
  appid,
  name: `Game ${appid}`,
  cover: null,
  categories: [],
  genres: [],
  maxPlayers: null,
  addedBy,
  addedAt: "2026-11-01T20:00:00.000Z",
  votes,
});

describe("countsOf", () => {
  it("counts the games added and the votes on the games of the others", () => {
    const games = [
      game(1, "j1", { j1: "up", j2: "down" }),
      game(2, "j2", { j2: "up", j1: "down" }),
      game(3, "j3", { j3: "up", j1: "up" }),
      game(4, "j3", { j3: "up" }),
    ];
    expect(countsOf(games, "j1")).toEqual({ games: 1, votes: 2 });
    expect(countsOf(games, "j4")).toEqual({ games: 0, votes: 0 });
  });
});

describe("accountsOf", () => {
  it("follows the players of the bag, with the states and renames last read", () => {
    const view: BagView = {
      role: "admin",
      me: { id: "j1", nickname: "Sylent" },
      renames: 0,
      players: [
        { id: "j1", nickname: "Sylent" },
        { id: "j3", nickname: "Zed" },
      ],
      games: [],
    };
    expect(
      accountsOf(view, [
        { id: "j1", nickname: "Sylent", state: "active", renames: 1 },
        { id: "j2", nickname: "Nova", state: "locked", renames: 2 },
      ]),
    ).toEqual([
      { id: "j1", nickname: "Sylent", state: "active", renames: 1 },
      { id: "j3", nickname: "Zed", state: "active", renames: 0 },
    ]);
  });
});

describe("the renames", () => {
  it.each([
    [0, 3, "3 restants"],
    [2, 1, "1 restant"],
    [3, 0, "plus de renommage"],
    [5, 0, "plus de renommage"],
  ])("says what is left after %i used", (used, left, text) => {
    expect(renamesLeftOf(used)).toBe(left);
    expect(renamesLeftText(left)).toBe(text);
  });

  it("dates a rename from the day of the browser", () => {
    const now = new Date(2026, 10, 7, 20, 0);
    expect(formatWhen(new Date(2026, 10, 7, 18, 2), now)).toBe(
      "aujourd’hui à 18\u00a0h\u00a002",
    );
    expect(formatWhen(new Date(2026, 10, 6, 23, 41), now)).toBe(
      "hier à 23\u00a0h\u00a041",
    );
    expect(formatWhen(new Date(2026, 10, 3, 9, 5), now)).toBe(
      "le 3/11 à 9\u00a0h\u00a005",
    );
  });

  it("counts a rename by the friend, not one by the admin", () => {
    const entry = { id: "j2", from: "Pix", to: "Pixel", at: "", used: 2 };
    expect(renameCountText(entry)).toBe("2/3");
    expect(renameCountText({ ...entry, used: null })).toBe(
      "par toi, non compté",
    );
  });
});

describe("deleteText", () => {
  it.each([
    [{ games: 3, votes: 12 }, "Ses 3 jeux et ses 12 votes partent avec lui."],
    [{ games: 1, votes: 1 }, "Son jeu et son vote partent avec lui."],
    [{ games: 1, votes: 0 }, "Son jeu part avec lui."],
    [{ games: 0, votes: 4 }, "Ses 4 votes partent avec lui."],
    [{ games: 0, votes: 0 }, "Il n’a ni jeu ni vote."],
  ])("says what goes with %j", (counts, text) => {
    expect(deleteText(counts)).toBe(text);
  });
});
