import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  config as deletePlayerConfig,
  handleDeletePlayer,
} from "../functions/delete-player";
import {
  config as emptyBagConfig,
  handleEmptyBag,
} from "../functions/empty-bag";
import { handleEnter } from "../functions/enter";
import { handleGetBag } from "../functions/get-bag";
import { handleVote } from "../functions/vote";
import {
  config as getSettingsConfig,
  handleGetSettings,
} from "../functions/get-settings";
import {
  config as giveBackRenamesConfig,
  handleGiveBackRenames,
} from "../functions/give-back-renames";
import {
  config as renamePlayerConfig,
  handleRenamePlayer,
} from "../functions/rename-player";
import {
  config as renameSelfConfig,
  handleRenameSelf,
} from "../functions/rename-self";
import {
  config as resetPlayerCodeConfig,
  handleResetPlayerCode,
} from "../functions/reset-player-code";
import type { BagGame, BagView } from "../../src/lib/bag";
import { ACCESS_CODE_HEADER } from "../lib/access";
import { BAG_KEY } from "../lib/bag";
import { PLAYER_CODE_HEADER, PLAYER_ID_HEADER } from "../lib/http";
import { attemptsKey, MAX_FAILURES, PLAYERS_KEY } from "../lib/players";
import { renameSelf } from "../lib/renames";
import type { JsonStore } from "../lib/store";
import { memoryStore } from "./memory-store";

const env = { MEMBER_CODE: "member-test-code", ADMIN_CODE: "admin-test-code" };
const NOW = new Date("2026-11-07T18:00:00Z");

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

const game = (
  appid: number,
  addedBy: string,
  votes: BagGame["votes"],
): BagGame => ({
  appid,
  name: `Game ${appid}`,
  cover: null,
  categories: [],
  genres: [],
  maxPlayers: null,
  addedBy,
  addedAt: NOW.toISOString(),
  votes,
});

// Sylent (j1, 1234, the admin), Nova (j2, 0000) and Krak (j3, 5555); a game of each of Nova
// and Sylent, with the votes of the others.
const setUp = async () => {
  const memory = memoryStore();
  const enter = (nickname: string, code: string) =>
    handleEnter(
      request("enter", "POST", { nickname, code }),
      env,
      memory.store,
      NOW,
    ).then(answer);
  await enter("Sylent", "1234");
  await enter("Nova", "0000");
  await enter("Krak", "5555");
  memory.write(BAG_KEY, {
    games: [
      game(10, "j2", { j2: "up", j1: "up", j3: "up" }),
      game(20, "j1", { j1: "up", j2: "up" }),
    ],
  });
  const admin = { code: "admin-test-code", player: "j1", personalCode: "1234" };
  const member = { player: "j2", personalCode: "0000" };
  const call =
    (
      path: string,
      handler: (
        request: Request,
        env: Record<string, string>,
        store: JsonStore,
      ) => Promise<Response>,
    ) =>
    (as: As, body?: unknown) =>
      handler(
        request(path, body === undefined ? "GET" : "POST", body, as),
        env,
        memory.store,
      ).then(answer);
  return {
    ...memory,
    enter,
    admin,
    member,
    getSettings: call("get-settings", handleGetSettings),
    rename: call("rename-player", (request, env, store) =>
      handleRenamePlayer(request, env, store, NOW),
    ),
    renameSelf: call("rename-self", (request, env, store) =>
      handleRenameSelf(request, env, store, NOW),
    ),
    giveBack: call("give-back-renames", handleGiveBackRenames),
    reset: call("reset-player-code", handleResetPlayerCode),
    remove: call("delete-player", handleDeletePlayer),
    empty: call("empty-bag", handleEmptyBag),
    getBag: call("get-bag", handleGetBag),
    vote: call("vote", handleVote),
  };
};

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

describe("the addresses", () => {
  it.each([
    [getSettingsConfig, "/api/get-settings"],
    [renamePlayerConfig, "/api/rename-player"],
    [renameSelfConfig, "/api/rename-self"],
    [giveBackRenamesConfig, "/api/give-back-renames"],
    [resetPlayerCodeConfig, "/api/reset-player-code"],
    [deletePlayerConfig, "/api/delete-player"],
    [emptyBagConfig, "/api/empty-bag"],
  ])("answers on %j", (config, path) => {
    expect(config.path).toBe(path);
  });
});

