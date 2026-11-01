// Removes a game from the bag (specs.md, The bag): POST /api/remove-game with { appid }, the
// access code and the player in the headers. A friend removes the games they added; the admin,
// any game. Its votes go with it. Answers the bag.
import type { Config, Context } from "@netlify/functions";
import type { Environment } from "../lib/access";
import { BAG_KEY, readBag, viewOfBag, type Bag } from "../lib/bag";
import {
  errorResponse,
  openSession,
  readBody,
  viewResponse,
  withServerErrors,
} from "../lib/http";
import { openStore, updateJSON, type JsonStore } from "../lib/store";

const STATUS_OF_ERROR = {
  "game-not-found": 404,
  "not-allowed": 403,
} as const;

export const handleRemoveGame = async (
  request: Request,
  env: Environment,
  store: JsonStore,
): Promise<Response> => {
  const opened = await openSession(request, env, store, "POST");
  if (!opened.ok) return opened.response;
  const { session } = opened;
  const body = await readBody(request);
  const appid = body?.appid;
  if (!Number.isSafeInteger(appid)) {
    return errorResponse("invalid-request", 400);
  }
  const removed = await updateJSON<
    { ok: true; bag: Bag } | { ok: false; error: keyof typeof STATUS_OF_ERROR }
  >(store, BAG_KEY, (current) => {
    const bag = readBag(current);
    const game = bag.games.find((candidate) => candidate.appid === appid);
    if (game === undefined) {
      return {
        result: { ok: false, error: "game-not-found" },
      };
    }
    if (game.addedBy !== session.player.id && session.role !== "admin") {
      return { result: { ok: false, error: "not-allowed" } };
    }
    const next = {
      games: bag.games.filter((candidate) => candidate !== game),
    };
    return { write: next, result: { ok: true, bag: next } };
  });
  if (!removed.ok) {
    return errorResponse(removed.error, STATUS_OF_ERROR[removed.error]);
  }
  return viewResponse(
    viewOfBag(removed.bag, session.players, session.player, session.role),
  );
};

export default withServerErrors((request: Request, context: Context) =>
  handleRemoveGame(request, process.env, openStore(context)),
);

export const config: Config = { path: "/api/remove-game" };
