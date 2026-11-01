// Renames a player (specs.md, Settings): POST /api/rename-player with { id, nickname }, the admin
// code and the admin in the headers. The nickname follows the rules of the welcome; one taken by
// another player, without case, is refused. Answers the bag with the accounts.
import type { Config, Context } from "@netlify/functions";
import { readNickname } from "../../src/lib/field-rules";
import type { Environment } from "../lib/access";
import {
  errorResponse,
  readBody,
  viewResponse,
  withServerErrors,
} from "../lib/http";
import {
  openAdminSession,
  playerIdOf,
  renamePlayer,
  settingsView,
  STATUS_OF_SETTINGS_ERROR,
} from "../lib/settings";
import { openStore, type JsonStore } from "../lib/store";

export const handleRenamePlayer = async (
  request: Request,
  env: Environment,
  store: JsonStore,
): Promise<Response> => {
  const opened = await openAdminSession(request, env, store, "POST");
  if (!opened.ok) return opened.response;
  const body = await readBody(request);
  const id = playerIdOf(body);
  if (id === null) return errorResponse("invalid-request", 400);
  const nickname =
    typeof body?.nickname === "string" ? readNickname(body.nickname) : null;
  if (nickname === null) return errorResponse("invalid-nickname", 400);
  const refused = await renamePlayer(store, id, nickname);
  if (refused !== null) {
    return errorResponse(refused, STATUS_OF_SETTINGS_ERROR[refused]);
  }
  return viewResponse(await settingsView(store, opened.session));
};

export default withServerErrors((request: Request, context: Context) =>
  handleRenamePlayer(request, process.env, openStore(context)),
);

export const config: Config = { path: "/api/rename-player" };
