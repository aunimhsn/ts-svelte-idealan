// What the settings show (specs.md, Settings): for the admin, one line per player with their
// counts, the state of their account and their renames, the journal of the renames and the texts
// of the deletion; for a friend, the renames they have left.
import fr from "../i18n/fr.json";
import {
  MAX_RENAMES,
  type BagGame,
  type BagView,
  type PlayerAccount,
  type RenameEntry,
} from "./bag";
import { format, formatTime } from "./messages";

export interface Counts {
  games: number;
  // The votes on the games of the others: the upvote on one's own game goes with the game.
  votes: number;
}

export const countsOf = (games: BagGame[], id: string): Counts => ({
  games: games.filter((game) => game.addedBy === id).length,
  votes: games.filter((game) => game.addedBy !== id && id in game.votes).length,
});

// The players of the bag as last read, each with the state of their account and their renames
// as last read by the settings: a player who entered since is shown `active` with no rename used,
// one deleted since is gone.
export const accountsOf = (
  view: BagView,
  accounts: PlayerAccount[] | null,
): PlayerAccount[] => {
  const known = new Map(accounts?.map((account) => [account.id, account]));
  return view.players.map((player) => ({
    ...player,
    state: known.get(player.id)?.state ?? "active",
    renames: known.get(player.id)?.renames ?? 0,
  }));
};

// The renames a friend has left: « 2 restants », « 1 restant », « plus de renommage ».
export const renamesLeftOf = (used: number) => Math.max(0, MAX_RENAMES - used);

export const renamesLeftText = (left: number) =>
  left === 0
    ? fr.me.noneLeft
    : left === 1
      ? fr.me.leftOne
      : format(fr.me.left, { count: left });

const dayOf = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

// When a rename was made, in the time of the browser: « aujourd’hui à 18 h 02 », « hier à
// 22 h 41 », « le 3/11 à 21 h 15 ».
export const formatWhen = (date: Date, now = new Date()) => {
  const time = formatTime(date);
  const days = Math.round((dayOf(now) - dayOf(date)) / 86_400_000);
  // A browser clock a little behind the server's, just after midnight, still says « aujourd’hui ».
  if (days <= 0) return format(fr.journal.today, { time });
  if (days === 1) return format(fr.journal.yesterday, { time });
  return format(fr.journal.day, {
    day: date.getDate(),
    month: date.getMonth() + 1,
    time,
  });
};

// « 2/3 » for a rename by the friend, « par toi, non compté » for one by the admin.
export const renameCountText = ({ used }: RenameEntry) =>
  used === null
    ? fr.journal.byAdmin
    : format(fr.journal.count, { used, max: MAX_RENAMES });

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
