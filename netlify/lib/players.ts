// The players of the bag, kept in the `players` key (specs.md, Stored data): their nickname and
// their personal code, hashed with a salt of their own, never readable. 5 wrong personal codes in a
// row lock the nickname until the admin resets its code (decided by the owner on 2026-11-01): 4
// digits are 10,000 codes, which a script would otherwise try in minutes.
//
// The wrong codes are counted in a key per player, `attempts/<id>`, and each try is counted
// before its code is checked: a burst of parallel calls sees the count rise and can't check more
// than 5 codes (the review of step 6a). A right code then withdraws its own try; only an entry by
// the welcome clears the count, so that the reloads of the bag never make room for more tries.
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type { PlayerView } from "../../src/lib/bag";
import { isPersonalCode, sameNickname } from "../../src/lib/field-rules";
import { isRecord } from "./is-record";
import { updateJSON, type JsonStore } from "./store";

export const PLAYERS_KEY = "players";

export const attemptsKey = (id: string) => `attempts/${id}`;

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
  createdAt: string;
}

export interface Players {
  // The number of the next id, never reused, even after a player is deleted.
  nextId: number;
  list: Player[];
}

const PLAYER_ID_PATTERN = /^j[1-9]\d{0,5}$/;

export const isPlayerId = (value: unknown): value is string =>
  typeof value === "string" && PLAYER_ID_PATTERN.test(value);

const isPlayer = (value: unknown): value is Player =>
  isRecord(value) &&
  isPlayerId(value.id) &&
  typeof value.nickname === "string" &&
  (value.codeHash === null || typeof value.codeHash === "string") &&
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

// The tries counted for a player: none when the key doesn't exist. A shape this code didn't
// write fails loudly rather than unlocking the nickname.
export const readFailures = (value: unknown): number => {
  if (value === null) return 0;
  if (
    isRecord(value) &&
    Number.isSafeInteger(value.failures) &&
    (value.failures as number) >= 0
  ) {
    return value.failures as number;
  }
  throw new Error("An attempts key has an unexpected shape.");
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

const findPlayer = (players: Players, id: string) =>
  players.list.find((player) => player.id === id);

// The player of `id` as `players` holds them, or why they can't act before any code is checked.
const playerOf = (
  players: Players,
  id: string,
): Player | "unknown-player" | "personal-code-reset" => {
  const player = isPlayerId(id) ? findPlayer(players, id) : undefined;
  if (player === undefined) return "unknown-player";
  return player.codeHash === null ? "personal-code-reset" : player;
};

// Counts a try before its code is checked: the new count, or null when the nickname is locked.
const reserveTry = (store: JsonStore, id: string) =>
  updateJSON<number | null>(store, attemptsKey(id), (current) => {
    const failures = readFailures(current);
    return failures >= MAX_FAILURES
      ? { result: null }
      : { write: { failures: failures + 1 }, result: failures + 1 };
  });

// After a right code: withdraws the try it counted, or clears every try after an entry by the
// welcome. The tries of other calls, counted meanwhile, stay.
const releaseTry = (store: JsonStore, id: string, clear: boolean) =>
  updateJSON(store, attemptsKey(id), (current) => {
    const failures = readFailures(current);
    return {
      write: { failures: clear ? 0 : Math.max(0, failures - 1) },
      result: null,
    };
  });

// Checks the personal code of the player of `id`, as every function of the bag does first, and
// `enter` with `clear` to clear the tries. A locked nickname is refused even with the right code,
// so that the tries can't go on.
export const checkPlayer = async (
  store: JsonStore,
  id: string,
  code: string,
  { clear = false } = {},
): Promise<PlayerCheck> => {
  const player = playerOf(readPlayers(await store.getJSON(PLAYERS_KEY)), id);
  if (typeof player === "string") return { ok: false, error: player };
  // A code that isn't 4 digits can't be right: refused before any try is counted or hashed.
  if (!isPersonalCode(code)) return { ok: false, error: "wrong-personal-code" };
  const failures = await reserveTry(store, player.id);
  if (failures === null) return { ok: false, error: "player-locked" };
  if (!(await personalCodeMatches(code, player.codeHash as string))) {
    return {
      ok: false,
      error: failures >= MAX_FAILURES ? "player-locked" : "wrong-personal-code",
    };
  }
  await releaseTry(store, player.id, clear);
  // Read again: the admin may have reset the code or deleted the player since it was checked.
  const players = readPlayers(await store.getJSON(PLAYERS_KEY));
  const current = playerOf(players, id);
  if (typeof current === "string") return { ok: false, error: current };
  if (current.codeHash !== player.codeHash) {
    return { ok: false, error: "personal-code-reset" };
  }
  return { ok: true, player: current, players };
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
  const knownOf = (players: Players) =>
    players.list.find((player) => sameNickname(player.nickname, nickname));

  // A known nickname with its code: checked without hashing a new code for nothing.
  const known = knownOf(readPlayers(await store.getJSON(PLAYERS_KEY)));
  if (known !== undefined && known.codeHash !== null) {
    return checkPlayer(store, known.id, code, { clear: true });
  }

  // The hash is computed once, outside the retries: a salt of its own makes it valid for any.
  const newHash = await hashPersonalCode(code);
  const entered = await updateJSON<
    | { ok: true; player: Player; players: Players }
    | { ok: false; error: "too-many-players" }
    | { known: Player }
  >(store, PLAYERS_KEY, (current) => {
    const players = readPlayers(current);
    const known = knownOf(players);
    // Another friend took the nickname, or gave its code, meanwhile.
    if (known !== undefined && known.codeHash !== null) {
      return { result: { known } };
    }
    if (known !== undefined) {
      const updated = { ...known, codeHash: newHash };
      const next = {
        ...players,
        list: players.list.map((player) =>
          player.id === known.id ? updated : player,
        ),
      };
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
      createdAt: now.toISOString(),
    };
    const next = {
      nextId: players.nextId + 1,
      list: [...players.list, player],
    };
    return { write: next, result: { ok: true, player, players: next } };
  });
  if ("known" in entered) {
    return checkPlayer(store, entered.known.id, code, { clear: true });
  }
  // A new code starts without tries, whatever the former code left.
  if (entered.ok) await releaseTry(store, entered.player.id, true);
  return entered;
};
