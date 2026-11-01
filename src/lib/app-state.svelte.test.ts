import { describe, expect, it, vi } from "vitest";
import { createApi } from "./api";
import { AppState } from "./app-state.svelte";
import type { BagGame, BagView } from "./bag";
import { KEPT_KEY, type Kept, type KeptStorage } from "./session";

const game: BagGame = {
  appid: 730,
  name: "Counter-Strike 2",
  cover: null,
  categories: [],
  genres: [],
  maxPlayers: null,
  addedBy: "j1",
  addedAt: "2026-11-01T20:00:00.000Z",
  votes: { j1: "up" },
};

const viewOf = (games: BagGame[] = []): BagView => ({
  role: "member",
  me: { id: "j1", nickname: "Nova" },
  players: [{ id: "j1", nickname: "Nova" }],
  games,
});

const session: Kept = {
  accessCode: "member-code",
  nickname: "Nova",
  playerId: "j1",
  personalCode: "1234",
};

const memoryStorage = (kept?: Kept) => {
  const items = new Map<string, string>();
  if (kept) items.set(KEPT_KEY, JSON.stringify(kept));
  const storage: KeptStorage = {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => void items.set(key, value),
    removeItem: (key) => void items.delete(key),
  };
  return {
    storage,
    kept: (): Kept => JSON.parse(items.get(KEPT_KEY) ?? "{}"),
  };
};

type Route = (headers: Headers) => Response | Promise<Response>;

// A server that answers each path with its route, and records the calls.
const fakeServer = (routes: Record<string, Route>) => {
  const calls: Array<{ path: string; headers: Headers; body?: unknown }> = [];
  const fetcher = vi.fn(
    async (input: string | URL | Request, init?: RequestInit) => {
      const path = String(input);
      const headers = new Headers(init?.headers);
      calls.push({
        path,
        headers,
        body:
          typeof init?.body === "string" ? JSON.parse(init.body) : undefined,
      });
      const route = routes[path];
      if (!route) throw new Error(`No route for ${path}`);
      return route(headers);
    },
  );
  return {
    api: createApi({ fetcher, wait: async () => undefined }),
    calls,
  };
};

const refuse =
  (error: string, status = 401) =>
  () =>
    Response.json({ error }, { status });

