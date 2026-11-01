// The state of the application, shared by its screens: who the friend is, the bag as last read,
// and the messages to show. The rules the lock of the nicknames depends on (roadmap.md, 6b):
// - any refusal of the player sends the friend back to the welcome and forgets the personal code
//   kept, so that an old device never tries it again after a reset; the reload stops with it;
// - a kept session resumes with `get-bag`, never with `enter`, which would clear the failures;
// - one call at a time, and `player-busy` tried again after its `retry-after` (src/lib/api.ts).
import { PLAYER_REFUSALS, type Api, type ApiResult } from "./api";
import type { BagGame, BagView, PlayerAccount, Vote } from "./bag";
import { byScore, inOrder, nextVote } from "./games";
import { readMaxPlayers, readNickname } from "./field-rules";
import { isNotice, welcomeErrorOf, type Notice } from "./messages";
import type { WelcomeError } from "./messages";
import {
  readKept,
  sameSession,
  sessionOf,
  writeKept,
  type Kept,
  type KeptStorage,
} from "./session";
import { readSteamLink } from "./steam-link";
import { checkWelcome, type WelcomeForm } from "./welcome-form";

// The bag reloads every 30 seconds while the tab is shown (specs.md, The bag).
export const RELOAD_MS = 30_000;

// The field of the adding at fault for an error, given a red border.
export type AddFault = "link" | "maxPlayers";

const FAULT_OF_ERROR: Record<string, AddFault> = {
  "not-a-steam-link": "link",
  "steam-package": "link",
  "not-a-game": "link",
  "already-in-bag": "link",
  "invalid-max-players": "maxPlayers",
};

// The errors that say the server didn't answer: the next read that succeeds clears them.
const SERVER_ERRORS = new Set(["server-unreachable", "server-error"]);

type Outcome = { ok: true } | { ok: false; error: string | null };

// An error of the settings, under the line of its player (`id`), or under the note of the panel
// when the players couldn't be read (null). `nickname`: the one typed, for « … existe déjà ».
export interface SettingsError {
  id: string | null;
  code: string;
  nickname?: string;
}

// A vote sent and not answered yet, shown at once on the card.
interface PendingVote {
  id: number;
  appid: number;
  vote: Vote | null;
}

// The bag with the votes not answered yet, in the order they were sent.
const withVotes = (view: BagView, votes: PendingVote[]): BagView => {
  if (votes.length === 0) return view;
  const me = view.me.id;
  const games = view.games.map((game): BagGame => {
    const mine = votes.filter((pending) => pending.appid === game.appid);
    const last = mine[mine.length - 1];
    if (last === undefined || game.addedBy === me) return game;
    const next = { ...game.votes };
    const { vote } = last;
    if (vote === null) delete next[me];
    else next[me] = vote;
    return { ...game, votes: next };
  });
  return { ...view, games };
};

export class AppState {
  kept = $state<Kept>({});
  // The bag as last read, or null before the first read.
  #read = $state<BagView | null>(null);
  #votes = $state<PendingVote[]>([]);
  // The bag shown: as last read, with the friend's votes not answered yet.
  view = $derived(this.#read && withVotes(this.#read, this.#votes));
  // The order of the cards, by appid: by score when the bag is read, kept after a vote.
  #order = $state<number[]>([]);
  games = $derived(this.view ? inOrder(this.view.games, this.#order) : []);
  // When the bag shown was read, in milliseconds since 1970.
  loadedAt = $state<number | null>(null);
  // Why the friend is back on the welcome, shown in its banner.
  notice = $state<Notice | null>(null);
  // The error code shown in the strip of the errors of the bag.
  toast = $state<string | null>(null);
  fault = $state<AddFault | null>(null);
  loading = $state(false);
  adding = $state(false);
  // The appid of the game being removed, or null.
  removing = $state<number | null>(null);
  // The settings of the admin: the accounts as last read, the error to show, and the player
  // being changed ("" while the players are read).
  accounts = $state<PlayerAccount[] | null>(null);
  settingsError = $state<SettingsError | null>(null);
  settingsBusy = $state<string | null>(null);
  session = $derived(sessionOf(this.kept));

  #api: Api;
  #storage: KeptStorage | null;
  // Raised each time the friend leaves the bag: an answer to a call asked before is ignored.
  #epoch = 0;
  // A reload that failed already showed it: the next ones don't show it again.
  #reloadFailed = false;
  #voteId = 0;

  constructor(api: Api, storage: KeptStorage | null) {
    this.#api = api;
    this.#storage = storage;
    this.kept = readKept(storage);
    if (this.session !== null) void this.refresh();
  }

  // The credentials as they are when a call is sent.
  #credentials = () => {
    const session = sessionOf(this.kept);
    return (
      session && {
        accessCode: session.accessCode,
        playerId: session.playerId,
        personalCode: session.personalCode,
      }
    );
  };

  #keep(kept: Kept) {
    const fields = Object.entries(kept).filter(
      ([, text]) => text !== undefined,
    );
    this.kept = Object.fromEntries(fields);
    writeKept(this.#storage, this.kept);
  }

  #show(view: BagView, keepOrder = false) {
    this.#read = view;
    if (!keepOrder) this.#order = byScore(view.games).map((game) => game.appid);
    this.loadedAt = Date.now();
    if (view.accounts !== undefined) this.accounts = view.accounts;
    // The admin may have renamed the friend.
    if (this.kept.nickname !== view.me.nickname) {
      this.#keep({ ...this.kept, nickname: view.me.nickname });
    }
  }

  // Leaves the bag shown: the answers to the calls asked before are ignored.
  #reset(notice: Notice | null) {
    this.#epoch += 1;
    this.#read = null;
    this.#votes = [];
    this.#order = [];
    this.loadedAt = null;
    this.toast = null;
    this.fault = null;
    this.loading = false;
    this.adding = false;
    this.removing = null;
    this.accounts = null;
    this.settingsError = null;
    this.settingsBusy = null;
    this.notice = notice;
    this.#reloadFailed = false;
  }

