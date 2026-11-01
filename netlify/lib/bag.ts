// The games of the bag, kept in the `bag` key (specs.md, Stored data), and the view of the bag
// that every function of the bag answers.
import type { BagGame, BagView, Role, Vote } from "../../src/lib/bag";
import { isPlayerId, viewOfPlayer, type Player, type Players } from "./players";

export const BAG_KEY = "bag";

export interface Bag {
  games: BagGame[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isVotes = (value: unknown): value is Record<string, Vote> =>
  isRecord(value) &&
  Object.entries(value).every(
    ([id, vote]) => isPlayerId(id) && (vote === "up" || vote === "down"),
  );

const isGame = (value: unknown): value is BagGame =>
  isRecord(value) &&
  Number.isSafeInteger(value.appid) &&
  typeof value.name === "string" &&
  (value.cover === null || typeof value.cover === "string") &&
  Array.isArray(value.categories) &&
  Array.isArray(value.genres) &&
  (value.maxPlayers === null || Number.isSafeInteger(value.maxPlayers)) &&
  isPlayerId(value.addedBy) &&
  typeof value.addedAt === "string" &&
  isVotes(value.votes);

// The bag kept in Blobs, or an empty one. A shape this code didn't write fails loudly rather than
// being overwritten with an empty bag, which would lose every game.
export const readBag = (value: unknown): Bag => {
  if (value === null) return { games: [] };
  if (isRecord(value) && Array.isArray(value.games)) {
    if (value.games.every(isGame)) return { games: value.games };
  }
  throw new Error("The bag key has an unexpected shape.");
};

export const viewOfBag = (
  bag: Bag,
  players: Players,
  me: Player,
  role: Role,
): BagView => ({
  role,
  me: viewOfPlayer(me),
  players: players.list.map(viewOfPlayer),
  games: bag.games,
});
