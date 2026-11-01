import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  readSteamAnswer,
  readSteamGame,
  steamDetailsUrl,
  type SteamPage,
} from "../lib/steam-game";
import type { JsonStore } from "../lib/store";
import { memoryStore } from "./memory-store";

const COVER =
  "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/730/header.jpg?t=1";

// The answer of Steam for Counter-Strike 2, cut down to what matters.
const steamAnswer = (data: Record<string, unknown> = {}) => ({
  "730": {
    success: true,
    data: {
      type: "game",
      name: "Counter-Strike 2",
      steam_appid: 730,
      header_image: COVER,
      categories: [
        { id: 1, description: "Multijoueur" },
        { id: 36, description: "JcJ en ligne" },
      ],
      genres: [
        { id: "1", description: "Action" },
        { id: "37", description: "Free-to-play" },
      ],
      short_description: "Not kept.",
      ...data,
    },
  },
});

const COUNTER_STRIKE: SteamPage = {
  appid: 730,
  type: "game",
  name: "Counter-Strike 2",
  cover: COVER,
  categories: [
    { id: 1, name: "Multijoueur" },
    { id: 36, name: "JcJ en ligne" },
  ],
  genres: ["Action", "Free-to-play"],
};

// A fetch that answers the given body as JSON, with the given status.
const steamAnswering = (body: unknown, status = 200) =>
  vi.fn<typeof fetch>(async () => Response.json(body, { status }));

describe("readSteamAnswer", () => {
  it("keeps only the fields the bag needs", () => {
    expect(readSteamAnswer(730, steamAnswer())).toEqual(COUNTER_STRIKE);
  });

  it("keeps the appid given by Steam, which may differ from the link's", () => {
    expect(
      readSteamAnswer(730, steamAnswer({ steam_appid: 731 })),
    ).toMatchObject({ appid: 731 });
  });

  it.each([undefined, "731", 0, -1, 1.5, 2 ** 32])(
    "keeps the appid of the link when Steam gives %j",
    (steam_appid) => {
      expect(readSteamAnswer(730, steamAnswer({ steam_appid }))).toMatchObject({
        appid: 730,
      });
    },
  );

  it("knows when Steam doesn't know the appid", () => {
    expect(readSteamAnswer(999, { "999": { success: false } })).toBe("unknown");
  });

  it.each([
    null,
    [],
    "text",
    {},
    { "731": { success: true, data: {} } },
    { "730": { success: "yes" } },
    { "730": { success: true } },
    { "730": { success: true, data: { type: "game" } } },
    { "730": { success: true, data: { type: "game", name: "   " } } },
    { "730": { success: true, data: { type: 1, name: "CS" } } },
  ])("refuses the unexpected answer %j", (body) => {
    expect(readSteamAnswer(730, body)).toBeNull();
  });

  it.each([
    "http://shared.akamai.steamstatic.com/header.jpg",
    "https://evil.example/header.jpg",
    "https://steamstatic.com.evil.example/header.jpg",
    "javascript:alert(1)",
    "not a link",
    42,
  ])("drops the cover %j", (header_image) => {
    const page = readSteamAnswer(730, steamAnswer({ header_image }));
    expect(page).toMatchObject({ cover: null });
  });

  it("drops the malformed categories and genres, and cuts long texts", () => {
    const page = readSteamAnswer(
      730,
      steamAnswer({
        name: `  ${"A".repeat(300)}  `,
        categories: [
          { id: 1, description: "Multijoueur" },
          { id: "9", description: "Coopération" },
          { id: 9 },
          "Coop",
          null,
        ],
        genres: [{ description: "Action" }, { description: "" }, "RPG"],
      }),
    );
    expect(page).toMatchObject({
      name: "A".repeat(200),
      categories: [{ id: 1, name: "Multijoueur" }],
      genres: ["Action"],
    });
  });

  it("accepts a page without categories nor genres", () => {
    expect(
      readSteamAnswer(730, steamAnswer({ categories: undefined, genres: "x" })),
    ).toMatchObject({ categories: [], genres: [] });
  });
});

