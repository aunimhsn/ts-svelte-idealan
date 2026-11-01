// The shape of the bag as the functions keep it and answer it (specs.md, Stored data), shared by
// the interface and the functions so that both read the same fields.

// The most games the bag holds (specs.md, Error handling).
export const MAX_GAMES = 50;

export type Vote = "up" | "down";

export type Role = "member" | "admin";

export interface GameCategory {
  id: number;
  name: string;
}

export interface BagGame {
  // The appid given by Steam, the id of the game in the bag.
  appid: number;
  name: string;
  // The address of the cover on the Steam CDN, or null when Steam gives none.
  cover: string | null;
  categories: GameCategory[];
  genres: string[];
  // The maximum number of players given by the friend who added the game, or null.
  maxPlayers: number | null;
  // The id of the player who added the game (« j1 »).
  addedBy: string;
  // The date of adding, in ISO 8601.
  addedAt: string;
  // The vote of each player, by their id; who added the game counts as an upvote.
  votes: Record<string, Vote>;
}

// A player as the bag shows them: never their personal code, even hashed.
export interface PlayerView {
  id: string;
  nickname: string;
}

// What every function of the bag answers: the bag, its players, and who asks.
export interface BagView {
  role: Role;
  me: PlayerView;
  players: PlayerView[];
  games: BagGame[];
}

// The score of a game: its upvotes minus its downvotes.
export const scoreOf = (game: Pick<BagGame, "votes">) =>
  Object.values(game.votes).reduce(
    (score, vote) => score + (vote === "up" ? 1 : -1),
    0,
  );
