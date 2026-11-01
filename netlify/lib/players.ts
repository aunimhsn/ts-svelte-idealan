// The players of the bag, kept in the `players` key (specs.md, Stored data): their nickname and
// their personal code, hashed with a salt of their own, never readable. 5 wrong personal codes in a
// row lock the nickname until the admin resets its code (decided by the owner on 2026-11-01): 4
// digits are 10,000 codes, which a script would otherwise try in minutes.
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type { PlayerView } from "../../src/lib/bag";
import { sameNickname } from "../../src/lib/field-rules";
import { updateJSON, type JsonStore } from "./store";

export const PLAYERS_KEY = "players";

// The wrong personal codes in a row that lock a nickname.
export const MAX_FAILURES = 5;

// The most players of a bag: a script can't fill `players` with nicknames.
export const MAX_PLAYER_COUNT = 50;

export interface Player {
  // A fixed id (« j1 »): the games and the votes point to it, so that renaming changes only this.
  id: string;
  // The nickname as typed, its first letter capitalized.
  nickname: string;
  // `scrypt:<salt>:<hash>` in hexadecimal, or null once the admin reset it: the friend then
  // chooses a new one at their next entry.
  codeHash: string | null;
  // The wrong personal codes given in a row.
  failures: number;
  createdAt: string;
}

export interface Players {
  // The number of the next id, never reused, even after a player is deleted.
  nextId: number;
  list: Player[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const PLAYER_ID_PATTERN = /^j[1-9]\d{0,5}$/;

export const isPlayerId = (value: unknown): value is string =>
  typeof value === "string" && PLAYER_ID_PATTERN.test(value);

const isPlayer = (value: unknown): value is Player =>
  isRecord(value) &&
  isPlayerId(value.id) &&
  typeof value.nickname === "string" &&
  (value.codeHash === null || typeof value.codeHash === "string") &&
  Number.isSafeInteger(value.failures) &&
  typeof value.createdAt === "string";

// The players kept in Blobs, or none yet. A shape this code didn't write fails loudly rather
// than being overwritten with an empty list, which would lose every player.
export const readPlayers = (value: unknown): Players => {
  if (value === null) return { nextId: 1, list: [] };
  if (
    isRecord(value) &&
    Number.isSafeInteger(value.nextId) &&
    Array.isArray(value.list) &&
    value.list.every(isPlayer)
  ) {
    return { nextId: value.nextId as number, list: value.list };
  }
  throw new Error("The players key has an unexpected shape.");
};

export const viewOfPlayer = ({ id, nickname }: Player): PlayerView => ({
  id,
  nickname,
});

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  length: number,
) => Promise<Buffer>;

const HASH_LENGTH = 32;

export const hashPersonalCode = async (code: string): Promise<string> => {
  const salt = randomBytes(16);
  const hash = await scryptAsync(code, salt, HASH_LENGTH);
  return `scrypt:${salt.toString("hex")}:${hash.toString("hex")}`;
};

export const personalCodeMatches = async (
  code: string,
  codeHash: string,
): Promise<boolean> => {
  const [scheme, saltHex, hashHex] = codeHash.split(":");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const given = await scryptAsync(
    code,
    Buffer.from(saltHex, "hex"),
    expected.length,
  );
  return given.length === expected.length && timingSafeEqual(given, expected);
};

// Why a player can't act: their id is unknown (the admin deleted them), their personal code was
// reset, their nickname is locked, or the code given is wrong. The interface sends them back to
// the welcome.
export type PlayerRefusal =
  | "unknown-player"
  | "personal-code-reset"
  | "player-locked"
  | "wrong-personal-code";

export type PlayerCheck =
  | { ok: true; player: Player; players: Players }
  | { ok: false; error: PlayerRefusal };

// Counts a wrong personal code, or clears the count after a right one; answers the refusal,
// if any, as the players stand after the write.
const recordAttempt = (
  store: JsonStore,
  id: string,
  right: boolean,
): Promise<PlayerCheck> =>
  updateJSON<PlayerCheck>(store, PLAYERS_KEY, (current) => {
    const players = readPlayers(current);
    const player = players.list.find((candidate) => candidate.id === id);
    if (player === undefined) {
      return { result: { ok: false, error: "unknown-player" } };
    }
    if (right) {
      const updated = { ...player, failures: 0 };
      const next = replacePlayer(players, updated);
      return {
        write: next,
        result: { ok: true, player: updated, players: next },
      };
    }
    const updated = { ...player, failures: player.failures + 1 };
    return {
      write: replacePlayer(players, updated),
      result: {
        ok: false,
        error:
          updated.failures >= MAX_FAILURES
            ? "player-locked"
            : "wrong-personal-code",
      },
    };
  });

const replacePlayer = (players: Players, updated: Player): Players => ({
  ...players,
  list: players.list.map((player) =>
    player.id === updated.id ? updated : player,
  ),
});

// Checks the personal code of the player of `id`, as every function of the bag does first. A
// locked nickname is refused even with the right code, so that the tries can't go on.
export const checkPlayer = async (
  store: JsonStore,
  id: string,
  code: string,
): Promise<PlayerCheck> => {
  const players = readPlayers(await store.getJSON(PLAYERS_KEY));
  const player = isPlayerId(id)
    ? players.list.find((candidate) => candidate.id === id)
    : undefined;
  if (player === undefined) return { ok: false, error: "unknown-player" };
  if (player.codeHash === null) {
    return { ok: false, error: "personal-code-reset" };
  }
  if (player.failures >= MAX_FAILURES) {
    return { ok: false, error: "player-locked" };
  }
  const right = await personalCodeMatches(code, player.codeHash);
  // The right code with no failure before writes nothing: most calls only read.
  if (right && player.failures === 0) return { ok: true, player, players };
  return recordAttempt(store, id, right);
};

export type EnterResult =
  PlayerCheck | { ok: false; error: "too-many-players" };

// Enters with a nickname and a personal code, both already checked against their rules: a new
// nickname makes a new player with this code; a known one checks it; a nickname whose code the
// admin reset takes this code as its new one.
export const enterPlayer = async (
  store: JsonStore,
  nickname: string,
  code: string,
  now: Date,
): Promise<EnterResult> => {
  // The hash is computed once, outside the retries: a salt of its own makes it valid for any.
  const newHash = await hashPersonalCode(code);
  const entered = await updateJSON<EnterResult | { known: Player }>(
    store,
    PLAYERS_KEY,
    (current) => {
      const players = readPlayers(current);
      const known = players.list.find((player) =>
        sameNickname(player.nickname, nickname),
      );
      if (known !== undefined && known.codeHash !== null) {
        return { result: { known } };
      }
      if (known !== undefined) {
        const updated = { ...known, codeHash: newHash, failures: 0 };
        const next = replacePlayer(players, updated);
        return {
          write: next,
          result: { ok: true, player: updated, players: next },
        };
      }
      if (players.list.length >= MAX_PLAYER_COUNT) {
        return { result: { ok: false, error: "too-many-players" } };
      }
      const player: Player = {
        id: `j${players.nextId}`,
        nickname,
        codeHash: newHash,
        failures: 0,
        createdAt: now.toISOString(),
      };
      const next = {
        nextId: players.nextId + 1,
        list: [...players.list, player],
      };
      return { write: next, result: { ok: true, player, players: next } };
    },
  );
  return "known" in entered
    ? checkPlayer(store, entered.known.id, code)
    : entered;
};
