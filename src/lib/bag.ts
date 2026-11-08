// The shape of the bag as the functions keep it and answer it (specs.md, Stored data), shared by
// the interface and the functions so that both read the same fields.

// The most games the bag holds (specs.md, Error handling).
export const MAX_GAMES = 50;

// The renames of a friend, by themself (specs.md, Settings (friend panel)); the admin gives them
// back.
export const MAX_RENAMES = 3;

export type Vote = "up";

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

// Where a player stands, as the settings of the admin show it: `locked` after 5 wrong personal
// codes in a row, `reset` once the admin reset their code and until they choose a new one.
export type AccountState = "active" | "locked" | "reset";

export interface PlayerAccount extends PlayerView {
  state: AccountState;
  // The renames the player made themself, 0 to 3, until the admin gives them back.
  renames: number;
}

// A line of the journal of the renames, for the admin: who, from which nickname to which, when
// (ISO 8601), and the count of the friend once renamed (« 2/3 »), or null for a rename by the
// admin, which doesn't count.
export interface RenameEntry {
  id: string;
  from: string;
  to: string;
  at: string;
  used: number | null;
}

// What every function of the bag answers: the bag, its players, who asks and the renames they
// made themself. The functions of the settings answer the accounts and the journal of the renames
// too, for the admin only.
export interface BagView {
  role: Role;
  me: PlayerView;
  renames: number;
  players: PlayerView[];
  games: BagGame[];
  accounts?: PlayerAccount[];
  journal?: RenameEntry[];
}

// The score of a game: its upvotes.
export const scoreOf = (game: Pick<BagGame, "votes">) =>
  Object.keys(game.votes).length;