describe("the admin only", () => {
  it("refuses a member before changing anything", async () => {
    const bag = await setUp();
    const kept = () => [bag.data.get(BAG_KEY), bag.data.get(PLAYERS_KEY)];
    const before = structuredClone(kept());
    for (const [run, body] of [
      [bag.getSettings, undefined],
      [bag.rename, { id: "j3", nickname: "Zed" }],
      [bag.giveBack, { id: "j3" }],
      [bag.reset, { id: "j3" }],
      [bag.remove, { id: "j3" }],
      [bag.empty, { appids: [10, 20] }],
    ] as const) {
      expect(await run(bag.member, body)).toEqual({
        status: 403,
        body: { error: "admin-only" },
      });
    }
    expect(kept()).toEqual(before);
  });

  it("checks the admin's personal code first", async () => {
    const bag = await setUp();
    expect(
      await bag.getSettings({ ...bag.admin, personalCode: "9999" }),
    ).toMatchObject({ status: 401, body: { error: "wrong-personal-code" } });
  });

  it("refuses a body without a valid id", async () => {
    const bag = await setUp();
    for (const body of [{}, { id: "x1" }, { id: 3 }, { id: "j0" }]) {
      expect(await bag.reset(bag.admin, body)).toMatchObject({
        status: 400,
        body: { error: "invalid-request" },
      });
    }
  });
});

describe("get-settings", () => {
  it("answers the bag with the state of each account", async () => {
    const bag = await setUp();
    bag.write(attemptsKey("j3"), { failures: MAX_FAILURES, pending: [] });
    const players = bag.data.get(PLAYERS_KEY) as {
      list: { id: string; codeHash: string | null }[];
    };
    players.list[1]!.codeHash = null;
    const { status, body } = await bag.getSettings(bag.admin);
    expect(status).toBe(200);
    expect(body.games).toHaveLength(2);
    expect(body.accounts).toEqual([
      { id: "j1", nickname: "Sylent", state: "active", renames: 0 },
      { id: "j2", nickname: "Nova", state: "reset", renames: 0 },
      { id: "j3", nickname: "Krak", state: "locked", renames: 0 },
    ]);
  });

  it("never sends the accounts to the other functions", async () => {
    const bag = await setUp();
    const { body } = await bag.getBag(bag.admin);
    expect(body.accounts).toBeUndefined();
  });
});

describe("rename-player", () => {
  it("renames a player; their games and votes follow their id", async () => {
    const bag = await setUp();
    const { status, body } = await bag.rename(bag.admin, {
      id: "j2",
      nickname: "nova2",
    });
    expect(status).toBe(200);
    expect(body.players).toContainEqual({ id: "j2", nickname: "Nova2" });
    expect(body.accounts).toContainEqual({
      id: "j2",
      nickname: "Nova2",
      state: "active",
      renames: 0,
    });
    expect(body.games[0]?.addedBy).toBe("j2");
    // The friend renamed keeps their session: their id and code are unchanged.
    expect((await bag.getBag(bag.member)).body.me.nickname).toBe("Nova2");
  });

  it("answers the admin's new nickname when they rename themself", async () => {
    const bag = await setUp();
    const { body } = await bag.rename(bag.admin, {
      id: "j1",
      nickname: "Sylent2",
    });
    expect(body.me).toEqual({ id: "j1", nickname: "Sylent2" });
  });

  it("refuses a nickname taken by another player, without case", async () => {
    const bag = await setUp();
    expect(await bag.rename(bag.admin, { id: "j2", nickname: "KRAK" })).toEqual(
      { status: 409, body: { error: "nickname-taken" } },
    );
  });

  it("lets a player change the capitals of their own nickname", async () => {
    const bag = await setUp();
    const { body } = await bag.rename(bag.admin, {
      id: "j3",
      nickname: "KRAK",
    });
    expect(body.players).toContainEqual({ id: "j3", nickname: "KRAK" });
  });

  it("refuses a nickname against the rules", async () => {
    const bag = await setUp();
    for (const nickname of ["No", "Nova 2", "Éric", 42]) {
      expect(await bag.rename(bag.admin, { id: "j2", nickname })).toEqual({
        status: 400,
        body: { error: "invalid-nickname" },
      });
    }
  });

  it("refuses a player who is not there", async () => {
    const bag = await setUp();
    expect(await bag.rename(bag.admin, { id: "j9", nickname: "Zed" })).toEqual({
      status: 404,
      body: { error: "player-not-found" },
    });
  });
});

