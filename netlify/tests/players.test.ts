import { describe, expect, it } from "vitest";
import {
  checkPlayer,
  enterPlayer,
  hashPersonalCode,
  MAX_FAILURES,
  MAX_PLAYER_COUNT,
  personalCodeMatches,
  PLAYERS_KEY,
  readPlayers,
  type Player,
  type Players,
} from "../lib/players";
import { memoryStore } from "./memory-store";

const NOW = new Date("2026-11-07T18:00:00Z");

const playersIn = (data: Map<string, unknown>) =>
  readPlayers(data.get(PLAYERS_KEY) ?? null);

describe("the personal code", () => {
  it("is kept hashed with a salt of its own, never readable", async () => {
    const first = await hashPersonalCode("1234");
    const second = await hashPersonalCode("1234");
    expect(first).toMatch(/^scrypt:[0-9a-f]{32}:[0-9a-f]{64}$/);
    expect(first).not.toContain("1234");
    expect(first).not.toBe(second);
    expect(await personalCodeMatches("1234", first)).toBe(true);
    expect(await personalCodeMatches("1235", first)).toBe(false);
  });

  it.each(["", "plain:1234", "scrypt::", "bcrypt:00:00"])(
    "never matches the malformed hash %j",
    async (codeHash) => {
      expect(await personalCodeMatches("1234", codeHash)).toBe(false);
    },
  );
});

describe("readPlayers", () => {
  it("starts with nobody", () => {
    expect(readPlayers(null)).toEqual({ nextId: 1, list: [] });
  });

  it.each([{}, [], "text", { nextId: 1, list: [{ id: "x" }] }])(
    "fails on the unexpected shape %j rather than losing the players",
    (value) => {
      expect(() => readPlayers(value)).toThrow();
    },
  );
});

describe("enterPlayer", () => {
  it("makes a new player for a new nickname, with a fixed id", async () => {
    const { store, data } = memoryStore();
    const first = await enterPlayer(store, "Sylent", "1234", NOW);
    const second = await enterPlayer(store, "Nova", "0000", NOW);
    expect(first).toMatchObject({
      ok: true,
      player: { id: "j1", nickname: "Sylent", failures: 0 },
    });
    expect(second).toMatchObject({ ok: true, player: { id: "j2" } });
    expect(playersIn(data)).toMatchObject({
      nextId: 3,
      list: [
        { id: "j1", nickname: "Sylent", createdAt: NOW.toISOString() },
        { id: "j2", nickname: "Nova" },
      ],
    });
  });

  it("lets a known nickname in with its personal code, whatever its case", async () => {
    const { store, data } = memoryStore();
    await enterPlayer(store, "Sylent", "1234", NOW);
    expect(await enterPlayer(store, "SYLENT", "1234", NOW)).toMatchObject({
      ok: true,
      player: { id: "j1", nickname: "Sylent" },
    });
    expect(playersIn(data).list).toHaveLength(1);
  });

  it("refuses a known nickname with another personal code", async () => {
    const { store } = memoryStore();
    await enterPlayer(store, "Sylent", "1234", NOW);
    expect(await enterPlayer(store, "sylent", "9999", NOW)).toEqual({
      ok: false,
      error: "wrong-personal-code",
    });
  });

  it("gives a nickname whose code was reset the code given", async () => {
    const { store, data } = memoryStore();
    await enterPlayer(store, "Sylent", "1234", NOW);
    const players = playersIn(data);
    data.set(PLAYERS_KEY, {
      ...players,
      list: players.list.map((player) => ({
        ...player,
        codeHash: null,
        failures: MAX_FAILURES,
      })),
    });
    expect(await enterPlayer(store, "Sylent", "4321", NOW)).toMatchObject({
      ok: true,
      player: { id: "j1", failures: 0 },
    });
    expect(await checkPlayer(store, "j1", "4321")).toMatchObject({ ok: true });
    expect(await checkPlayer(store, "j1", "1234")).toMatchObject({ ok: false });
  });

  it("gives a nickname to one of two friends who take it at the same second", async () => {
    const { store, data } = memoryStore();
    const [first, second] = await Promise.all([
      enterPlayer(store, "Sylent", "1234", NOW),
      enterPlayer(store, "Sylent", "9999", NOW),
    ]);
    expect(playersIn(data).list).toHaveLength(1);
    expect([first.ok, second.ok].sort()).toEqual([false, true]);
  });

  it("refuses a new player once the bag has its most players", async () => {
    const list: Player[] = Array.from(
      { length: MAX_PLAYER_COUNT },
      (_, index) => ({
        id: `j${index + 1}`,
        nickname: `Player${index + 1}`,
        codeHash: null,
        failures: 0,
        createdAt: NOW.toISOString(),
      }),
    );
    const players: Players = { nextId: MAX_PLAYER_COUNT + 1, list };
    const { store } = memoryStore({ [PLAYERS_KEY]: players });
    expect(await enterPlayer(store, "Latecomer", "1234", NOW)).toEqual({
      ok: false,
      error: "too-many-players",
    });
  });
});

