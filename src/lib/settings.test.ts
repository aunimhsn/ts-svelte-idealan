import { describe, expect, it } from "vitest";
import type { BagGame, BagView } from "./bag";
import { accountsOf, countsOf, deleteText } from "./settings";

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
  it("follows the players of the bag, with the states last read", () => {
    const view: BagView = {
      role: "admin",
      me: { id: "j1", nickname: "Sylent" },
      players: [
        { id: "j1", nickname: "Sylent" },
        { id: "j3", nickname: "Zed" },
      ],
      games: [],
    };
    expect(
      accountsOf(view, [
        { id: "j1", nickname: "Sylent", state: "active" },
        { id: "j2", nickname: "Nova", state: "locked" },
      ]),
    ).toEqual([
      { id: "j1", nickname: "Sylent", state: "active" },
      { id: "j3", nickname: "Zed", state: "active" },
    ]);
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