describe("reset-player-code", () => {
  it("unlocks a nickname; the next entry chooses its new code", async () => {
    const bag = await setUp();
    bag.write(attemptsKey("j3"), { failures: MAX_FAILURES, pending: [] });
    expect((await bag.enter("Krak", "5555")).body.error).toBe("player-locked");
    const { body } = await bag.reset(bag.admin, { id: "j3" });
    expect(body.accounts).toContainEqual({
      id: "j3",
      nickname: "Krak",
      state: "reset",
      renames: 0,
    });
    expect(bag.data.has(attemptsKey("j3"))).toBe(false);
    // The old code no longer opens the bag: the friend is sent back to the welcome.
    expect(
      (await bag.getBag({ player: "j3", personalCode: "5555" })).body.error,
    ).toBe("personal-code-reset");
    const entered = await bag.enter("Krak", "7777");
    expect(entered.body.me).toEqual({ id: "j3", nickname: "Krak" });
    const settings = await bag.getSettings(bag.admin);
    expect(settings.body.accounts).toContainEqual({
      id: "j3",
      nickname: "Krak",
      state: "active",
      renames: 0,
    });
  });

  it("never resets the admin's own code", async () => {
    const bag = await setUp();
    expect(await bag.reset(bag.admin, { id: "j1" })).toEqual({
      status: 409,
      body: { error: "cannot-reset-self" },
    });
  });

  it("refuses a player who is not there", async () => {
    const bag = await setUp();
    expect(await bag.reset(bag.admin, { id: "j9" })).toEqual({
      status: 404,
      body: { error: "player-not-found" },
    });
  });
});

describe("delete-player", () => {
  it("deletes a player with their games, their votes and their tries", async () => {
    const bag = await setUp();
    bag.write(attemptsKey("j2"), { failures: 2, pending: [] });
    const { status, body } = await bag.remove(bag.admin, { id: "j2" });
    expect(status).toBe(200);
    expect(body.players.map((player) => player.id)).toEqual(["j1", "j3"]);
    expect(body.accounts?.map((account) => account.id)).toEqual(["j1", "j3"]);
    // Nova's game is gone; their vote on Sylent's game too.
    expect(body.games).toEqual([game(20, "j1", { j1: "up" })]);
    expect(bag.data.has(attemptsKey("j2"))).toBe(false);
    expect((await bag.getBag(bag.member)).body.error).toBe("unknown-player");
  });

  it("never reuses the id of a player deleted", async () => {
    const bag = await setUp();
    await bag.remove(bag.admin, { id: "j3" });
    expect((await bag.enter("Zed", "1111")).body.me.id).toBe("j4");
  });

  it("cleans the bag of a player already gone, to finish a deletion halfway", async () => {
    const bag = await setUp();
    const players = bag.data.get(PLAYERS_KEY) as { list: { id: string }[] };
    players.list = players.list.filter((player) => player.id !== "j2");
    const { status, body } = await bag.remove(bag.admin, { id: "j2" });
    expect(status).toBe(200);
    expect(body.games).toEqual([game(20, "j1", { j1: "up" })]);
  });

  it("cleans the games and votes of every player gone, not only this one", async () => {
    const bag = await setUp();
    // A vote and a game left by a player deleted before (j7).
    bag.write(BAG_KEY, {
      games: [
        game(10, "j2", { j2: "up", j7: "up" }),
        game(30, "j7", { j7: "up" }),
        game(20, "j1", { j1: "up" }),
      ],
    });
    const { body } = await bag.remove(bag.admin, { id: "j3" });
    expect(body.games).toEqual([
      game(10, "j2", { j2: "up" }),
      game(20, "j1", { j1: "up" }),
    ]);
  });

  it("leaves no vote of a player deleted while their vote was being written", async () => {
    const bag = await setUp();
    let deleted = false;
    // Nova's vote has passed the check of their code; the admin deletes Nova just before the
    // vote is written: the vote is tried again, and refused.
    bag.onBeforeWrite((key) => {
      if (key !== BAG_KEY || deleted) return;
      deleted = true;
      const players = structuredClone(bag.data.get(PLAYERS_KEY)) as {
        list: { id: string }[];
      };
      players.list = players.list.filter((player) => player.id !== "j2");
      bag.write(PLAYERS_KEY, players);
      bag.write(BAG_KEY, { games: [game(20, "j1", { j1: "up" })] });
    });
    expect(await bag.vote(bag.member, { appid: 20, vote: "up" })).toEqual({
      status: 401,
      body: { error: "unknown-player" },
    });
    expect(bag.data.get(BAG_KEY)).toEqual({
      games: [game(20, "j1", { j1: "up" })],
    });
  });

  it("never deletes the admin themself", async () => {
    const bag = await setUp();
    expect(await bag.remove(bag.admin, { id: "j1" })).toEqual({
      status: 409,
      body: { error: "cannot-delete-self" },
    });
  });
});

