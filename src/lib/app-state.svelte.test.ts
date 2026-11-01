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
  const calls: Array<{ path: string; headers: Headers }> = [];
  const fetcher = vi.fn(
    async (input: string | URL | Request, init?: RequestInit) => {
      const path = String(input);
      const headers = new Headers(init?.headers);
      calls.push({ path, headers });
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
});