describe("AppState", () => {
  it("resumes a kept session with get-bag, never with enter", async () => {
    const { api, calls } = fakeServer({
      "/api/get-bag": () => Response.json(viewOf([game])),
    });
    const { storage } = memoryStorage(session);
    const app = new AppState(api, storage);
    expect(app.session).not.toBeNull();
    await vi.waitFor(() => expect(app.view).not.toBeNull());
    expect(calls.map((call) => call.path)).toEqual(["/api/get-bag"]);
    expect(calls[0]?.headers.get("x-player-code")).toBe("1234");
  });

  it("enters, then keeps the friend with the id the server gave", async () => {
    const { api } = fakeServer({ "/api/enter": () => Response.json(viewOf()) });
    const { storage, kept } = memoryStorage();
    const app = new AppState(api, storage);
    const error = await app.enter({
      accessCode: " member-code ",
      nickname: "nova",
      personalCode: "1234",
    });
    expect(error).toBeNull();
    expect(kept()).toEqual(session);
    expect(app.session).not.toBeNull();
  });

  it("says which field of the welcome is wrong, the first one first", async () => {
    const { api, calls } = fakeServer({
      "/api/enter": refuse("wrong-personal-code"),
    });
    const app = new AppState(api, memoryStorage().storage);
    expect(
      await app.enter({ accessCode: "", nickname: "x", personalCode: "1" }),
    ).toEqual({ field: "accessCode", code: "missing-access-code" });
    expect(
      await app.enter({
        accessCode: "c",
        nickname: "No va",
        personalCode: "1",
      }),
    ).toEqual({ field: "nickname", code: "invalid-nickname" });
    expect(
      await app.enter({
        accessCode: "c",
        nickname: "Nova",
        personalCode: "12",
      }),
    ).toEqual({ field: "personalCode", code: "invalid-personal-code" });
    expect(calls).toHaveLength(0);
    expect(
      await app.enter({
        accessCode: "c",
        nickname: "Nova",
        personalCode: "1234",
      }),
    ).toEqual({ field: "personalCode", code: "wrong-personal-code" });
    expect(app.session).toBeNull();
  });

  it.each([
    "unknown-player",
    "personal-code-reset",
    "wrong-personal-code",
    "player-locked",
  ])(
    "on %s, forgets the personal code, keeps the access code and the nickname",
    async (refusal) => {
      const { api } = fakeServer({
        "/api/get-bag": refuse(
          refusal,
          refusal === "player-locked" ? 423 : 401,
        ),
      });
      const { storage, kept } = memoryStorage(session);
      const app = new AppState(api, storage);
      await vi.waitFor(() => expect(app.session).toBeNull());
      expect(kept()).toEqual({ accessCode: "member-code", nickname: "Nova" });
      expect(app.notice).toBe(refusal);
      expect(app.view).toBeNull();
    },
  );

  it("never sends the forgotten code again: the calls waiting behind a refusal are dropped", async () => {
    let refuseNow: (() => void) | undefined;
    const { api, calls } = fakeServer({
      "/api/get-bag": () =>
        new Promise((resolve) => {
          refuseNow = () =>
            resolve(
              Response.json({ error: "wrong-personal-code" }, { status: 401 }),
            );
        }),
      "/api/add-game": () => Response.json(viewOf([game])),
    });
    const app = new AppState(api, memoryStorage(session).storage);
    await vi.waitFor(() => expect(refuseNow).toBeDefined());
    const added = app.addGame("https://store.steampowered.com/app/730/", "");
    refuseNow?.();
    expect(await added).toBe(false);
    expect(calls.map((call) => call.path)).toEqual(["/api/get-bag"]);
    expect(app.session).toBeNull();
  });

  it("sends the friend back without the access code when it changed", async () => {
    const { api } = fakeServer({
      "/api/get-bag": refuse("wrong-access-code"),
    });
    const { storage, kept } = memoryStorage(session);
    const app = new AppState(api, storage);
    await vi.waitFor(() => expect(app.session).toBeNull());
    expect(kept()).toEqual({ nickname: "Nova" });
    expect(app.notice).toBe("access-code-changed");
  });

  it("keeps the bag shown when the server doesn't answer, and says so once", async () => {
    let up = true;
    const { api } = fakeServer({
      "/api/get-bag": () => {
        if (up) return Response.json(viewOf([game]));
        throw new TypeError("Failed to fetch");
      },
    });
    const app = new AppState(api, memoryStorage(session).storage);
    await vi.waitFor(() => expect(app.view).not.toBeNull());
    up = false;
    await app.refresh({ background: true });
    expect(app.toast).toBe("server-unreachable");
    expect(app.view?.games).toHaveLength(1);
    app.closeToast();
    await app.refresh({ background: true });
    expect(app.toast).toBeNull();
    // « Rafraîchir » says it again; a read that succeeds clears it.
    await app.refresh();
    expect(app.toast).toBe("server-unreachable");
    up = true;
    await app.refresh({ background: true });
    expect(app.toast).toBeNull();
  });

  it("skips a reload in the background while another call runs", async () => {
    let answer: (() => void) | undefined;
    const { api, calls } = fakeServer({
      "/api/get-bag": () => Response.json(viewOf()),
      "/api/add-game": () =>
        new Promise((resolve) => {
          answer = () => resolve(Response.json(viewOf([game])));
        }),
    });
    const app = new AppState(api, memoryStorage(session).storage);
    await vi.waitFor(() => expect(app.view).not.toBeNull());
    const added = app.addGame("https://store.steampowered.com/app/730/", "");
    await app.refresh({ background: true });
    answer?.();
    expect(await added).toBe(true);
    expect(calls.map((call) => call.path)).toEqual([
      "/api/get-bag",
      "/api/add-game",
    ]);
  });

  describe("votes and removing", () => {
    // Two games added by Krak (j2): A at +2, then B at +1; the friend is Nova (j1).
    const gameA: BagGame = {
      ...game,
      appid: 1,
      addedBy: "j2",
      votes: { j2: "up", j3: "up" },
    };
    const gameB: BagGame = {
      ...game,
      appid: 2,
      addedBy: "j2",
      addedAt: "2026-11-01T21:00:00.000Z",
      votes: { j2: "up" },
    };

    it("shows a vote at once, and keeps the cards where they are until the next read", async () => {
      let answer: (() => void) | undefined;
      const votedB: BagGame = {
        ...gameB,
        votes: { j2: "up", j1: "up", j4: "up" },
      };
      let games = [gameA, gameB];
      const { api } = fakeServer({
        "/api/get-bag": () => Response.json(viewOf(games)),
        "/api/vote": () =>
          new Promise((resolve) => {
            answer = () => resolve(Response.json(viewOf([gameA, votedB])));
          }),
      });
      const app = new AppState(api, memoryStorage(session).storage);
      await vi.waitFor(() => expect(app.view).not.toBeNull());
      const voted = app.vote(2, "up");
      expect(app.view?.games[1]?.votes.j1).toBe("up");
      await vi.waitFor(() => expect(answer).toBeDefined());
      answer?.();
      await voted;
      expect(app.view?.games[1]?.votes).toEqual(votedB.votes);
      expect(app.games.map(({ appid }) => appid)).toEqual([1, 2]);
      games = [gameA, votedB];
      await app.refresh();
      expect(app.games.map(({ appid }) => appid)).toEqual([2, 1]);
    });

    it("puts the vote back when the server refuses it", async () => {
      const { api } = fakeServer({
        "/api/get-bag": () => Response.json(viewOf([gameB])),
        "/api/vote": refuse("server-error", 500),
      });
      const app = new AppState(api, memoryStorage(session).storage);
      await vi.waitFor(() => expect(app.view).not.toBeNull());
      await app.vote(2, "down");
      expect(app.view?.games[0]?.votes).toEqual({ j2: "up" });
      expect(app.toast).toBe("server-error");
    });

    it("never votes on the friend's own game", async () => {
      const { api, calls } = fakeServer({
        "/api/get-bag": () => Response.json(viewOf([game])),
        "/api/vote": () => Response.json(viewOf([game])),
      });
      const app = new AppState(api, memoryStorage(session).storage);
      await vi.waitFor(() => expect(app.view).not.toBeNull());
      await app.vote(730, "down");
      expect(app.view?.games[0]?.votes).toEqual({ j1: "up" });
      expect(calls.map((call) => call.path)).toEqual(["/api/get-bag"]);
    });

    it("withdraws the vote on a second tap, without showing the first answer between", async () => {
      const answers: Array<() => void> = [];
      const server: BagGame[] = [
        { ...gameB, votes: { j2: "up", j1: "up" } },
        { ...gameB, votes: { j2: "up" } },
      ];
      const { api } = fakeServer({
        "/api/get-bag": () => Response.json(viewOf([gameB])),
        "/api/vote": () =>
          new Promise((resolve) => {
            const answer = server[answers.length];
            answers.push(() =>
              resolve(Response.json(viewOf(answer ? [answer] : []))),
            );
          }),
      });
      const app = new AppState(api, memoryStorage(session).storage);
      await vi.waitFor(() => expect(app.view).not.toBeNull());
      const first = app.vote(2, "up");
      expect(app.view?.games[0]?.votes).toEqual({ j2: "up", j1: "up" });
      const second = app.vote(2, "up");
      expect(app.view?.games[0]?.votes).toEqual({ j2: "up" });
      await vi.waitFor(() => expect(answers).toHaveLength(1));
      answers[0]?.();
      await first;
      expect(app.view?.games[0]?.votes).toEqual({ j2: "up" });
      await vi.waitFor(() => expect(answers).toHaveLength(2));
      answers[1]?.();
      await second;
      expect(app.view?.games[0]?.votes).toEqual({ j2: "up" });
    });

    it("removes one game at a time", async () => {
      let answer: (() => void) | undefined;
      const { api, calls } = fakeServer({
        "/api/get-bag": () => Response.json(viewOf([gameA, gameB])),
        "/api/remove-game": () =>
          new Promise((resolve) => {
            answer = () => resolve(Response.json(viewOf([gameB])));
          }),
      });
      const app = new AppState(api, memoryStorage(session).storage);
      await vi.waitFor(() => expect(app.view).not.toBeNull());
      const first = app.removeGame(1);
      expect(app.removing).toBe(1);
      expect(await app.removeGame(2)).toBe(false);
      await vi.waitFor(() => expect(answer).toBeDefined());
      answer?.();
      expect(await first).toBe(true);
      expect(app.removing).toBeNull();
      expect(calls.map((call) => call.path)).toEqual([
        "/api/get-bag",
        "/api/remove-game",
      ]);
    });

    it("removes a game, and reads the bag again when it was already gone", async () => {
      const { api, calls } = fakeServer({
        "/api/get-bag": () => Response.json(viewOf([game])),
        "/api/remove-game": refuse("game-not-found", 404),
      });
      const app = new AppState(api, memoryStorage(session).storage);
      await vi.waitFor(() => expect(app.view).not.toBeNull());
      await app.removeGame(730);
      expect(app.removing).toBeNull();
      expect(app.toast).toBeNull();
      await vi.waitFor(() => expect(calls).toHaveLength(3));
      expect(calls[2]?.path).toBe("/api/get-bag");
    });
  });

  it("refuses a wrong link or « Joueurs max » before asking the server", async () => {
    const { api, calls } = fakeServer({
      "/api/get-bag": () => Response.json(viewOf()),
    });
    const app = new AppState(api, memoryStorage(session).storage);
    await vi.waitFor(() => expect(app.view).not.toBeNull());
    expect(
      await app.addGame("https://store.steampowered.com/bundle/232/", ""),
    ).toBe(false);
    expect(app.toast).toBe("steam-package");
    expect(app.fault).toBe("link");
    expect(
      await app.addGame("https://store.steampowered.com/app/730/", "100"),
    ).toBe(false);
    expect(app.toast).toBe("invalid-max-players");
    expect(app.fault).toBe("maxPlayers");
    expect(calls).toHaveLength(1);
  });

  it("forgets everything on « Se déconnecter », and ignores an answer that comes after", async () => {
    let answer: (() => void) | undefined;
    const { api } = fakeServer({
      "/api/get-bag": () =>
        new Promise((resolve) => {
          answer = () => resolve(Response.json(viewOf([game])));
        }),
    });
    const { storage, kept } = memoryStorage(session);
    const app = new AppState(api, storage);
    await vi.waitFor(() => expect(answer).toBeDefined());
    app.logout();
    answer?.();
    await vi.waitFor(() => expect(api.pending).toBe(0));
    expect(app.view).toBeNull();
    expect(app.session).toBeNull();
    expect(kept()).toEqual({});
  });

  it("follows another tab: logged out there, logged out here", async () => {
    const { api } = fakeServer({
      "/api/get-bag": () => Response.json(viewOf([game])),
    });
    const memory = memoryStorage(session);
    const app = new AppState(api, memory.storage);
    await vi.waitFor(() => expect(app.view).not.toBeNull());
    memory.storage.removeItem(KEPT_KEY);
    app.syncKept();
    expect(app.session).toBeNull();
    expect(app.view).toBeNull();
  });

  it("takes the session another tab entered with, rather than writing over it", async () => {
    const renewed = { ...session, personalCode: "5678" };
    const memory = memoryStorage(session);
    const { api, calls } = fakeServer({
      "/api/get-bag": (headers) => {
        if (headers.get("x-player-code") === "1234") {
          // Meanwhile, another tab entered with the new code.
          memory.storage.setItem(KEPT_KEY, JSON.stringify(renewed));
          return Response.json(
            { error: "personal-code-reset" },
            { status: 401 },
          );
        }
        return Response.json(viewOf([game]));
      },
    });
    const app = new AppState(api, memory.storage);
    await vi.waitFor(() => expect(app.view).not.toBeNull());
    expect(memory.kept()).toEqual(renewed);
    expect(app.notice).toBeNull();
    expect(calls.map((call) => call.headers.get("x-player-code"))).toEqual([
      "1234",
      "5678",
    ]);
  });

  describe("the settings of the admin", () => {
    const adminView = (accounts?: BagView["accounts"]): BagView => ({
      ...viewOf(),
      role: "admin",
      players: [
        { id: "j1", nickname: "Nova" },
        { id: "j2", nickname: "Krak" },
      ],
      ...(accounts ? { accounts } : {}),
    });
    const accounts = [
      { id: "j1", nickname: "Nova", state: "active" as const },
      { id: "j2", nickname: "Krak", state: "locked" as const },
    ];

    it("reads the accounts, and keeps them through the reloads of the bag", async () => {
      const { api } = fakeServer({
        "/api/get-bag": () => Response.json(adminView()),
        "/api/get-settings": () => Response.json(adminView(accounts)),
      });
      const app = new AppState(api, memoryStorage(session).storage);
      await vi.waitFor(() => expect(app.view).not.toBeNull());
      expect(await app.openSettings()).toBe(true);
      expect(app.accounts).toEqual(accounts);
      await app.refresh();
      expect(app.accounts).toEqual(accounts);
    });

    it("refuses a nickname against the rules before asking the server", async () => {
      const { api, calls } = fakeServer({
        "/api/get-bag": () => Response.json(adminView()),
      });
      const app = new AppState(api, memoryStorage(session).storage);
      await vi.waitFor(() => expect(app.view).not.toBeNull());
      expect(await app.renamePlayer("j2", "Kr ak")).toBe(false);
      expect(app.settingsError).toEqual({ id: "j2", code: "invalid-nickname" });
      expect(calls.map((call) => call.path)).toEqual(["/api/get-bag"]);
    });

    it("shows a refusal under the line of its player, with the nickname typed", async () => {
      const { api, calls } = fakeServer({
        "/api/get-bag": () => Response.json(adminView()),
        "/api/rename-player": refuse("nickname-taken", 409),
      });
      const app = new AppState(api, memoryStorage(session).storage);
      await vi.waitFor(() => expect(app.view).not.toBeNull());
      expect(await app.renamePlayer("j2", "nova")).toBe(false);
      expect(app.settingsError).toEqual({
        id: "j2",
        code: "nickname-taken",
        nickname: "Nova",
      });
      expect(app.toast).toBeNull();
      expect(calls.at(-1)?.path).toBe("/api/rename-player");
    });

    it("reads the players again when the one changed is gone", async () => {
      const { api, calls } = fakeServer({
        "/api/get-bag": () => Response.json(adminView()),
        "/api/reset-player-code": refuse("player-not-found", 404),
        "/api/get-settings": () => Response.json(adminView(accounts)),
      });
      const app = new AppState(api, memoryStorage(session).storage);
      await vi.waitFor(() => expect(app.view).not.toBeNull());
      expect(await app.resetPlayerCode("j2")).toBe(false);
      await vi.waitFor(() => expect(app.accounts).toEqual(accounts));
      expect(app.settingsError).toBeNull();
      expect(calls.map((call) => call.path)).toEqual([
        "/api/get-bag",
        "/api/reset-player-code",
        "/api/get-settings",
      ]);
    });

    it("runs one change at a time", async () => {
      let answer: (response: Response) => void = () => {};
      const { api, calls } = fakeServer({
        "/api/get-bag": () => Response.json(adminView()),
        "/api/reset-player-code": () =>
          new Promise<Response>((resolve) => (answer = resolve)),
      });
      const app = new AppState(api, memoryStorage(session).storage);
      await vi.waitFor(() => expect(app.view).not.toBeNull());
      const first = app.resetPlayerCode("j2");
      expect(await app.deletePlayer("j2")).toBe(false);
      await vi.waitFor(() => expect(calls).toHaveLength(2));
      answer(Response.json(adminView(accounts)));
      expect(await first).toBe(true);
      expect(calls.map((call) => call.path)).toEqual([
        "/api/get-bag",
        "/api/reset-player-code",
      ]);
    });

    it("sends the admin back to the welcome when their own player is refused", async () => {
      const { api } = fakeServer({
        "/api/get-bag": () => Response.json(adminView()),
        "/api/delete-player": refuse("personal-code-reset"),
      });
      const { storage, kept } = memoryStorage(session);
      const app = new AppState(api, storage);
      await vi.waitFor(() => expect(app.view).not.toBeNull());
      expect(await app.deletePlayer("j2")).toBe(false);
      expect(app.session).toBeNull();
      expect(app.settingsError).toBeNull();
      expect(kept().personalCode).toBeUndefined();
    });
  });

  describe("emptying the bag", () => {
    const games = [10, 20, 30].map((appid) => ({ ...game, appid }));
    const adminView = (kept = games): BagView => ({
      ...viewOf(kept),
      role: "admin",
    });

    it("sends the games to remove, and shows the bag answered", async () => {
      const { api, calls } = fakeServer({
        "/api/get-bag": () => Response.json(adminView()),
        "/api/empty-bag": () => Response.json(adminView([games[1]!])),
      });
      const app = new AppState(api, memoryStorage(session).storage);
      await vi.waitFor(() => expect(app.view).not.toBeNull());
      expect(await app.emptyBag([10, 30])).toBe(true);
      expect(calls.at(-1)?.body).toEqual({ appids: [10, 30] });
      expect(app.games.map((kept) => kept.appid)).toEqual([20]);
      expect(app.emptying).toBe(false);
    });

    it("sends nothing when no game is to remove", async () => {
      const { api, calls } = fakeServer({
        "/api/get-bag": () => Response.json(adminView()),
      });
      const app = new AppState(api, memoryStorage(session).storage);
      await vi.waitFor(() => expect(app.view).not.toBeNull());
      expect(await app.emptyBag([])).toBe(false);
      expect(calls).toHaveLength(1);
    });

    it("shows a failure in the panel, not in the strip, and keeps the bag", async () => {
      const { api } = fakeServer({
        "/api/get-bag": () => Response.json(adminView()),
        "/api/empty-bag": refuse("server-error", 500),
      });
      const app = new AppState(api, memoryStorage(session).storage);
      await vi.waitFor(() => expect(app.view).not.toBeNull());
      expect(await app.emptyBag([10])).toBe(false);
      expect(app.emptyError).toBe("server-error");
      expect(app.toast).toBeNull();
      expect(app.games).toHaveLength(3);
      app.closeEmpty();
      expect(app.emptyError).toBeNull();
    });

    it("runs one emptying at a time", async () => {
      let answer: (response: Response) => void = () => {};
      const { api, calls } = fakeServer({
        "/api/get-bag": () => Response.json(adminView()),
        "/api/empty-bag": () =>
          new Promise<Response>((resolve) => (answer = resolve)),
      });
      const app = new AppState(api, memoryStorage(session).storage);
      await vi.waitFor(() => expect(app.view).not.toBeNull());
      const first = app.emptyBag([10]);
      expect(app.emptying).toBe(true);
      expect(await app.emptyBag([20])).toBe(false);
      await vi.waitFor(() => expect(calls).toHaveLength(2));
      answer(Response.json(adminView([games[1]!, games[2]!])));
      expect(await first).toBe(true);
    });
  });
});
