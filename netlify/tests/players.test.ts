import { describe, expect, it, vi } from "vitest";

// Counts the calls to scrypt: how many personal codes were really checked.
const hashing = vi.hoisted(() => ({ calls: 0 }));
vi.mock("node:crypto", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:crypto")>();
  return {
    ...actual,
    scrypt: (...args: Parameters<typeof actual.scrypt>) => {
      hashing.calls++;
      return actual.scrypt(...args);
    },
  };
});

import {
  attemptsKey,
  checkPlayer,
  enterPlayer,
  hashPersonalCode,
  MAX_FAILURES,
  MAX_PLAYER_COUNT,
  personalCodeMatches,
  PLAYERS_KEY,
  PENDING_MS,
  readAttempts,
  readPlayers,
  type Player,
  type Players,
} from "../lib/players";
import { memoryStore } from "./memory-store";

const NOW = new Date("2026-11-07T18:00:00Z");

const playersIn = (data: Map<string, unknown>) =>
  readPlayers(data.get(PLAYERS_KEY) ?? null);

const attemptsIn = (data: Map<string, unknown>, id = "j1") =>
  readAttempts(data.get(attemptsKey(id)) ?? null);

const failuresIn = (data: Map<string, unknown>, id = "j1") =>
  attemptsIn(data, id).failures;

const failing = (failures: number) => ({ failures, pending: [] });

// Resets the personal code of every player, as the admin will (step 7).
const resetCodes = (data: Map<string, unknown>) => {
  const players = playersIn(data);
  data.set(PLAYERS_KEY, {
    ...players,
    list: players.list.map((player) => ({ ...player, codeHash: null })),
  });
};

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

  it.each([
    "",
    "plain:1234",
    "scrypt::",
    "bcrypt:00:00",
    "scrypt:ab:zz",
    `scrypt:${"0".repeat(32)}:`,
  ])("never matches the malformed hash %j", async (codeHash) => {
    expect(await personalCodeMatches("1234", codeHash)).toBe(false);
  });
});

describe("readPlayers", () => {
  it("starts with nobody", () => {
    expect(readPlayers(null)).toEqual({ nextId: 1, list: [], journal: [] });
  });

  it("reads players written before the renames, with none used and an empty journal", () => {
    const player = {
      id: "j1",
      nickname: "Nova",
      codeHash: null,
      createdAt: "2026-11-01T20:00:00.000Z",
    };
    expect(readPlayers({ nextId: 2, list: [player] })).toEqual({
      nextId: 2,
      list: [player],
      journal: [],
    });
  });

  it.each([
    { renames: 4 },
    { renames: -1 },
    { journal: [{ id: "j1", from: "A", to: "B", at: "x", used: 5 }] },
    { journal: [{ id: "x", from: "A", to: "B", at: "x", used: null }] },
    { journal: "text" },
  ])("fails loudly on renames it didn't write: %j", (change) => {
    const player = {
      id: "j1",
      nickname: "Nova",
      codeHash: null,
      createdAt: "2026-11-01T20:00:00.000Z",
    };
    const { journal, renames } = change as {
      journal?: unknown;
      renames?: unknown;
    };
    expect(() =>
      readPlayers({
        nextId: 2,
        list: [{ ...player, ...(renames === undefined ? {} : { renames }) }],
        ...(journal === undefined ? {} : { journal }),
      }),
    ).toThrow();
  });

  it.each([{}, [], "text", { nextId: 1, list: [{ id: "x" }] }])(
    "fails on the unexpected shape %j rather than losing the players",
    (value) => {
      expect(() => readPlayers(value)).toThrow();
    },
  );
});