describe("empty-bag", () => {
  it("removes the games sent and keeps the others with their votes", async () => {
    const bag = await setUp();
    const { status, body } = await bag.empty(bag.admin, { appids: [20] });
    expect(status).toBe(200);
    expect(body.games).toEqual([
      game(10, "j2", { j2: "up", j1: "up", j3: "up" }),
    ]);
    expect(body.accounts).toBeUndefined();
    expect(bag.data.get(BAG_KEY)).toEqual({ games: body.games });
    // The players stay.
    expect(body.players.map((player) => player.id)).toEqual(["j1", "j2", "j3"]);
  });

  it("keeps a game added after the admin chose, since it isn't sent", async () => {
    const bag = await setUp();
    const stored = bag.data.get(BAG_KEY) as { games: BagGame[] };
    bag.write(BAG_KEY, { games: [...stored.games, game(30, "j3", {})] });
    const { body } = await bag.empty(bag.admin, { appids: [10, 20] });
    expect(body.games.map((kept) => kept.appid)).toEqual([30]);
  });

  it("skips a game already gone, without writing the bag", async () => {
    const bag = await setUp();
    const before = structuredClone(bag.data.get(BAG_KEY));
    const { status, body } = await bag.empty(bag.admin, { appids: [99] });
    expect(status).toBe(200);
    expect(body.games).toHaveLength(2);
    expect(bag.data.get(BAG_KEY)).toEqual(before);
  });

  it("refuses a list that isn't 1 to 50 distinct appids", async () => {
    const bag = await setUp();
    const many = Array.from({ length: 51 }, (_, index) => index + 1);
    for (const body of [
      {},
      { appids: [] },
      { appids: 10 },
      { appids: [10, 10] },
      { appids: [0] },
      { appids: [-3] },
      { appids: [1.5] },
      { appids: ["10"] },
      { appids: many },
    ]) {
      expect(await bag.empty(bag.admin, body)).toEqual({
        status: 400,
        body: { error: "invalid-request" },
      });
    }
  });
});

