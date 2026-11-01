import { describe, expect, it, vi } from "vitest";
import { createApi, type Credentials } from "./api";
import type { BagView } from "./bag";

const view: BagView = {
  role: "member",
  me: { id: "j1", nickname: "Nova" },
  players: [{ id: "j1", nickname: "Nova" }],
  games: [],
};

const credentials: Credentials = {
  accessCode: "member-code",
  playerId: "j1",
  personalCode: "1234",
};

const errorAnswer = (
  error: string,
  status: number,
  headers?: Record<string, string>,
) => Response.json({ error }, { status, headers });

describe("createApi", () => {
  it("sends the access code, the player and the body, and answers the bag", async () => {
    const fetcher = vi.fn(async () => Response.json(view));
    const api = createApi({ fetcher });
    const result = await api.addGame(
      () => credentials,
      "https://store.steampowered.com/app/730/",
      4,
    );
    expect(result).toEqual({ ok: true, view });
    const [path, init] = fetcher.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(path).toBe("/api/add-game");
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      "x-access-code": "member-code",
      "x-player-id": "j1",
      "x-player-code": "1234",
    });
    expect(JSON.parse(init.body as string)).toEqual({
      link: "https://store.steampowered.com/app/730/",
      maxPlayers: 4,
    });
  });

  it("answers the error code of the function", async () => {
    const api = createApi({
      fetcher: async () => errorAnswer("bag-full", 409),
    });
    expect(await api.getBag(() => credentials)).toEqual({
      ok: false,
      error: "bag-full",
    });
  });

  it("turns no answer, or an answer that isn't the function's, into server-unreachable", async () => {
    const down = createApi({
      fetcher: async () => {
        throw new TypeError("Failed to fetch");
      },
    });
    expect(await down.getBag(() => credentials)).toEqual({
      ok: false,
      error: "server-unreachable",
    });
    const page = createApi({
      fetcher: async () => new Response("<html>502</html>", { status: 502 }),
    });
    expect(await page.getBag(() => credentials)).toEqual({
      ok: false,
      error: "server-unreachable",
    });
  });

  it("turns an unexpected answer into server-error", async () => {
    const api = createApi({ fetcher: async () => Response.json({ games: 1 }) });
    expect(await api.getBag(() => credentials)).toEqual({
      ok: false,
      error: "server-error",
    });
  });

  it("refuses an access code that a header can't carry, without calling", async () => {
    const fetcher = vi.fn(async () => Response.json(view));
    const api = createApi({ fetcher });
    expect(await api.enter("code☺", "Nova", "1234")).toEqual({
      ok: false,
      error: "wrong-access-code",
    });
    expect(await api.enter("code\nx", "Nova", "1234")).toEqual({
      ok: false,
      error: "wrong-access-code",
    });
    expect(fetcher).not.toHaveBeenCalled();
    // The Latin letters up to U+00FF are carried.
    expect(await api.enter("café", "Nova", "1234")).toEqual({
      ok: true,
      view,
    });
  });

  it("tries player-busy again after its retry-after, a few times at most", async () => {
    const wait = vi.fn(async () => undefined);
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        errorAnswer("player-busy", 429, { "retry-after": "3" }),
      )
      .mockResolvedValueOnce(Response.json(view));
    const api = createApi({ fetcher, wait });
    expect(await api.getBag(() => credentials)).toEqual({ ok: true, view });
    expect(wait).toHaveBeenCalledWith(3000);

    const busy = vi.fn(async () =>
      errorAnswer("player-busy", 429, { "retry-after": "2" }),
    );
    const stuck = createApi({ fetcher: busy, wait });
    expect(await stuck.getBag(() => credentials)).toEqual({
      ok: false,
      error: "player-busy",
    });
    expect(busy).toHaveBeenCalledTimes(4);
  });

  it("sends one call at a time, in the order asked", async () => {
    const order: string[] = [];
    const answers: Array<() => void> = [];
    const fetcher = vi.fn(
      (path: string | URL | Request) =>
        new Promise<Response>((resolve) => {
          order.push(`sent ${String(path)}`);
          answers.push(() => resolve(Response.json(view)));
        }),
    );
    const api = createApi({ fetcher });
    const first = api.getBag(() => credentials);
    const second = api.addGame(() => credentials, "link", null);
    expect(api.pending).toBe(2);
    await vi.waitFor(() => expect(order).toEqual(["sent /api/get-bag"]));
    answers[0]?.();
    await first;
    await vi.waitFor(() =>
      expect(order).toEqual(["sent /api/get-bag", "sent /api/add-game"]),
    );
    answers[1]?.();
    await second;
    expect(api.pending).toBe(0);
  });

  it("reads the credentials when the call is sent: a forgotten code is never sent", async () => {
    let current: Credentials | null = credentials;
    let answer: (() => void) | undefined;
    const fetcher = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          answer = () => resolve(errorAnswer("wrong-personal-code", 401));
        }),
    );
    const api = createApi({ fetcher });
    const first = api.getBag(() => current);
    const second = api.getBag(() => current);
    await vi.waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));
    // The first answer refuses the player: the session forgets the code before the second call.
    current = null;
    answer?.();
    expect(await first).toEqual({ ok: false, error: "wrong-personal-code" });
    expect(await second).toEqual({ ok: false, error: "no-session" });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("never sends refused credentials again, until the friend enters anew", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(errorAnswer("player-locked", 423))
      .mockResolvedValueOnce(Response.json(view))
      .mockResolvedValueOnce(Response.json(view));
    const api = createApi({ fetcher });
    expect(await api.getBag(() => credentials)).toEqual({
      ok: false,
      error: "player-locked",
    });
    expect(await api.getBag(() => credentials)).toEqual({
      ok: false,
      error: "no-session",
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(await api.enter("member-code", "Nova", "1234")).toEqual({
      ok: true,
      view,
    });
    expect(await api.getBag(() => credentials)).toEqual({ ok: true, view });
    expect(fetcher).toHaveBeenCalledTimes(3);
  });

  it("doesn't try player-busy again once the session is forgotten", async () => {
    let current: Credentials | null = credentials;
    const fetcher = vi.fn(async () =>
      errorAnswer("player-busy", 429, { "retry-after": "2" }),
    );
    const wait = vi.fn(async () => {
      current = null;
    });
    const api = createApi({ fetcher, wait });
    expect(await api.getBag(() => current)).toEqual({
      ok: false,
      error: "no-session",
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