describe("checkPlayer", () => {
  const withSylent = async () => {
    const memory = memoryStore();
    await enterPlayer(memory.store, "Sylent", "1234", NOW);
    return memory;
  };

  it("lets the player in with their id and personal code, without writing", async () => {
    const { store } = await withSylent();
    const before = await store.getVersioned(PLAYERS_KEY);
    expect(await checkPlayer(store, "j1", "1234")).toMatchObject({
      ok: true,
      player: { id: "j1" },
    });
    expect((await store.getVersioned(PLAYERS_KEY))?.etag).toBe(before?.etag);
  });

  it.each(["j2", "", "1", "constructor", "__proto__"])(
    "doesn't know the player %j",
    async (id) => {
      const { store } = await withSylent();
      expect(await checkPlayer(store, id, "1234")).toEqual({
        ok: false,
        error: "unknown-player",
      });
    },
  );

  it(`locks the nickname after ${MAX_FAILURES} wrong codes in a row, even for the right one`, async () => {
    const { store, data } = await withSylent();
    for (let failure = 1; failure < MAX_FAILURES; failure++) {
      expect(await checkPlayer(store, "j1", "0000")).toEqual({
        ok: false,
        error: "wrong-personal-code",
      });
    }
    expect(await checkPlayer(store, "j1", "0000")).toEqual({
      ok: false,
      error: "player-locked",
    });
    expect(await checkPlayer(store, "j1", "1234")).toEqual({
      ok: false,
      error: "player-locked",
    });
    expect(await enterPlayer(store, "Sylent", "1234", NOW)).toEqual({
      ok: false,
      error: "player-locked",
    });
    expect(playersIn(data).list[0]?.failures).toBe(MAX_FAILURES);
  });

  it("counts the wrong codes in a row only: the right one clears them", async () => {
    const { store, data } = await withSylent();
    for (let failure = 1; failure < MAX_FAILURES; failure++) {
      await checkPlayer(store, "j1", "0000");
    }
    expect(await checkPlayer(store, "j1", "1234")).toMatchObject({ ok: true });
    expect(playersIn(data).list[0]?.failures).toBe(0);
    expect(await checkPlayer(store, "j1", "0000")).toEqual({
      ok: false,
      error: "wrong-personal-code",
    });
  });

  it("sends a player whose code was reset back to the welcome", async () => {
    const { store, data } = await withSylent();
    const players = playersIn(data);
    data.set(PLAYERS_KEY, {
      ...players,
      list: players.list.map((player) => ({ ...player, codeHash: null })),
    });
    expect(await checkPlayer(store, "j1", "1234")).toEqual({
      ok: false,
      error: "personal-code-reset",
    });
  });
});