describe("rename-self", () => {
  const krak = { player: "j3", personalCode: "5555" };

  it("renames the friend, counts it and logs it; they keep their session", async () => {
    const bag = await setUp();
    const { status, body } = await bag.renameSelf(bag.member, {
      nickname: "pixel",
    });
    expect(status).toBe(200);
    expect(body.me).toEqual({ id: "j2", nickname: "Pixel" });
    expect(body.renames).toBe(1);
    expect(body.accounts).toBeUndefined();
    expect(body.journal).toBeUndefined();
    expect(body.games[0]?.addedBy).toBe("j2");
    expect((await bag.getBag(bag.member)).body).toMatchObject({
      me: { id: "j2", nickname: "Pixel" },
      renames: 1,
    });
    expect((await bag.getSettings(bag.admin)).body.journal).toEqual([
      { id: "j2", from: "Nova", to: "Pixel", at: NOW.toISOString(), used: 1 },
    ]);
  });

  it("refuses a fourth rename, until the admin gives the 3 back", async () => {
    const bag = await setUp();
    for (const nickname of ["Nova1", "Nova2", "Nova3"]) {
      expect((await bag.renameSelf(bag.member, { nickname })).status).toBe(200);
    }
    expect(await bag.renameSelf(bag.member, { nickname: "Nova4" })).toEqual({
      status: 409,
      body: { error: "no-renames-left" },
    });
    const given = await bag.giveBack(bag.admin, { id: "j2" });
    expect(given.status).toBe(200);
    expect(given.body.accounts).toContainEqual({
      id: "j2",
      nickname: "Nova3",
      state: "active",
      renames: 0,
    });
    const { body } = await bag.renameSelf(bag.member, { nickname: "Nova4" });
    expect(body).toMatchObject({ me: { nickname: "Nova4" }, renames: 1 });
    expect(
      (await bag.getSettings(bag.admin)).body.journal?.map(
        (entry) => entry.used,
      ),
    ).toEqual([1, 3, 2, 1]);
  });

  it("counts other capitals as a rename, the same nickname exactly as nothing", async () => {
    const bag = await setUp();
    expect(
      (await bag.renameSelf(bag.member, { nickname: "Nova" })).body,
    ).toMatchObject({ renames: 0 });
    expect(
      (await bag.renameSelf(bag.member, { nickname: "NOVA" })).body,
    ).toMatchObject({ me: { nickname: "NOVA" }, renames: 1 });
  });

  it("refuses a nickname taken by another player, without case", async () => {
    const bag = await setUp();
    expect(await bag.renameSelf(krak, { nickname: "nova" })).toEqual({
      status: 409,
      body: { error: "nickname-taken" },
    });
    expect((await bag.getBag(krak)).body.renames).toBe(0);
  });

  it("refuses a nickname against the rules", async () => {
    const bag = await setUp();
    for (const body of [{}, { nickname: "No" }, { nickname: "Éric" }]) {
      expect(await bag.renameSelf(bag.member, body)).toEqual({
        status: 400,
        body: { error: "invalid-nickname" },
      });
    }
  });

  it("doesn't count a rename of the admin by this function", async () => {
    const bag = await setUp();
    const { body } = await bag.renameSelf(bag.admin, { nickname: "Sylent2" });
    expect(body).toMatchObject({ me: { nickname: "Sylent2" }, renames: 0 });
    expect(body.journal).toBeUndefined();
    expect(
      (await bag.getSettings(bag.admin)).body.journal?.[0]?.used,
    ).toBeNull();
  });

  it("answers unknown-player for a friend deleted meanwhile", async () => {
    const bag = await setUp();
    expect(await renameSelf(bag.store, "j9", "Pixel", NOW)).toBe(
      "unknown-player",
    );
  });

  it("checks the friend's personal code first", async () => {
    const bag = await setUp();
    expect(
      await bag.renameSelf(
        { ...bag.member, personalCode: "9999" },
        { nickname: "Pixel" },
      ),
    ).toMatchObject({ status: 401, body: { error: "wrong-personal-code" } });
  });
});

describe("the renames by the admin", () => {
  it("logs a rename by the admin without counting it", async () => {
    const bag = await setUp();
    const { body } = await bag.rename(bag.admin, { id: "j2", nickname: "Zed" });
    expect(body.journal).toEqual([
      { id: "j2", from: "Nova", to: "Zed", at: NOW.toISOString(), used: null },
    ]);
    expect(body.accounts).toContainEqual({
      id: "j2",
      nickname: "Zed",
      state: "active",
      renames: 0,
    });
  });

  it("keeps the journal through a reset of a code and the next entry", async () => {
    const bag = await setUp();
    await bag.rename(bag.admin, { id: "j2", nickname: "Zed" });
    await bag.reset(bag.admin, { id: "j2" });
    expect((await bag.enter("Zed", "4321")).status).toBe(200);
    expect((await bag.getSettings(bag.admin)).body.journal).toHaveLength(1);
  });

  it("keeps the journal when a new friend enters", async () => {
    const bag = await setUp();
    await bag.rename(bag.admin, { id: "j2", nickname: "Zed" });
    await bag.enter("Mira", "2222");
    expect((await bag.getSettings(bag.admin)).body.journal).toHaveLength(1);
  });

  it("keeps the last 100 renames, the newest first", async () => {
    const bag = await setUp();
    for (let index = 0; index < 101; index++) {
      await bag.rename(bag.admin, {
        id: "j3",
        nickname: index % 2 === 0 ? "Krak2" : "Krak",
      });
    }
    const { journal } = (await bag.getSettings(bag.admin)).body;
    expect(journal).toHaveLength(100);
    expect(journal?.[0]).toMatchObject({ from: "Krak", to: "Krak2" });
  });

  it("removes the lines of a player deleted from the journal", async () => {
    const bag = await setUp();
    await bag.rename(bag.admin, { id: "j2", nickname: "Zed" });
    await bag.rename(bag.admin, { id: "j3", nickname: "Krak2" });
    const { body } = await bag.remove(bag.admin, { id: "j2" });
    expect(body.journal?.map((entry) => entry.id)).toEqual(["j3"]);
  });

  it("refuses to give back the renames of a player who is not there", async () => {
    const bag = await setUp();
    expect(await bag.giveBack(bag.admin, { id: "j9" })).toEqual({
      status: 404,
      body: { error: "player-not-found" },
    });
  });
});