describe("readSteamGame", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it("asks Steam in French, then caches the page", async () => {
    const { store, data } = memoryStore();
    const fetcher = steamAnswering(steamAnswer());
    expect(await readSteamGame(730, { store, fetcher })).toEqual({
      ok: true,
      game: COUNTER_STRIKE,
    });
    expect(fetcher).toHaveBeenCalledOnce();
    expect(fetcher.mock.calls[0]?.[0]).toBe(steamDetailsUrl(730));
    expect(steamDetailsUrl(730)).toContain("l=french");
    expect(data.get("steam/730")).toEqual(COUNTER_STRIKE);
  });

  it("answers from the cache without asking Steam", async () => {
    const { store } = memoryStore({ "steam/730": COUNTER_STRIKE });
    const fetcher = steamAnswering(steamAnswer());
    expect(await readSteamGame(730, { store, fetcher })).toEqual({
      ok: true,
      game: COUNTER_STRIKE,
    });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("answers a cached page whose appid differs from the link's", async () => {
    const { store } = memoryStore({
      "steam/730": { ...COUNTER_STRIKE, appid: 731 },
    });
    const fetcher = steamAnswering(steamAnswer());
    expect(await readSteamGame(730, { store, fetcher })).toMatchObject({
      ok: true,
      game: { appid: 731 },
    });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("asks Steam again when the cached page has another shape", async () => {
    const { store, data } = memoryStore({ "steam/730": { name: "Old" } });
    const fetcher = steamAnswering(steamAnswer());
    expect(await readSteamGame(730, { store, fetcher })).toMatchObject({
      ok: true,
    });
    expect(data.get("steam/730")).toEqual(COUNTER_STRIKE);
  });

  it("refuses a soundtrack, and caches it so as not to ask again", async () => {
    const { store, data } = memoryStore();
    const fetcher = steamAnswering(steamAnswer({ type: "music" }));
    expect(await readSteamGame(730, { store, fetcher })).toEqual({
      ok: false,
      error: "not-a-game",
    });
    expect(await readSteamGame(730, { store, fetcher })).toEqual({
      ok: false,
      error: "not-a-game",
    });
    expect(fetcher).toHaveBeenCalledOnce();
    expect(data.get("steam/730")).toMatchObject({ type: "music" });
  });

  it("refuses an appid unknown to Steam, without caching it", async () => {
    const { store, data } = memoryStore();
    const fetcher = steamAnswering({ "999": { success: false } });
    expect(await readSteamGame(999, { store, fetcher })).toEqual({
      ok: false,
      error: "not-a-game",
    });
    expect(data.size).toBe(0);
  });

  it.each([
    ["limits the calls", steamAnswering({}, 429)],
    ["fails", steamAnswering({}, 500)],
    ["answers an unexpected shape", steamAnswering({ "730": {} })],
    [
      "answers something else than JSON",
      vi.fn<typeof fetch>(async () => new Response("<html>")),
    ],
    [
      "doesn't answer",
      vi.fn<typeof fetch>(async () => {
        throw new TypeError("fetch failed");
      }),
    ],
  ])("says Steam is unavailable when it %s", async (_, fetcher) => {
    const { store, data } = memoryStore();
    expect(await readSteamGame(730, { store, fetcher })).toEqual({
      ok: false,
      error: "steam-unavailable",
    });
    expect(data.size).toBe(0);
  });

  it("still answers when Blobs fails", async () => {
    const store: JsonStore = {
      getJSON: async () => {
        throw new Error("Blobs is down");
      },
      getVersioned: async () => {
        throw new Error("Blobs is down");
      },
      setJSON: async () => {
        throw new Error("Blobs is down");
      },
    };
    expect(
      await readSteamGame(730, {
        store,
        fetcher: steamAnswering(steamAnswer()),
      }),
    ).toEqual({ ok: true, game: COUNTER_STRIKE });
  });
});
