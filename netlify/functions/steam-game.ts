// Answers the Steam page of a game, for an appid: GET /api/steam-game?appid=730, with the access
// code in the x-access-code header. It lets step 5 be tried on a deploy preview, from the servers
// of Netlify; step 6 removes it, once add-game calls readSteamGame itself.
import type { Config, Context } from "@netlify/functions";
import { parseAppid } from "../../src/lib/steam-link";
import { checkAccess, type Environment } from "../lib/access";
import { readSteamGame, type SteamGameDependencies } from "../lib/steam-game";
import { openStore } from "../lib/store";

const STATUS_OF_ERROR = {
  "not-a-game": 404,
  "steam-unavailable": 502,
} as const;

export const handleSteamGame = async (
  request: Request,
  env: Environment,
  dependencies: SteamGameDependencies,
): Promise<Response> => {
  if (request.method !== "GET") {
    return Response.json(
      { error: "method-not-allowed" },
      { status: 405, headers: { allow: "GET" } },
    );
  }
  const access = checkAccess(request, env);
  if (!access.ok) {
    return Response.json({ error: access.error }, { status: access.status });
  }
  const appid = parseAppid(
    new URL(request.url).searchParams.get("appid") ?? "",
  );
  if (appid === null) {
    return Response.json({ error: "invalid-appid" }, { status: 400 });
  }
  const result = await readSteamGame(appid, dependencies);
  return result.ok
    ? Response.json({ game: result.game })
    : Response.json(
        { error: result.error },
        { status: STATUS_OF_ERROR[result.error] },
      );
};

export default (request: Request, context: Context) =>
  handleSteamGame(request, process.env, {
    store: openStore(context),
    fetcher: fetch,
  });

export const config: Config = { path: "/api/steam-game" };
