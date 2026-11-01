import { describe, expect, it } from "vitest";
import type { BagGame } from "./bag";
import { byScore, signed, tagsOf, voteOf } from "./games";

const gameOf = (
  appid: number,
  votes: BagGame["votes"],
  addedAt = "2026-11-01T20:00:00.000Z",
): BagGame => ({
  appid,
  name: `Game ${appid}`,
  cover: null,
  categories: [],
  genres: [],
  maxPlayers: null,
  addedBy: "j1",
  addedAt,
  votes,
});

describe("byScore", () => {
  it("sorts by score, then the oldest first, without changing the bag", () => {
    const games = [
      gameOf(1, { j1: "up" }, "2026-11-01T22:00:00.000Z"),
      gameOf(2, { j1: "up", j2: "up" }),
      gameOf(3, { j1: "up" }, "2026-11-01T21:00:00.000Z"),
      gameOf(4, { j1: "up", j2: "down", j3: "down" }),
    ];
    expect(byScore(games).map((game) => game.appid)).toEqual([2, 3, 1, 4]);
    expect(games.map((game) => game.appid)).toEqual([1, 2, 3, 4]);
  });
});

describe("tagsOf", () => {
  it("names the kinds of a LAN in short, then the genres", () => {
    expect(
      tagsOf({
        categories: [
          { id: 2, name: "Solo" },
          { id: 47, name: "JcJ en réseau local" },
          { id: 9, name: "Coopération" },
        ],
        genres: ["Action", "Indépendant"],
      }),
    ).toEqual(["Coop", "JcJ en LAN", "Action", "Indépendant"]);
  });
});

describe("voteOf", () => {
  it("gives own for a game the friend added, else their vote", () => {
    const game = gameOf(1, { j1: "up", j2: "down" });
    expect(voteOf(game, "j1")).toBe("own");
    expect(voteOf(game, "j2")).toBe("down");
    expect(voteOf(game, "j3")).toBeNull();
  });
});

describe("signed", () => {
  it("writes the sign of a score", () => {
    expect(signed(6)).toBe("+6");
    expect(signed(0)).toBe("0");
    expect(signed(-2)).toBe("−2");
  });
});
