// The state of the application, shared by its screens: who the friend is, the bag as last read,
// and the messages to show. The rules the lock of the nicknames depends on (roadmap.md, 6b):
// - any refusal of the player sends the friend back to the welcome and forgets the personal code
//   kept, so that an old device never tries it again after a reset; the reload stops with it;
// - a kept session resumes with `get-bag`, never with `enter`, which would clear the failures;
// - one call at a time, and `player-busy` tried again after its `retry-after` (src/lib/api.ts).
import { PLAYER_REFUSALS, type Api, type ApiResult } from "./api";
import type { BagView } from "./bag";
import { readMaxPlayers, readNickname } from "./field-rules";
import { isNotice, welcomeErrorOf, type Notice } from "./messages";
import type { WelcomeError } from "./messages";
import {
  readKept,
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

export class AppState {
  kept = $state<Kept>({});
  // The bag as last read, or null before the first read.
  view = $state<BagView | null>(null);
  // When the bag shown was read, in milliseconds since 1970.
  loadedAt = $state<number | null>(null);
  // Why the friend is back on the welcome, shown in its banner.
  notice = $state<Notice | null>(null);
  // The error code shown in the strip of the errors of the bag.
  toast = $state<string | null>(null);
  fault = $state<AddFault | null>(null);
  loading = $state(false);
  adding = $state(false);
  session = $derived(sessionOf(this.kept));

  #api: Api;
  #storage: KeptStorage | null;
  // Raised each time the friend leaves the bag: an answer to a call asked before is ignored.
  #epoch = 0;
  // A reload that failed already showed it: the next ones don't show it again.
  #reloadFailed = false;

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

  #show(view: BagView) {
    this.view = view;
    this.loadedAt = Date.now();
    // The admin may have renamed the friend.
    if (this.kept.nickname !== view.me.nickname) {
      this.#keep({ ...this.kept, nickname: view.me.nickname });
    }
  }

  // Back to the welcome: the personal code is forgotten, the access code too when it changed.
  #leave(notice: Notice | null, keep: Kept) {
    this.#epoch += 1;
    this.#keep(keep);
    this.view = null;
    this.loadedAt = null;
    this.toast = null;
    this.fault = null;
    this.loading = false;
    this.adding = false;
    this.notice = notice;
    this.#reloadFailed = false;
  }

  // What an answer of the bag leads to: the bag shown, the friend sent back to the welcome
  // (no error left to show), or an error to show.
  #settle(result: ApiResult): Outcome {
    if (result.ok) {
      this.#show(result.view);
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

  closeToast() {
    this.toast = null;
    this.fault = null;
  }

  // « Se déconnecter »: forgets the friend in this browser.
  logout() {
    this.#leave(null, {});
  }
}
