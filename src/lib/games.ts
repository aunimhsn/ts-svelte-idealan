// What the cards show of the games of the bag (specs.md, The bag): the order, the tags, the vote
// of the friend.
import fr from "../i18n/fr.json";
import { scoreOf, type BagGame, type Vote } from "./bag";

// The games by score, the highest first; at the same score, the oldest first, so that the order
// doesn't change from one reload to the next.
export const byScore = (games: BagGame[]) =>
  [...games].sort(
    (a, b) =>
      scoreOf(b) - scoreOf(a) ||
      a.addedAt.localeCompare(b.addedAt) ||
      a.appid - b.appid,
  );

// The kinds of game that matter at a LAN, by the id of their category on Steam, in the order of
// the cards: Steam names them at length (« Coop. en réseau local »), the cards in short.
const KINDS = [
  [9, "coop"],
  [48, "lanCoop"],
  [49, "pvp"],
  [47, "lanPvp"],
  [24, "splitScreen"],
] as const;

// The tags of a game, offered as filters: its kinds, then its genres as Steam names them.
export const tagsOf = (game: Pick<BagGame, "categories" | "genres">) => [
  ...KINDS.filter(([id]) =>
    game.categories.some((category) => category.id === id),
  ).map(([, kind]) => fr.kinds[kind]),
  ...game.genres,
];

// The vote of the friend on a game: `own` for a game they added.
export const voteOf = (game: BagGame, playerId: string) =>
  game.addedBy === playerId ? "own" : (game.votes[playerId] ?? null);

// A score with its sign: « +6 », « 0 ».
export const signed = (score: number) => (score > 0 ? `+${score}` : "0");

// The vote a tap on the arrow sends: a second tap withdraws the vote (specs.md, The bag).
export const nextVote = (current: Vote | null): Vote | null =>
  current === null ? "up" : null;

// Who voted for a game, by nickname, in the order of the votes; a player who left the bag shows
// as a former player.
export const votersOf = (
  game: Pick<BagGame, "votes">,
  nicknames: ReadonlyMap<string, string>,
) =>
  Object.keys(game.votes).map(
    (id) => nicknames.get(id) ?? fr.card.formerPlayer,
  );

// The games in the order given, the games not in it after them by score: after the friend's own
// vote, the cards stay where they are until the bag is read again, so that a card never moves
// under their finger.
export const inOrder = (games: BagGame[], order: readonly number[]) => {
  const rank = new Map(order.map((appid, index) => [appid, index]));
  const known = games
    .filter((game) => rank.has(game.appid))
    .sort((a, b) => (rank.get(a.appid) ?? 0) - (rank.get(b.appid) ?? 0));
  return [...known, ...byScore(games.filter((game) => !rank.has(game.appid)))];
};
