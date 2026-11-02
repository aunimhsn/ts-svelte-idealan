// What the functions of the bag share to read a request and answer it (docs/technical-choices.md,
// Functions): the method, the access code, the player, a small JSON body, and an error code with
// its HTTP status, that the interface turns into a French message.
import type { BagView, Role } from "../../src/lib/bag";
import { checkAccess, type Environment } from "./access";
import { BAG_KEY, readBag, viewOfBag } from "./bag";
import {
  checkPlayer,
  PLAYERS_KEY,
  readPlayers,
  type Player,
  type Players,
} from "./players";
import type { JsonStore } from "./store";

// The headers that carry who acts, after the welcome: the id of the player and their personal
// code, checked again by every function (decided by the owner on 2026-11-01).
export const PLAYER_ID_HEADER = "x-player-id";
export const PLAYER_CODE_HEADER = "x-player-code";

// A body of the bag is a few fields: anything larger is refused before being read as JSON.
const MAX_BODY_LENGTH = 2048;

const STATUS_OF_PLAYER_ERROR = {
  "unknown-player": 401,
  "personal-code-reset": 401,
  "wrong-personal-code": 401,
  "player-locked": 423,
  "player-busy": 429,
} as const;

// The answer to a refusal of a player, shared with `enter`. `player-busy` says when to try again:
// the other calls of the player are settled within seconds.
export const playerRefusalResponse = (
  error: keyof typeof STATUS_OF_PLAYER_ERROR,
) =>
  errorResponse(
    error,
    STATUS_OF_PLAYER_ERROR[error],
    error === "player-busy" ? { "retry-after": "2" } : undefined,
  );

export const errorResponse = (
  error: string,
  status: number,
  headers?: Record<string, string>,
) => Response.json({ error }, { status, headers });

export const viewResponse = (view: BagView) => Response.json(view);

// Checks the method, then the access code: what every function does before anything else.
export const checkRequest = (
  request: Request,
  env: Environment,
  method: "GET" | "POST",
): { ok: true; role: Role } | { ok: false; response: Response } => {
  if (request.method !== method) {
    return {
      ok: false,
      response: errorResponse("method-not-allowed", 405, { allow: method }),
    };
  }
  const access = checkAccess(request, env);
  return access.ok
    ? { ok: true, role: access.role }
    : { ok: false, response: errorResponse(access.error, access.status) };
};

export interface Session {
  role: Role;
  player: Player;
  players: Players;
}

// Checks the method, the access code, then the player who acts.
export const openSession = async (
  request: Request,
  env: Environment,
  store: JsonStore,
  method: "GET" | "POST",
): Promise<
  { ok: true; session: Session } | { ok: false; response: Response }
> => {
  const checked = checkRequest(request, env, method);
  if (!checked.ok) return checked;
  const result = await checkPlayer(
    store,
    request.headers.get(PLAYER_ID_HEADER) ?? "",
    request.headers.get(PLAYER_CODE_HEADER) ?? "",
  );
  if (!result.ok) {
    return {
      ok: false,
      response: playerRefusalResponse(result.error),
    };
  }
  return {
    ok: true,
    session: {
      role: checked.role,
      player: result.player,
      players: result.players,
    },
  };
};

// The JSON object of the body, or null when it is missing, too large or not an object.
export const readBody = async (
  request: Request,
): Promise<Record<string, unknown> | null> => {
  // The announced length first, so that a large body is never read.
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_LENGTH) {
    return null;
  }
  const text = await request.text();
  if (text.length > MAX_BODY_LENGTH) return null;
  try {
    const body: unknown = JSON.parse(text);
    return typeof body === "object" && body !== null && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
};

// The bag as it stands, for the session.
export const currentView = async (store: JsonStore, session: Session) =>
  viewOfBag(
    readBag(await store.getJSON(BAG_KEY)),
    session.players,
    session.player,
    session.role,
  );

// The bag as it stands, the players read again after a change: the player who acts may have been
// renamed. With the players read, for the settings.
export const freshView = async (
  store: JsonStore,
  session: Session,
): Promise<{ view: BagView; players: Players }> => {
  const [bag, players] = await Promise.all([
    store.getJSON(BAG_KEY).then(readBag),
    store.getJSON(PLAYERS_KEY).then(readPlayers),
  ]);
  const me =
    players.list.find((player) => player.id === session.player.id) ??
    session.player;
  return { view: viewOfBag(bag, players, me, session.role), players };
};

// Runs a function and turns what it didn't expect (Blobs down, a store too busy, a bug) into
// `server-error`, logged for the owner, rather than a page of Netlify.
export const withServerErrors =
  <Args extends unknown[]>(handler: (...args: Args) => Promise<Response>) =>
  async (...args: Args): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error("The function failed.", error);
      return errorResponse("server-error", 500);
    }
  };