  // Back to the welcome: the personal code is forgotten, the access code too when it changed.
  // If another tab entered meanwhile with other credentials, its session is taken instead of
  // being written over.
  #leave(notice: Notice, keep: Kept) {
    const stored = readKept(this.#storage);
    const storedSession = sessionOf(stored);
    if (storedSession !== null && !sameSession(storedSession, this.session)) {
      this.#reset(null);
      this.kept = stored;
      void this.refresh();
      return;
    }
    this.#reset(notice);
    this.#keep(keep);
  }

  // Another tab of the browser changed what is kept (« Se déconnecter », a new entry, a refusal):
  // this tab follows, so that it never sends a personal code the other one forgot.
  syncKept() {
    const stored = readKept(this.#storage);
    const changed = !sameSession(sessionOf(stored), this.session);
    if (changed) this.#reset(null);
    this.kept = stored;
    if (changed && this.session !== null) void this.refresh();
  }

  // What an answer of the bag leads to: the bag shown, the friend sent back to the welcome
  // (no error left to show), or an error to show.
  #settle(result: ApiResult, keepOrder = false): Outcome {
    if (result.ok) {
      this.#show(result.view, keepOrder);
      return { ok: true };
    }
    const { error } = result;
    if (error === "no-session") return { ok: false, error: null };
    if (PLAYER_REFUSALS.has(error) && isNotice(error)) {
      this.#leave(error, {
        accessCode: this.kept.accessCode,
        nickname: this.kept.nickname,
      });
      return { ok: false, error: null };
    }
    if (error === "wrong-access-code") {
      this.#leave("access-code-changed", { nickname: this.kept.nickname });
      return { ok: false, error: null };
    }
    return { ok: false, error };
  }

  #fail(error: string) {
    this.toast = error;
    this.fault = FAULT_OF_ERROR[error] ?? null;
  }

  // Enters with the fields of the welcome; answers the error to show under a field, or null.
  async enter(form: WelcomeForm): Promise<WelcomeError | null> {
    const invalid = checkWelcome(form);
    if (invalid !== null) return invalid;
    const accessCode = form.accessCode.trim();
    const nickname = readNickname(form.nickname) ?? form.nickname;
    const epoch = this.#epoch;
    const result = await this.#api.enter(
      accessCode,
      nickname,
      form.personalCode,
    );
    if (epoch !== this.#epoch) return null;
    if (!result.ok) return welcomeErrorOf(result.error);
    this.notice = null;
    this.toast = null;
    this.fault = null;
    this.#reloadFailed = false;
    this.#keep({
      accessCode,
      nickname: result.view.me.nickname,
      playerId: result.view.me.id,
      personalCode: form.personalCode,
    });
    this.#show(result.view);
    return null;
  }

  // Reads the bag again. A reload in the background is skipped while another call runs, and
  // shows only the first of the failures in a row.
  async refresh({ background = false } = {}) {
    if (this.session === null) return;
    if (background && this.#api.pending > 0) return;
    const epoch = this.#epoch;
    if (!background) this.loading = true;
    const result = await this.#api.getBag(this.#credentials);
    if (epoch !== this.#epoch) return;
    if (!background) this.loading = false;
    const outcome = this.#settle(result);
    if (outcome.ok) {
      this.#reloadFailed = false;
      if (this.toast !== null && SERVER_ERRORS.has(this.toast)) {
        this.toast = null;
      }
      return;
    }
    if (outcome.error === null) return;
    if (background) {
      if (this.#reloadFailed) return;
      this.#reloadFailed = true;
    }
    this.#fail(outcome.error);
  }

  // Whether the bag shown is older than one reload.
  isStale(now = Date.now()) {
    return this.loadedAt === null || now - this.loadedAt >= RELOAD_MS;
  }

  // Adds a game from the fields of the adding; answers whether it was added, so that the fields
  // are emptied.
  async addGame(link: string, maxPlayers: string) {
    if (this.adding) return false;
    const steamLink = readSteamLink(link);
    if (!steamLink.ok) {
      this.#fail(steamLink.error);
      return false;
    }
    const players = readMaxPlayers(maxPlayers);
    if (players === "invalid") {
      this.#fail("invalid-max-players");
      return false;
    }
    this.closeToast();
    this.adding = true;
    const epoch = this.#epoch;
    const result = await this.#api.addGame(
      this.#credentials,
      link.trim(),
      players,
    );
    if (epoch !== this.#epoch) return false;
    this.adding = false;
    const outcome = this.#settle(result);
    if (outcome.ok) return true;
    if (outcome.error !== null) this.#fail(outcome.error);
    return false;
  }

  // Taps an arrow of a game: votes, changes the vote or withdraws it. The card shows it at once
  // and stays where it is; if the server refuses, the vote shown goes back to what it was.
  async vote(appid: number, tapped: Vote) {
    const view = this.view;
    const game = view?.games.find((candidate) => candidate.appid === appid);
    if (!view || !game || game.addedBy === view.me.id) return;
    const pending: PendingVote = {
      id: (this.#voteId += 1),
      appid,
      vote: nextVote(game.votes[view.me.id] ?? null, tapped),
    };
    this.#votes = [...this.#votes, pending];
    const epoch = this.#epoch;
    const result = await this.#api.vote(this.#credentials, appid, pending.vote);
    if (epoch !== this.#epoch) return;
    // The answer is shown in the same change, so that the score never flickers.
    this.#votes = this.#votes.filter(({ id }) => id !== pending.id);
    const outcome = this.#settle(result, true);
    if (outcome.ok || outcome.error === null) return;
    this.#fail(outcome.error);
    if (outcome.error === "game-not-found") void this.refresh();
  }

  // Removes a game, once confirmed; a game already gone is simply no longer shown. Answers
  // whether the game left the bag. The interface locks « Retirer » while a removal runs.
  async removeGame(appid: number) {
    if (this.removing !== null) return false;
    this.removing = appid;
    const epoch = this.#epoch;
    const result = await this.#api.removeGame(this.#credentials, appid);
    if (epoch !== this.#epoch) return false;
    this.removing = null;
    const outcome = this.#settle(result);
    if (outcome.ok) return true;
    if (outcome.error === "game-not-found") {
      void this.refresh();
      return true;
    }
    if (outcome.error !== null) this.#fail(outcome.error);
    return false;
  }

  // Runs a call of the settings for the player of `id` ("" for reading them all), one at a time;
  // its error shows under the line of the player. Answers whether it succeeded.
  async #settings(
    id: string,
    call: () => Promise<ApiResult>,
    nickname?: string,
  ) {
    if (this.settingsBusy !== null) return false;
    this.settingsBusy = id;
    this.settingsError = null;
    const epoch = this.#epoch;
    const result = await call();
    if (epoch !== this.#epoch) return false;
    this.settingsBusy = null;
    const outcome = this.#settle(result);
    if (outcome.ok) return true;
    // The player was deleted meanwhile: the players are read again, and their line goes.
    if (outcome.error === "player-not-found" && id !== "") {
      void this.openSettings();
      return false;
    }
    if (outcome.error !== null) {
      this.settingsError = {
        id: id === "" ? null : id,
        code: outcome.error,
        nickname,
      };
    }
    return false;
  }

  // Opens the settings: reads the players and the state of their accounts.
  openSettings() {
    return this.#settings("", () => this.#api.getSettings(this.#credentials));
  }

  closeSettings() {
    this.settingsError = null;
  }

  // Renames a player, the nickname checked first with the rules of the welcome.
  renamePlayer(id: string, text: string) {
    const nickname = readNickname(text);
    if (nickname === null) {
      this.settingsError = { id, code: "invalid-nickname" };
      return Promise.resolve(false);
    }
    return this.#settings(
      id,
      () => this.#api.renamePlayer(this.#credentials, id, nickname),
      nickname,
    );
  }

  resetPlayerCode(id: string) {
    return this.#settings(id, () =>
      this.#api.resetPlayerCode(this.#credentials, id),
    );
  }

  // Deletes a player, once confirmed.
  deletePlayer(id: string) {
    return this.#settings(id, () =>
      this.#api.deletePlayer(this.#credentials, id),
    );
  }

  closeToast() {
    this.toast = null;
    this.fault = null;
  }

  // « Se déconnecter »: forgets the friend in this browser.
  logout() {
    this.#reset(null);
    this.#keep({});
  }
}
