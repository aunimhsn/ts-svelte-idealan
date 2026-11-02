// The filters of the bag (specs.md, The bag): « Jouable à N », then the tags of the cards. Every
// filter is off when the bag shows, and after a reload of the page: they live only in the screen.
import fr from "../i18n/fr.json";
import type { BagGame } from "./bag";
import { MAX_PLAYERS, MIN_PLAYERS } from "./field-rules";
import { tagsOf } from "./games";
import { format } from "./messages";

export interface Filters {
  // The tags a game must all have, as the cards name them (« Coop en LAN », « Action »).
  tags: readonly string[];
  // « Jouable à N »: N when the filter is on, null when it is off.
  players: number | null;
}

export const NO_FILTERS: Filters = { tags: [], players: null };

type Tagged = Pick<BagGame, "categories" | "genres">;

// The tags offered as filters: only those of at least one game of the bag, so that no filter
// alone leads to an empty bag. The kinds of a LAN first, in the order of the cards, then the
// genres, the most frequent first, then by name.
export const tagChoices = (games: readonly Tagged[]) => {
  const kinds = tagsOf({
    categories: games.flatMap((game) => game.categories),
    genres: [],
  });
  const genres = new Map<string, number>();
  for (const game of games) {
    for (const genre of new Set(game.genres)) {
      genres.set(genre, (genres.get(genre) ?? 0) + 1);
    }
  }
  const byFrequency = [...genres].sort(
    ([a, countA], [b, countB]) => countB - countA || a.localeCompare(b, "fr"),
  );
  return [...kinds, ...byFrequency.map(([genre]) => genre)];
};

// Whether a game passes the filters: it has every tag pressed, and its maximum number of players
// is at least N; a game without a number stays, since nobody knows.
export const passes = (
  game: Pick<BagGame, "categories" | "genres" | "maxPlayers">,
  filters: Filters,
) => {
  const { players } = filters;
  if (
    players !== null &&
    game.maxPlayers !== null &&
    game.maxPlayers < players
  ) {
    return false;
  }
  if (filters.tags.length === 0) return true;
  const tags = new Set(tagsOf(game));
  return filters.tags.every((tag) => tags.has(tag));
};

// Whether any filter is on.
export const isFiltering = (filters: Filters) =>
  filters.players !== null || filters.tags.length > 0;

// N kept between 1 and 25, as « Joueurs max ».
export const clampPlayers = (count: number) =>
  Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, count));

// N of « Jouable à N »: as the friend chose it with − and +, else the number of players of the
// bag, which it follows until the friend changes it.
export const playersOf = (chosen: number | null, bagPlayers: number) =>
  chosen ?? clampPlayers(bagPlayers);

// « jeu » for 0 and 1 (French keeps the singular), « jeux » from 2.
export const gamesWord = (count: number) =>
  count > 1 ? fr.bag.games : fr.bag.gamesOne;

// What follows the number of games of the bag when no filter is on: its free places, out of
// `max`, or « sac plein ».
export const freeOf = (total: number, max: number) => {
  const free = max - total;
  return free > 1
    ? format(fr.bag.free, { count: free })
    : free === 1
      ? fr.bag.freeOne
      : fr.bag.full;
};
