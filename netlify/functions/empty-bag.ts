// Empties the bag (specs.md, Emptying the bag): POST /api/empty-bag with { appids }, the games to
// remove, the admin code and the admin in the headers. The games the admin saw unchecked are
// sent, not the ones kept: a game a friend adds while the panel is open stays in the bag. A game
// already gone is skipped. The games kept keep their votes; the players stay. Answers the bag.
import type { Config, Context } from "@netlify/functions";
import { MAX_GAMES } from "../../src/lib/bag";
import type { Environment } from "../lib/access";
import { BAG_KEY, readBag, viewOfBag, type Bag } from "../lib/bag";
import {
  errorResponse,
  readBody,
  viewResponse,
  withServerErrors,
} from "../lib/http";
import { openAdminSession } from "../lib/settings";
import { openStore, updateJSON, type JsonStore } from "../lib/store";

// The appids of the body: 1 to 50 positive whole numbers, each once; null otherwise.
export const appidsOf = (
  body: Record<string, unknown> | null,
): Set<number> | null => {
  const appids = body?.appids;
  if (
    !Array.isArray(appids) ||
    appids.length === 0 ||
    appids.length > MAX_GAMES ||
    !appids.every(
      (appid): appid is number => Number.isSafeInteger(appid) && appid > 0,
    )
  ) {
    return null;
  }
  const unique = new Set(appids);
  return unique.size === appids.length ? unique : null;
};

export const handleEmptyBag = async (
  request: Request,
  env: Environment,
  store: JsonStore,
): Promise<Response> => {
  const opened = await openAdminSession(request, env, store, "POST");
  if (!opened.ok) return opened.response;
  const { session } = opened;
  const appids = appidsOf(await readBody(request));
  if (appids === null) return errorResponse("invalid-request", 400);
  const bag = await updateJSON<Bag>(store, BAG_KEY, (current) => {
    const read = readBag(current);
    const games = read.games.filter((game) => !appids.has(game.appid));
    return games.length === read.games.length
      ? { result: read }
      : { write: { games }, result: { games } };
  });
  return viewResponse(
    viewOfBag(bag, session.players, session.player, session.role),
  );
};

export default withServerErrors((request: Request, context: Context) =>
  handleEmptyBag(request, process.env, openStore(context)),
);

export const config: Config = { path: "/api/empty-bag" };
