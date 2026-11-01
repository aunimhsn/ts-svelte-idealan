import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { config as addGameConfig, handleAddGame } from "../functions/add-game";
import { config as enterConfig, handleEnter } from "../functions/enter";
import { config as getBagConfig, handleGetBag } from "../functions/get-bag";
import {
  config as removeGameConfig,
  handleRemoveGame,
} from "../functions/remove-game";
import { config as voteConfig, handleVote } from "../functions/vote";
import { MAX_GAMES, type BagGame, type BagView } from "../../src/lib/bag";
import { ACCESS_CODE_HEADER } from "../lib/access";
import { BAG_KEY } from "../lib/bag";
import {
  PLAYER_CODE_HEADER,
  PLAYER_ID_HEADER,
  withServerErrors,
} from "../lib/http";
import { MAX_FAILURES } from "../lib/players";
import { memoryStore } from "./memory-store";

const env = { MEMBER_CODE: "member-test-code", ADMIN_CODE: "admin-test-code" };
const NOW = new Date("2026-11-07T18:00:00Z");
const COVER =
  "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/730/header.jpg";
const CS_LINK = "https://store.steampowered.com/app/730/CounterStrike_2/";

// The answer of Steam for an appid, cut down to what matters.
const steamAnswer = (appid: number, data: Record<string, unknown> = {}) => ({
  [String(appid)]: {
    success: true,
    data: {
      type: "game",
      name: `Game ${appid}`,
      steam_appid: appid,
      header_image: COVER,
      categories: [{ id: 9, description: "Coopération" }],
      genres: [{ id: "1", description: "Action" }],
      ...data,
    },
  },
});

// A fetch that answers the game of the appid of the address it is given.
const steam = vi.fn<typeof fetch>(async (input) => {
  const appid = Number(new URL(String(input)).searchParams.get("appids"));
  return Response.json(steamAnswer(appid));
});

interface As {
  code?: string;
  player?: string;
  personalCode?: string;
}

