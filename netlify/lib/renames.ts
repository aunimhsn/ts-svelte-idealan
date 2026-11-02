// The renames (specs.md, Settings): a friend renames themself 3 times at most; the admin renames
// anyone without counting it, and gives a friend their 3 back. Each rename goes into the journal
// of `players`, the newest first, the last 100. Kept apart from the Netlify wrapper of the
// functions, so that it moves with the data to another host.
import { MAX_RENAMES } from "../../src/lib/bag";
import { sameNickname } from "../../src/lib/field-rules";
import {
  PLAYERS_KEY,
  readPlayers,
  renamesOf,
  type Player,
  type Players,
} from "./players";
import type { SettingsRefusal } from "./settings";
import { updateJSON, type JsonStore } from "./store";

// The lines of the journal kept: about 10 KB.
export const MAX_JOURNAL = 100;

type Renamer = "admin" | "self";

const replaced = (players: Players, player: Player) =>
  players.list.map((candidate) =>
    candidate.id === player.id ? player : candidate,
  );

// Renames the player of `id`, by the admin or by themself, and logs it. The games and the votes
// point to their id, so only `players` changes. A nickname taken by another player is refused,
// without case; the same one in other capitals is a rename, and the same one exactly changes
// nothing. A friend whose 3 renames are used is refused, even if they renamed themself meanwhile
// on another device.
const rename = (
  store: JsonStore,
  id: string,
  nickname: string,
  by: Renamer,
  now: Date,
) =>
  updateJSON<SettingsRefusal | null>(store, PLAYERS_KEY, (current) => {
    const players = readPlayers(current);
    const player = players.list.find((candidate) => candidate.id === id);
    if (player === undefined) return { result: "player-not-found" };
    if (player.nickname === nickname) return { result: null };
    const used = renamesOf(player);
    if (by === "self" && used >= MAX_RENAMES) {
      return { result: "no-renames-left" };
    }
    const taken = players.list.some(
      (other) => other.id !== id && sameNickname(other.nickname, nickname),
    );
    if (taken) return { result: "nickname-taken" };
    const renames = by === "self" ? used + 1 : used;
    const entry = {
      id,
      from: player.nickname,
      to: nickname,
      at: now.toISOString(),
      used: by === "self" ? renames : null,
    };
    return {
      write: {
        ...players,
        list: replaced(players, { ...player, nickname, renames }),
        journal: [entry, ...players.journal].slice(0, MAX_JOURNAL),
      },
      result: null,
    };
  });

// The admin renames a player, themself included: not counted among the player's 3.
export const renamePlayer = (
  store: JsonStore,
  id: string,
  nickname: string,
  now = new Date(),
) => rename(store, id, nickname, "admin", now);

// A friend renames themself, one of their 3. Deleted meanwhile, they are sent back to the
// welcome, as by any other call.
export const renameSelf = async (
  store: JsonStore,
  id: string,
  nickname: string,
  now = new Date(),
) => {
  const refused = await rename(store, id, nickname, "self", now);
  return refused === "player-not-found" ? "unknown-player" : refused;
};

// The admin gives a friend their 3 renames back.
export const giveBackRenames = (store: JsonStore, id: string) =>
  updateJSON<SettingsRefusal | null>(store, PLAYERS_KEY, (current) => {
    const players = readPlayers(current);
    const player = players.list.find((candidate) => candidate.id === id);
    if (player === undefined) return { result: "player-not-found" };
    if (renamesOf(player) === 0) return { result: null };
    return {
      write: { ...players, list: replaced(players, { ...player, renames: 0 }) },
      result: null,
    };
  });