describe("readAttempts", () => {
  it("counts no try for a player without any", () => {
    expect(readAttempts(null)).toEqual({ failures: 0, pending: [] });
    expect(
      readAttempts({ failures: 3, pending: [{ id: "a", at: 1 }] }),
    ).toEqual({ failures: 3, pending: [{ id: "a", at: 1 }] });
  });

  it.each([
    {},
    { failures: 1 },
    { failures: -1, pending: [] },
    { failures: "2", pending: [] },
    { failures: 0, pending: [{ id: 1, at: 1 }] },
    [],
  ])(
    "fails on the unexpected shape %j rather than unlocking the nickname",
    (value) => {
      expect(() => readAttempts(value)).toThrow();
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
      player: { id: "j1", nickname: "Sylent" },
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

  it("gives a nickname whose code was reset the code given, without its tries", async () => {
    const { store, data } = memoryStore();
    await enterPlayer(store, "Sylent", "1234", NOW);
    resetCodes(data);
    data.set(attemptsKey("j1"), failing(MAX_FAILURES));
    expect(await enterPlayer(store, "Sylent", "4321", NOW)).toMatchObject({
      ok: true,
      player: { id: "j1" },
    });
    expect(failuresIn(data)).toBe(0);
    expect(await checkPlayer(store, "j1", "4321")).toMatchObject({ ok: true });
    expect(await checkPlayer(store, "j1", "1234")).toMatchObject({ ok: false });
  });

  it("checks the code of a friend who took the nickname meanwhile", async () => {
    const { store, data, write, onBeforeWrite } = memoryStore();
    const other = memoryStore();
    await enterPlayer(other.store, "Sylent", "9999", NOW);
    let once = true;
    onBeforeWrite((key) => {
      // Another friend takes « Sylent » between the read and the write of this one.
      if (key === PLAYERS_KEY && once) {
        once = false;
        write(PLAYERS_KEY, other.data.get(PLAYERS_KEY));
      }
    });
    expect(await enterPlayer(store, "Sylent", "1234", NOW)).toEqual({
      ok: false,
      error: "wrong-personal-code",
    });
    expect(playersIn(data).list).toHaveLength(1);
    expect(once).toBe(false);
  });

  it("refuses a new player once the bag has its most players", async () => {
    const list: Player[] = Array.from(
      { length: MAX_PLAYER_COUNT },
      (_, index) => ({
        id: `j${index + 1}`,
        nickname: `Player${index + 1}`,
        codeHash: null,
        createdAt: NOW.toISOString(),
      }),
    );
    const players: Players = {
      nextId: MAX_PLAYER_COUNT + 1,
      list,
      journal: [],
    };
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

  it("lets the player in with their id and personal code, leaving no try counted", async () => {
    const { store, data } = await withSylent();
    expect(await checkPlayer(store, "j1", "1234")).toMatchObject({
      ok: true,
      player: { id: "j1" },
    });
    expect(failuresIn(data)).toBe(0);
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

  it.each(["", "123", "12345", "abcd"])(
    "refuses the code %j without counting a try",
    async (code) => {
      const { store, data } = await withSylent();
      expect(await checkPlayer(store, "j1", code)).toEqual({
        ok: false,
        error: "wrong-personal-code",
      });
      expect(failuresIn(data)).toBe(0);
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
    expect(failuresIn(data)).toBe(MAX_FAILURES);
  });

  it("checks at most 5 codes of a burst of parallel calls, from a player without tries", async () => {
    const { store, data } = await withSylent();
    expect(data.has(attemptsKey("j1"))).toBe(false);
    const codes = Array.from({ length: 30 }, (_, index) =>
      String(index).padStart(4, "0"),
    );
    hashing.calls = 0;
    await Promise.allSettled(
      codes.map((code) => checkPlayer(store, "j1", code)),
    );
    expect(hashing.calls).toBeLessThanOrEqual(MAX_FAILURES);
    expect(failuresIn(data)).toBe(hashing.calls);
    const left = MAX_FAILURES - failuresIn(data);
    for (let failure = 0; failure < left; failure++) {
      await checkPlayer(store, "j1", "0000");
    }
    expect(await checkPlayer(store, "j1", "1234")).toEqual({
      ok: false,
      error: "player-locked",
    });
  });

  it("refuses the right code when the nickname got locked just before its try", async () => {
    const { store, data, write, onBeforeWrite } = await withSylent();
    let once = true;
    onBeforeWrite((key) => {
      // Other calls lock the nickname between the read and the write of this try.
      if (key === attemptsKey("j1") && once) {
        once = false;
        write(attemptsKey("j1"), failing(MAX_FAILURES));
      }
    });
    expect(await checkPlayer(store, "j1", "1234")).toEqual({
      ok: false,
      error: "player-locked",
    });
    expect(failuresIn(data)).toBe(MAX_FAILURES);
  });

  it("keeps the tries other calls counted while the right code was checked", async () => {
    const { store, data, write, onBeforeWrite } = await withSylent();
    let writes = 0;
    onBeforeWrite((key) => {
      // A wrong code is counted between the try of this call and its withdrawal.
      if (key === attemptsKey("j1") && ++writes === 2) {
        const attempts = attemptsIn(data);
        write(attemptsKey("j1"), {
          ...attempts,
          failures: attempts.failures + 1,
        });
      }
    });
    expect(await checkPlayer(store, "j1", "1234")).toMatchObject({ ok: true });
    expect(failuresIn(data)).toBe(1);
  });

  it("refuses the old code when the admin reset it while it was checked", async () => {
    const { store, data, onBeforeWrite } = await withSylent();
    let writes = 0;
    onBeforeWrite((key) => {
      if (key === attemptsKey("j1") && ++writes === 2) resetCodes(data);
    });
    expect(await checkPlayer(store, "j1", "1234")).toEqual({
      ok: false,
      error: "personal-code-reset",
    });
  });

  it("clears the tries on an entry by the welcome only, never on a reload", async () => {
    const { store, data } = await withSylent();
    for (let failure = 1; failure < MAX_FAILURES; failure++) {
      await checkPlayer(store, "j1", "0000");
    }
    expect(await checkPlayer(store, "j1", "1234")).toMatchObject({ ok: true });
    expect(failuresIn(data)).toBe(MAX_FAILURES - 1);
    expect(await enterPlayer(store, "sylent", "1234", NOW)).toMatchObject({
      ok: true,
    });
    expect(failuresIn(data)).toBe(0);
  });

  it("never locks a friend for good with tries whose call crashed", async () => {
    const { store, data, write } = await withSylent();
    const setJSON = store.setJSON;
    // Every try is written, then its call crashes before settling it.
    store.setJSON = async (key, value, condition) => {
      if (key === attemptsKey("j1") && attemptsIn(data).pending.length > 0) {
        throw new Error("Blobs is down");
      }
      return setJSON(key, value, condition);
    };
    const start = Date.now();
    await expect(
      checkPlayer(store, "j1", "1234", { now: start }),
    ).rejects.toThrow("Blobs is down");
    store.setJSON = setJSON;
    for (let index = 0; index < MAX_FAILURES - 1; index++) {
      write(attemptsKey("j1"), {
        failures: 0,
        pending: [...attemptsIn(data).pending, { id: `x${index}`, at: start }],
      });
    }
    expect(await checkPlayer(store, "j1", "1234", { now: start })).toEqual({
      ok: false,
      error: "player-busy",
    });
    expect(
      await checkPlayer(store, "j1", "1234", { now: start + PENDING_MS }),
    ).toMatchObject({ ok: true });
    expect(attemptsIn(data)).toEqual({ failures: 0, pending: [] });
  });

  it("answers busy, not locked, when the friend's other calls hold the last tries", async () => {
    const { store, write } = await withSylent();
    const now = Date.now();
    write(attemptsKey("j1"), {
      failures: MAX_FAILURES - 1,
      pending: [{ id: "other-call", at: now }],
    });
    expect(await checkPlayer(store, "j1", "1234", { now })).toEqual({
      ok: false,
      error: "player-busy",
    });
    write(attemptsKey("j1"), failing(MAX_FAILURES - 1));
    expect(await checkPlayer(store, "j1", "1234", { now })).toMatchObject({
      ok: true,
    });
  });

  it("sends a player whose code was reset back to the welcome", async () => {
    const { store, data } = await withSylent();
    resetCodes(data);
    expect(await checkPlayer(store, "j1", "1234")).toEqual({
      ok: false,
      error: "personal-code-reset",
    });
  });
});