const request = (
  path: string,
  method: string,
  body: unknown,
  { code = "member-test-code", player, personalCode }: As = {},
) =>
  new Request(`http://localhost/api/${path}`, {
    method,
    headers: {
      [ACCESS_CODE_HEADER]: code,
      ...(player === undefined ? {} : { [PLAYER_ID_HEADER]: player }),
      ...(personalCode === undefined
        ? {}
        : { [PLAYER_CODE_HEADER]: personalCode }),
      "content-type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

const answer = async (response: Response) => ({
  status: response.status,
  body: (await response.json()) as BagView & { error?: string },
});

// A bag with two friends who entered: Sylent (j1, 1234) and Nova (j2, 0000).
const setUp = async () => {
  const memory = memoryStore();
  const enter = (nickname: string, code: string, accessCode?: string) =>
    handleEnter(
      request("enter", "POST", { nickname, code }, { code: accessCode }),
      env,
      memory.store,
      NOW,
    ).then(answer);
  await enter("Sylent", "1234");
  await enter("Nova", "0000");
  const sylent = { player: "j1", personalCode: "1234" };
  const nova = { player: "j2", personalCode: "0000" };
  const admin = { ...sylent, code: "admin-test-code" };
  const add = (as: As, link = CS_LINK, maxPlayers: unknown = "") =>
    handleAddGame(
      request("add-game", "POST", { link, maxPlayers }, as),
      env,
      { store: memory.store, fetcher: steam },
      NOW,
    ).then(answer);
  const vote = (as: As, appid: number, vote: unknown) =>
    handleVote(
      request("vote", "POST", { appid, vote }, as),
      env,
      memory.store,
    ).then(answer);
  const remove = (as: As, appid: number) =>
    handleRemoveGame(
      request("remove-game", "POST", { appid }, as),
      env,
      memory.store,
    ).then(answer);
  const getBag = (as: As) =>
    handleGetBag(
      request("get-bag", "GET", undefined, as),
      env,
      memory.store,
    ).then(answer);
  return { ...memory, enter, add, vote, remove, getBag, sylent, nova, admin };
};

beforeEach(() => {
  steam.mockClear();
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

describe("the addresses", () => {
  it.each([
    [enterConfig, "/api/enter"],
    [getBagConfig, "/api/get-bag"],
    [addGameConfig, "/api/add-game"],
    [voteConfig, "/api/vote"],
    [removeGameConfig, "/api/remove-game"],
  ])("answers on %j", (config, path) => {
    expect(config.path).toBe(path);
  });
});

describe("enter", () => {
  it("answers the bag, the player who entered and their role", async () => {
    const { enter } = await setUp();
    const entered = await enter("sylent", "1234");
    expect(entered).toEqual({
      status: 200,
      body: {
        role: "member",
        me: { id: "j1", nickname: "Sylent" },
        players: [
          { id: "j1", nickname: "Sylent" },
          { id: "j2", nickname: "Nova" },
        ],
        games: [],
      },
    });
    expect(JSON.stringify(entered)).not.toContain("scrypt");
  });

  it("knows the admin by the access code", async () => {
    const { enter } = await setUp();
    expect((await enter("Sylent", "1234", "admin-test-code")).body.role).toBe(
      "admin",
    );
  });

  it.each([
    [{ nickname: "ab", code: "1234" }, "invalid-nickname"],
    [{ nickname: 42, code: "1234" }, "invalid-nickname"],
    [{ nickname: "Krak", code: "123" }, "invalid-personal-code"],
    [{ nickname: "Krak", code: 1234 }, "invalid-personal-code"],
    [[], "invalid-request"],
    ["text", "invalid-request"],
  ])("refuses %j with %j", async (body, error) => {
    const { store } = await setUp();
    const response = await answer(
      await handleEnter(request("enter", "POST", body), env, store, NOW),
    );
    expect(response).toEqual({ status: 400, body: { error } });
  });

  it("refuses a body too large before reading it", async () => {
    const { store } = await setUp();
    const response = await answer(
      await handleEnter(
        request("enter", "POST", {
          nickname: "Krak",
          code: "1234",
          pad: "x".repeat(3000),
        }),
        env,
        store,
        NOW,
      ),
    );
    expect(response.body.error).toBe("invalid-request");
  });

  it("refuses a wrong personal code, then locks the nickname", async () => {
    const { enter } = await setUp();
    for (let failure = 1; failure < MAX_FAILURES; failure++) {
      expect(await enter("Sylent", "9999")).toEqual({
        status: 401,
        body: { error: "wrong-personal-code" },
      });
    }
    expect(await enter("Sylent", "9999")).toEqual({
      status: 423,
      body: { error: "player-locked" },
    });
  });

  it("checks the method, then the access code, before anything else", async () => {
    const { store, data } = memoryStore();
    const body = { nickname: "Krak", code: "1234" };
    expect(
      await answer(
        await handleEnter(request("enter", "PUT", body), env, store, NOW),
      ),
    ).toEqual({ status: 405, body: { error: "method-not-allowed" } });
    expect(
      await answer(
        await handleEnter(
          request("enter", "POST", body, { code: "wrong" }),
          env,
          store,
          NOW,
        ),
      ),
    ).toEqual({ status: 401, body: { error: "wrong-access-code" } });
    expect(data.size).toBe(0);
  });
});

describe("get-bag", () => {
  it("answers the bag to a player with their personal code", async () => {
    const { getBag, sylent } = await setUp();
    expect(await getBag(sylent)).toMatchObject({
      status: 200,
      body: { me: { id: "j1" }, games: [] },
    });
  });

  it.each([
    [{ player: "j1", personalCode: "0000" }, 401, "wrong-personal-code"],
    [{ player: "j9", personalCode: "1234" }, 401, "unknown-player"],
    [{}, 401, "unknown-player"],
    [
      { player: "j1", personalCode: "1234", code: "wrong" },
      401,
      "wrong-access-code",
    ],
  ])("refuses %j", async (as, status, error) => {
    const { getBag } = await setUp();
    expect(await getBag(as)).toEqual({ status, body: { error } });
  });

  it("refuses a POST", async () => {
    const { store, sylent } = await setUp();
    const response = await handleGetBag(
      request("get-bag", "POST", {}, sylent),
      env,
      store,
    );
    expect(response.status).toBe(405);
    expect(response.headers.get("allow")).toBe("GET");
  });

  it("answers server-error, never the bag, when the bag can't be read", async () => {
    const { store, data, sylent } = await setUp();
    data.set(BAG_KEY, { games: "broken" });
    const response = await withServerErrors(handleGetBag)(
      request("get-bag", "GET", undefined, sylent),
      env,
      store,
    );
    expect(await answer(response)).toEqual({
      status: 500,
      body: { error: "server-error" },
    });
    expect(data.get(BAG_KEY)).toEqual({ games: "broken" });
  });
});

describe("add-game", () => {
  it("adds the game with an upvote of who added it", async () => {
    const { add, sylent } = await setUp();
    const added = await add(sylent, CS_LINK, "8");
    expect(added.status).toBe(200);
    expect(added.body.games).toEqual<BagGame[]>([
      {
        appid: 730,
        name: "Game 730",
        cover: COVER,
        categories: [{ id: 9, name: "Coopération" }],
        genres: ["Action"],
        maxPlayers: 8,
        addedBy: "j1",
        addedAt: NOW.toISOString(),
        votes: { j1: "up" },
      },
    ]);
  });

  it("keeps no maximum number of players when left empty", async () => {
    const { add, sylent } = await setUp();
    expect((await add(sylent)).body.games[0]?.maxPlayers).toBeNull();
  });

  it.each([
    ["https://example.com/app/730", "not-a-steam-link"],
    ["https://store.steampowered.com/sub/54029/", "steam-package"],
  ])("refuses the link %j without asking Steam", async (link, error) => {
    const { add, sylent } = await setUp();
    expect(await add(sylent, link)).toEqual({ status: 400, body: { error } });
    expect(steam).not.toHaveBeenCalled();
  });

  it.each(["0", "100", "huit", 2.5])(
    "refuses the maximum number of players %j",
    async (maxPlayers) => {
      const { add, sylent } = await setUp();
      expect(await add(sylent, CS_LINK, maxPlayers)).toEqual({
        status: 400,
        body: { error: "invalid-max-players" },
      });
    },
  );

  it("refuses a game already in the bag, without asking Steam again", async () => {
    const { add, sylent, nova } = await setUp();
    await add(sylent);
    steam.mockClear();
    expect(await add(nova, "https://steamcommunity.com/app/730")).toEqual({
      status: 409,
      body: { error: "already-in-bag" },
    });
    expect(steam).not.toHaveBeenCalled();
  });

  it("refuses a game whose link leads to an appid already in the bag", async () => {
    const { add, sylent, nova } = await setUp();
    await add(sylent);
    steam.mockImplementationOnce(async () =>
      Response.json({ "1": steamAnswer(730)["730"] }),
    );
    expect(await add(nova, "https://store.steampowered.com/app/1/")).toEqual({
      status: 409,
      body: { error: "already-in-bag" },
    });
  });

  it("refuses a game once the bag is full", async () => {
    const { add, data, sylent } = await setUp();
    const games = Array.from({ length: MAX_GAMES }, (_, index) => ({
      appid: index + 1,
      name: `Game ${index + 1}`,
      cover: null,
      categories: [],
      genres: [],
      maxPlayers: null,
      addedBy: "j2",
      addedAt: NOW.toISOString(),
      votes: {},
    }));
    data.set(BAG_KEY, { games });
    expect(await add(sylent)).toEqual({
      status: 409,
      body: { error: "bag-full" },
    });
  });

  it("refuses what is not a game, and says when Steam doesn't answer", async () => {
    const { add, sylent } = await setUp();
    steam.mockImplementationOnce(async () =>
      Response.json(steamAnswer(730, { type: "music" })),
    );
    expect(await add(sylent)).toEqual({
      status: 422,
      body: { error: "not-a-game" },
    });
    steam.mockImplementationOnce(async () => new Response("", { status: 429 }));
    expect(
      await add(sylent, "https://store.steampowered.com/app/440/"),
    ).toEqual({ status: 502, body: { error: "steam-unavailable" } });
  });

  it("keeps the game of each of two friends who add at the same second", async () => {
    const { add, getBag, sylent, nova } = await setUp();
    await Promise.all([
      add(sylent, "https://store.steampowered.com/app/730/"),
      add(nova, "https://store.steampowered.com/app/440/"),
    ]);
    const games = (await getBag(sylent)).body.games;
    expect(games.map((game) => game.appid).sort()).toEqual([440, 730]);
  });

  it("checks the player before reading the link", async () => {
    const { add } = await setUp();
    expect(await add({ player: "j1", personalCode: "0000" })).toEqual({
      status: 401,
      body: { error: "wrong-personal-code" },
    });
    expect(steam).not.toHaveBeenCalled();
  });
});

describe("vote", () => {
  it("votes, changes the vote, and withdraws it", async () => {
    const { add, vote, sylent, nova } = await setUp();
    await add(sylent);
    expect((await vote(nova, 730, "down")).body.games[0]?.votes).toEqual({
      j1: "up",
      j2: "down",
    });
    expect((await vote(nova, 730, "up")).body.games[0]?.votes).toEqual({
      j1: "up",
      j2: "up",
    });
    expect((await vote(nova, 730, null)).body.games[0]?.votes).toEqual({
      j1: "up",
    });
  });

  it("keeps the upvote of who added the game", async () => {
    const { add, vote, sylent } = await setUp();
    await add(sylent);
    expect(await vote(sylent, 730, "down")).toEqual({
      status: 403,
      body: { error: "own-game" },
    });
  });

  it("knows the admin votes once, like every friend", async () => {
    const { add, vote, nova, admin } = await setUp();
    await add(nova);
    await vote(admin, 730, "up");
    expect((await vote(admin, 730, "up")).body.games[0]?.votes).toEqual({
      j1: "up",
      j2: "up",
    });
  });

  it.each([
    [730, "sideways"],
    ["730", "up"],
    [730, undefined],
  ])("refuses the vote %j %j", async (appid, value) => {
    const { add, vote, sylent, nova } = await setUp();
    await add(sylent);
    expect(await vote(nova, appid as number, value)).toEqual({
      status: 400,
      body: { error: "invalid-request" },
    });
  });

  it("says when the game is no longer in the bag", async () => {
    const { vote, nova } = await setUp();
    expect(await vote(nova, 730, "up")).toEqual({
      status: 404,
      body: { error: "game-not-found" },
    });
  });

  it("loses no vote of two friends who vote at the same second", async () => {
    const { add, vote, enter, sylent, nova } = await setUp();
    await enter("Krak", "4242");
    await add(sylent);
    await Promise.all([
      vote(nova, 730, "up"),
      vote({ player: "j3", personalCode: "4242" }, 730, "down"),
    ]);
    expect((await vote(nova, 730, "up")).body.games[0]?.votes).toEqual({
      j1: "up",
      j2: "up",
      j3: "down",
    });
  });
});

describe("remove-game", () => {
  it("lets who added a game remove it, with its votes", async () => {
    const { add, vote, remove, sylent, nova } = await setUp();
    await add(sylent);
    await vote(nova, 730, "up");
    expect(await remove(sylent, 730)).toMatchObject({
      status: 200,
      body: { games: [] },
    });
  });

  it("refuses a friend who didn't add the game", async () => {
    const { add, remove, sylent, nova } = await setUp();
    await add(sylent);
    expect(await remove(nova, 730)).toEqual({
      status: 403,
      body: { error: "not-allowed" },
    });
  });

  it("lets the admin remove any game", async () => {
    const { add, remove, nova, admin } = await setUp();
    await add(nova);
    expect((await remove(admin, 730)).body.games).toEqual([]);
  });

  it("says when the game is no longer in the bag", async () => {
    const { remove, sylent } = await setUp();
    expect(await remove(sylent, 730)).toEqual({
      status: 404,
      body: { error: "game-not-found" },
    });
  });
});
