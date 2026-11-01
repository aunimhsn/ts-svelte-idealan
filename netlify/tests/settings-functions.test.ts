import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  config as deletePlayerConfig,
  handleDeletePlayer,
} from "../functions/delete-player";
import { handleEnter } from "../functions/enter";
import { handleGetBag } from "../functions/get-bag";
import {
  config as getSettingsConfig,
  handleGetSettings,
} from "../functions/get-settings";
import {
  config as renamePlayerConfig,
  handleRenamePlayer,
} from "../functions/rename-player";
import {
  config as resetPlayerCodeConfig,
  handleResetPlayerCode,
} from "../functions/reset-player-code";
import type { BagGame, BagView } from "../../src/lib/bag";
import { ACCESS_CODE_HEADER } from "../lib/access";
import { BAG_KEY } from "../lib/bag";
import { PLAYER_CODE_HEADER, PLAYER_ID_HEADER } from "../lib/http";
import { attemptsKey, MAX_FAILURES, PLAYERS_KEY } from "../lib/players";
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
      game(10, "j2", { j2: "up", j1: "up", j3: "down" }),
      game(20, "j1", { j1: "up", j2: "down" }),
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
    rename: call("rename-player", handleRenamePlayer),
    reset: call("reset-player-code", handleResetPlayerCode),
    remove: call("delete-player", handleDeletePlayer),
    getBag: call("get-bag", handleGetBag),
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
    [resetPlayerCodeConfig, "/api/reset-player-code"],
    [deletePlayerConfig, "/api/delete-player"],
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
      [bag.reset, { id: "j3" }],
      [bag.remove, { id: "j3" }],
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
      { id: "j1", nickname: "Sylent", state: "active" },
      { id: "j2", nickname: "Nova", state: "reset" },
      { id: "j3", nickname: "Krak", state: "locked" },
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

  it("never deletes the admin themself", async () => {
    const bag = await setUp();
    expect(await bag.remove(bag.admin, { id: "j1" })).toEqual({
      status: 409,
      body: { error: "cannot-delete-self" },
    });
  });
});
