// What the settings of the admin show (specs.md, Settings): one line per player with their
// counts and the state of their account, and the texts of the deletion and of the errors.
import fr from "../i18n/fr.json";
import type { AccountState, BagGame, BagView, PlayerAccount } from "./bag";
import { format } from "./messages";

export interface Counts {
  games: number;
  // The votes on the games of the others: the upvote on one's own game goes with the game.
  votes: number;
}

export const countsOf = (games: BagGame[], id: string): Counts => ({
  games: games.filter((game) => game.addedBy === id).length,
  votes: games.filter((game) => game.addedBy !== id && id in game.votes).length,
});

// The players of the bag as last read, each with the state of their account as last read by the
// settings: a player who entered since is shown `active`, one deleted since is gone.
export const accountsOf = (
  view: BagView,
  accounts: PlayerAccount[] | null,
): PlayerAccount[] => {
  const states = new Map<string, AccountState>(
    accounts?.map((account) => [account.id, account.state]),
  );
  return view.players.map((player) => ({
    ...player,
    state: states.get(player.id) ?? "active",
  }));
};

const capitalized = (text: string) =>
  text.charAt(0).toUpperCase() + text.slice(1);

// « Ses 3 jeux et ses 12 votes partent avec lui. », « Son vote part avec lui. »
export const deleteText = ({ games, votes }: Counts) => {
  const gamesText =
    games === 1
      ? fr.confirm.deleteGamesOne
      : format(fr.confirm.deleteGames, { count: games });
  const votesText =
    votes === 1
      ? fr.confirm.deleteVotesOne
      : format(fr.confirm.deleteVotes, { count: votes });
  if (games > 0 && votes > 0) {
    return capitalized(
      format(fr.confirm.deleteBoth, { games: gamesText, votes: votesText }),
    );
  }
  if (games === 0 && votes === 0) return fr.confirm.deleteNothing;
  const [what, count] = games > 0 ? [gamesText, games] : [votesText, votes];
  return capitalized(
    format(count === 1 ? fr.confirm.deleteOne : fr.confirm.deleteMany, {
      what,
    }),
  );
};

const has = <T extends object>(
  texts: T,
  code: string,
): code is keyof T & string => Object.hasOwn(texts, code);

// The message of an error of the settings, under the line of its player. `nickname` is the one
// the admin typed, for « … existe déjà ».
export const settingsMessage = (code: string, nickname = "") =>
  format(
    has(fr.settingsErrors, code)
      ? fr.settingsErrors[code]
      : fr.settingsErrors.unexpected,
    { nickname },
  );
