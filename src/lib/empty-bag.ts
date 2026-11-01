// What the emptying of the bag shows (specs.md, Emptying the bag): the games to remove, the
// counts of its bar and the text of its confirmation. In French, 0 and 1 take the singular.
import fr from "../i18n/fr.json";
import type { BagGame } from "./bag";
import { format } from "./messages";

const one = (count: number) => count <= 1;

// The appids of the games not kept, in the order shown: what the function receives.
export const toRemove = (games: BagGame[], kept: ReadonlySet<number>) =>
  games.filter((game) => !kept.has(game.appid)).map((game) => game.appid);

// « gardés », « retiré »: after a count in bold.
export const keptWord = (count: number) =>
  one(count) ? fr.empty.keptOne : fr.empty.kept;

export const removedWord = (count: number) =>
  one(count) ? fr.empty.removedOne : fr.empty.removed;

// « Vider (38 jeux) », « Vider (1 jeu) »
export const emptyAction = (count: number) =>
  format(one(count) ? fr.empty.actionOne : fr.empty.action, { count });

// « 38 jeux seront retirés. Cette action est définitive. »
export const emptyText = (count: number) =>
  count === 1
    ? fr.confirm.emptyTextOne
    : format(fr.confirm.emptyText, { count });
