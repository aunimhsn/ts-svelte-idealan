// The calls of the interface to the functions of the bag (docs/technical-choices.md, Functions).
// One call at a time, in the order they are asked: a friend's calls never race each other, so
// that a burst of them can't spend the tries of their personal code (the reviews of step 6a).
// The credentials are read when a call is sent, not when it is asked; and credentials once refused
// are never sent again until the friend enters anew: a call waiting behind a refusal is dropped,
// even before the interface has forgotten the personal code.
import type { BagView } from "./bag";

export interface Credentials {
  accessCode: string;
  playerId: string;
  personalCode: string;
}

// The credentials of the session as they are when the call is sent, or null once forgotten.
export type CredentialsOf = () => Credentials | null;

// An error code of a function, or of the interface itself: `server-unreachable` (no answer, or
// an answer that isn't the function's), `no-session` (the session was forgotten meanwhile).
export type ApiResult =
  { ok: true; view: BagView } | { ok: false; error: string };

// The refusals of a player (netlify/lib/players.ts): all but `player-busy` send the friend back
// to the welcome.
export const PLAYER_REFUSALS = new Set([
  "unknown-player",
  "personal-code-reset",
  "wrong-personal-code",
  "player-locked",
]);

// `player-busy`: other calls of the friend hold the last tries; tried again after `retry-after`.
const MAX_BUSY_RETRIES = 3;
const DEFAULT_RETRY_SECONDS = 2;
const MAX_RETRY_SECONDS = 10;

// A function lasts a few seconds, Steam included (8 seconds at most): past this, the call is
// given up, so that it never holds the calls behind it.
const TIMEOUT_MS = 25_000;

// A header carries only the characters up to U+00FF, without NUL, CR or LF: `fetch` throws on
// any other. A code typed with one (« ☺ ») can't be the right one.
const HEADER_SAFE = /^[^\0\r\nĀ-￿]*$/;

const ERROR_CODE = /^[a-z]+(?:-[a-z]+)*$/;

const isBagView = (value: unknown): value is BagView => {
  if (typeof value !== "object" || value === null) return false;
  const view = value as Record<string, unknown>;
  const me = view.me as Record<string, unknown> | null | undefined;
  return (
    (view.role === "member" || view.role === "admin") &&
    typeof me === "object" &&
    me !== null &&
    typeof me.id === "string" &&
    typeof me.nickname === "string" &&
    Array.isArray(view.players) &&
    Array.isArray(view.games)
  );
};

// The answer of a function: the bag, or its error code. An answer that isn't JSON comes from
// Netlify, not from the function (a timeout, a page of error).
const readAnswer = async (response: Response): Promise<ApiResult> => {
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return { ok: false, error: "server-unreachable" };
  }
  if (response.ok) {
    return isBagView(body)
      ? { ok: true, view: body }
      : { ok: false, error: "server-error" };
  }
  const error =
    typeof body === "object" && body !== null && "error" in body
      ? body.error
      : null;
  return typeof error === "string" && ERROR_CODE.test(error)
    ? { ok: false, error }
    : { ok: false, error: "server-error" };
};

// The seconds to wait before trying `player-busy` again, from its `retry-after`.
const retrySeconds = (response: Response) => {
  const seconds = Number(response.headers.get("retry-after"));
  return Number.isInteger(seconds) && seconds > 0
    ? Math.min(seconds, MAX_RETRY_SECONDS)
    : DEFAULT_RETRY_SECONDS;
};

interface Call {
  path: string;
  method: "GET" | "POST";
  headers: Record<string, string>;
  body?: Record<string, unknown>;
  // The credentials of a call of the session, as one text, to recognize them once refused.
  session?: string;
}

// The answers after which the credentials of a session are never sent again.
const endsSession = (error: string) =>
  PLAYER_REFUSALS.has(error) || error === "wrong-access-code";

export interface ApiDependencies {
  fetcher?: typeof fetch;
  wait?: (ms: number) => Promise<void>;
}

export const createApi = ({
  fetcher = (input, init) => fetch(input, init),
  wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
}: ApiDependencies = {}) => {
  let queue: Promise<unknown> = Promise.resolve();
  let pending = 0;
  const refused = new Set<string>();

  const send = async ({ path, method, headers, body }: Call) => {
    if (!Object.values(headers).every((value) => HEADER_SAFE.test(value))) {
      return { ok: false, error: "wrong-access-code" } as const;
    }
    for (let retry = 0; ; retry += 1) {
      let response: Response;
      try {
        response = await fetcher(path, {
          method,
          headers: {
            ...headers,
            ...(body ? { "content-type": "application/json" } : {}),
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });
      } catch {
        return { ok: false, error: "server-unreachable" } as const;
      }
      const result = await readAnswer(response);
      if (
        result.ok ||
        result.error !== "player-busy" ||
        retry >= MAX_BUSY_RETRIES
      ) {
        return result;
      }
      await wait(retrySeconds(response) * 1000);
    }
  };

  // Runs the call once the calls asked before it are settled. `call` gives the call to send, or
  // null when there is nothing to send anymore.
  const enqueue = (call: () => Call | null): Promise<ApiResult> => {
    pending += 1;
    const run = queue.then(async (): Promise<ApiResult> => {
      const ready = call();
      if (
        ready === null ||
        (ready.session !== undefined && refused.has(ready.session))
      ) {
        return { ok: false, error: "no-session" };
      }
      const result = await send(ready);
      // Settled here, before the next call of the queue is sent.
      if (
        ready.session !== undefined &&
        !result.ok &&
        endsSession(result.error)
      ) {
        refused.add(ready.session);
      }
      if (ready.session === undefined && result.ok) refused.clear();
      return result;
    });
    queue = run.catch(() => undefined);
    return run.finally(() => {
      pending -= 1;
    });
  };

  const sessionCall =
    (
      credentials: CredentialsOf,
      path: string,
      method: "GET" | "POST",
      body?: Record<string, unknown>,
    ) =>
    (): Call | null => {
      const current = credentials();
      return current === null
        ? null
        : {
            path,
            method,
            body,
            session: [
              current.accessCode,
              current.playerId,
              current.personalCode,
            ].join("\n"),
            headers: {
              "x-access-code": current.accessCode,
              "x-player-id": current.playerId,
              "x-player-code": current.personalCode,
            },
          };
    };

  return {
    // How many calls are asked and not settled yet.
    get pending() {
      return pending;
    },
    enter: (accessCode: string, nickname: string, code: string) =>
      enqueue(() => ({
        path: "/api/enter",
        method: "POST",
        headers: { "x-access-code": accessCode },
        body: { nickname, code },
      })),
    getBag: (credentials: CredentialsOf) =>
      enqueue(sessionCall(credentials, "/api/get-bag", "GET")),
    addGame: (
      credentials: CredentialsOf,
      link: string,
      maxPlayers: number | null,
    ) =>
      enqueue(
        sessionCall(credentials, "/api/add-game", "POST", { link, maxPlayers }),
      ),
  };
};

export type Api = ReturnType<typeof createApi>;
