// The settings of the admin (specs.md, Settings): reset a personal code, delete a player (the
// renames are in renames.ts). The admin code only: a member is refused before anything is read.
// Each answers the bag with the accounts, where the admin sees which nickname is locked or waits
// for its new code and how many renames each friend used, and with the journal of the renames.
import type { AccountState, BagView, PlayerAccount } from "../../src/lib/bag";
import type { Environment } from "./access";
import { BAG_KEY, readBag, type Bag } from "./bag";
import { errorResponse, freshView, openSession, type Session } from "./http";
import {
  attemptsKey,
  isPlayerId,
  MAX_FAILURES,
  PLAYERS_KEY,
  readAttempts,
  readPlayers,
  renamesOf,
  type Player,
} from "./players";
import { updateJSON, type JsonStore } from "./store";

// Checks the method, the access code and the player, then that the player is the admin.
export const openAdminSession = async (
  request: Request,
  env: Environment,
  store: JsonStore,
  method: "GET" | "POST",
): Promise<
  { ok: true; session: Session } | { ok: false; response: Response }
> => {
  const opened = await openSession(request, env, store, method);
  if (!opened.ok) return opened;
  if (opened.session.role !== "admin") {
    return { ok: false, response: errorResponse("admin-only", 403) };
  }
  return opened;
};

const stateOf = async (
  store: JsonStore,
  player: Player,
): Promise<AccountState> => {
  if (player.codeHash === null) return "reset";
  const { failures } = readAttempts(
    await store.getJSON(attemptsKey(player.id)),
  );
  return failures >= MAX_FAILURES ? "locked" : "active";
};

// The bag as it stands, read again after a change (the admin may have renamed themself), with
// the accounts and the journal.
export const settingsView = async (
  store: JsonStore,
  session: Session,
): Promise<BagView> => {
  const { view, players } = await freshView(store, session);
  const accounts: PlayerAccount[] = await Promise.all(
    players.list.map(async (player) => ({
      id: player.id,
      nickname: player.nickname,
      state: await stateOf(store, player),
      renames: renamesOf(player),
    })),
  );
  return { ...view, accounts, journal: players.journal };
};

export type SettingsRefusal =
  | "player-not-found"
  | "nickname-taken"
  | "no-renames-left"
  | "cannot-reset-self"
  | "cannot-delete-self";

// Changes the player of `id` in `players`; null when they are not there.
const updatePlayer = (
  store: JsonStore,
  id: string,
  change: (player: Player) => Player | SettingsRefusal,
) =>
  updateJSON<SettingsRefusal | null>(store, PLAYERS_KEY, (current) => {
    const players = readPlayers(current);
    const player = players.list.find((candidate) => candidate.id === id);
    if (player === undefined) return { result: "player-not-found" };
    const changed = change(player);
    if (typeof changed === "string") return { result: changed };
    if (changed === player) return { result: null };
    return {
      write: {
        ...players,
        list: players.list.map((candidate) =>
          candidate.id === id ? changed : candidate,
        ),
      },
      result: null,
    };
  });

// Resets a personal code: the first one to enter with the nickname chooses the new one. The
// tries are removed after, so that the nickname is unlocked; a failure between the two leaves
// the code reset, which `enter` clears the tries of anyway. Never the admin's own: the first
// friend to enter as them would take their nickname, their games and their votes (the review of
// step 7a).
export const resetPlayerCode = async (
  store: JsonStore,
  id: string,
  adminId: string,
): Promise<SettingsRefusal | null> => {
  if (id === adminId) return "cannot-reset-self";
  const refused = await updatePlayer(store, id, (player) =>
    player.codeHash === null ? player : { ...player, codeHash: null },
  );
  if (refused !== null) return refused;
  await store.delete(attemptsKey(id));
  return null;
};

// The bag with only the games and the votes of the players of `known`.
const onlyPlayers = (bag: Bag, known: Set<string>): Bag => ({
  games: bag.games
    .filter((game) => known.has(game.addedBy))
    .map((game) => {
      const ids = Object.keys(game.votes);
      if (ids.every((id) => known.has(id))) return game;
      const votes = Object.fromEntries(
        Object.entries(game.votes).filter(([id]) => known.has(id)),
      );
      return { ...game, votes };
    }),
});

// Deletes a player, their games, their votes, their lines of the journal and their tries. The player goes first, so that
// their calls are refused from then on (the writes of the bag check it again: `isStillPlayer`);
// then the bag, then the tries. The bag keeps only the games and votes of the players still
// there, read again at each try: a player already gone is cleaned all the same, so that a
// deletion that failed halfway is done again by the next one.
export const deletePlayer = async (
  store: JsonStore,
  id: string,
  adminId: string,
): Promise<SettingsRefusal | null> => {
  if (id === adminId) return "cannot-delete-self";
  await updateJSON<null>(store, PLAYERS_KEY, (current) => {
    const players = readPlayers(current);
    const list = players.list.filter((player) => player.id !== id);
    const journal = players.journal.filter((entry) => entry.id !== id);
    return list.length === players.list.length &&
      journal.length === players.journal.length
      ? { result: null }
      : { write: { ...players, list, journal }, result: null };
  });
  await updateJSON<null>(store, BAG_KEY, async (current) => {
    const bag = readBag(current);
    const players = readPlayers(await store.getJSON(PLAYERS_KEY));
    const next = onlyPlayers(bag, new Set(players.list.map(({ id }) => id)));
    const changed =
      next.games.length !== bag.games.length ||
      next.games.some((game, index) => game !== bag.games[index]);
    return changed ? { write: next, result: null } : { result: null };
  });
  await store.delete(attemptsKey(id));
  return null;
};

export const STATUS_OF_SETTINGS_ERROR = {
  "player-not-found": 404,
  "nickname-taken": 409,
  "no-renames-left": 409,
  "cannot-reset-self": 409,
  "cannot-delete-self": 409,
} as const satisfies Record<SettingsRefusal, number>;

// The id of the player a body names, or null when it is missing or malformed.
export const playerIdOf = (body: Record<string, unknown> | null) =>
  body !== null && isPlayerId(body.id) ? body.id : null;
