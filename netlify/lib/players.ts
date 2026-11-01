// The players of the bag, kept in the `players` key (specs.md, Stored data): their nickname and
// their personal code, hashed with a salt of their own, never readable. 5 wrong personal codes in a
// row lock the nickname until the admin resets its code (decided by the owner on 2026-11-01): 4
// digits are 10,000 codes, which a script would otherwise try in minutes.
//
// The tries are kept in a key per player, `attempts/<id>` (the reviews of step 6a). Each try is
// first written as pending, before its code is checked: a burst of parallel calls sees the
// pending tries and can't check more than 5 codes. A wrong code then becomes a failure; a right
// one removes its pending try. A pending try that is never settled (the call crashed) expires
// after 2 minutes, so that it never locks a friend for good. Only an entry by the welcome clears
// the failures, so that the reloads of the bag never make room for more tries.
import { randomBytes, randomUUID, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type { PlayerView } from "../../src/lib/bag";
import { isPersonalCode, sameNickname } from "../../src/lib/field-rules";
import { isRecord } from "./is-record";
import { updateJSON, type JsonStore } from "./store";

export const PLAYERS_KEY = "players";

export const attemptsKey = (id: string) => `attempts/${id}`;

// The wrong personal codes in a row that lock a nickname.
export const MAX_FAILURES = 5;

// How long a pending try counts: far longer than a call, which Netlify stops after 60 seconds.
export const PENDING_MS = 2 * 60 * 1000;

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

// A try written before its code is checked: its id and when it started, in milliseconds.
export interface PendingTry {
  id: string;
  at: number;
}

export interface Attempts {
  // The wrong personal codes given in a row.
  failures: number;
  pending: PendingTry[];
}

const isPendingTry = (value: unknown): value is PendingTry =>
  isRecord(value) &&
  typeof value.id === "string" &&
  Number.isSafeInteger(value.at);

// The tries of a player: none when the key doesn't exist. A shape this code didn't write fails
// loudly rather than unlocking the nickname.
export const readAttempts = (value: unknown): Attempts => {
  if (value === null) return { failures: 0, pending: [] };
  if (
    isRecord(value) &&
    Number.isSafeInteger(value.failures) &&
    (value.failures as number) >= 0 &&
    Array.isArray(value.pending) &&
    value.pending.every(isPendingTry)
  ) {
    return { failures: value.failures as number, pending: value.pending };
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

// What hashPersonalCode writes, exactly: a malformed hash would give an empty expected hash,
// which an empty given hash would match.
const CODE_HASH_PATTERN = /^scrypt:[0-9a-f]{32}:[0-9a-f]{64}$/;

export const personalCodeMatches = async (
  code: string,
  codeHash: string,
): Promise<boolean> => {
  if (!CODE_HASH_PATTERN.test(codeHash)) return false;
  const [, saltHex = "", hashHex = ""] = codeHash.split(":");
  const expected = Buffer.from(hashHex, "hex");
  const given = await scryptAsync(
    code,
    Buffer.from(saltHex, "hex"),
    expected.length,
  );
  return given.length === expected.length && timingSafeEqual(given, expected);
};

// Why a player can't act: their id is unknown (the admin deleted them), their personal code was
// reset, their nickname is locked, or the code given is wrong: the interface sends them back to
// the welcome. `player-busy`: other calls of theirs are being checked and only a few failures
// are left; the interface tries again a moment later.
export type PlayerRefusal =
  | "unknown-player"
  | "personal-code-reset"
  | "player-locked"
  | "player-busy"
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

// Writes a pending try before its code is checked, dropping the expired ones: its id, or why
// the code can't be checked now.
const reserveTry = (store: JsonStore, id: string, now: number) =>
  updateJSON<string | "player-locked" | "player-busy">(
    store,
    attemptsKey(id),
    (current) => {
      const { failures, pending } = readAttempts(current);
      if (failures >= MAX_FAILURES) return { result: "player-locked" };
      const live = pending.filter((entry) => now - entry.at < PENDING_MS);
      if (failures + live.length >= MAX_FAILURES) {
        return { result: "player-busy" };
      }
      const entry = { id: randomUUID(), at: now };
      return {
        write: { failures, pending: [...live, entry] },
        result: entry.id,
      };
    },
  );

// Settles a pending try: a wrong code becomes a failure, and the new count is answered; a right
// one removes it, and clears the failures too after an entry by the welcome (`clear`).
const settleTry = (
  store: JsonStore,
  id: string,
  tryId: string,
  outcome: "wrong" | "right" | "clear",
) =>
  updateJSON<number>(store, attemptsKey(id), (current) => {
    const attempts = readAttempts(current);
    const pending = attempts.pending.filter((entry) => entry.id !== tryId);
    const failures =
      outcome === "wrong"
        ? attempts.failures + 1
        : outcome === "clear"
          ? 0
          : attempts.failures;
    return { write: { failures, pending }, result: failures };
  });

// Clears every try of a player: a new personal code starts without any.
const clearTries = (store: JsonStore, id: string) =>
  store.setJSON(attemptsKey(id), { failures: 0, pending: [] });

// Checks the personal code of the player of `id`, as every function of the bag does first, and
// `enter` with `clear` to clear the tries. A locked nickname is refused even with the right code,
// so that the tries can't go on.
export const checkPlayer = async (
  store: JsonStore,
  id: string,
  code: string,
  { clear = false, now = Date.now() } = {},
): Promise<PlayerCheck> => {
  const player = playerOf(readPlayers(await store.getJSON(PLAYERS_KEY)), id);
  if (typeof player === "string") return { ok: false, error: player };
  // A code that isn't 4 digits can't be right: refused before any try is counted or hashed.
  if (!isPersonalCode(code)) return { ok: false, error: "wrong-personal-code" };
  const tryId = await reserveTry(store, player.id, now);
  if (tryId === "player-locked" || tryId === "player-busy") {
    return { ok: false, error: tryId };
  }
  if (!(await personalCodeMatches(code, player.codeHash as string))) {
    const failures = await settleTry(store, player.id, tryId, "wrong");
    return {
      ok: false,
      error: failures >= MAX_FAILURES ? "player-locked" : "wrong-personal-code",
    };
  }
  await settleTry(store, player.id, tryId, clear ? "clear" : "right");
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
    return checkPlayer(store, known.id, code, {
      clear: true,
      now: now.getTime(),
    });
  }

  // A nickname whose code was reset starts without tries, cleared before its new code is
  // written: a failure between the two never leaves the new code locked.
  if (known !== undefined) await clearTries(store, known.id);

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
    return checkPlayer(store, entered.known.id, code, {
      clear: true,
      now: now.getTime(),
    });
  }
  return entered;
};
