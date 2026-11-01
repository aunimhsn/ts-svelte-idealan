// Resets the personal code of a player and unlocks their nickname (specs.md, Settings):
// POST /api/reset-player-code with { id }, the admin code and the admin in the headers. The first
// one to enter with the nickname then chooses its new code. Answers the bag with the accounts.
import type { Config, Context } from "@netlify/functions";
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
  resetPlayerCode,
  settingsView,
  STATUS_OF_SETTINGS_ERROR,
} from "../lib/settings";
import { openStore, type JsonStore } from "../lib/store";

export const handleResetPlayerCode = async (
  request: Request,
  env: Environment,
  store: JsonStore,
): Promise<Response> => {
  const opened = await openAdminSession(request, env, store, "POST");
  if (!opened.ok) return opened.response;
  const id = playerIdOf(await readBody(request));
  if (id === null) return errorResponse("invalid-request", 400);
  const refused = await resetPlayerCode(store, id);
  if (refused !== null) {
    return errorResponse(refused, STATUS_OF_SETTINGS_ERROR[refused]);
  }
  return viewResponse(await settingsView(store, opened.session));
};

export default withServerErrors((request: Request, context: Context) =>
  handleResetPlayerCode(request, process.env, openStore(context)),
);

export const config: Config = { path: "/api/reset-player-code" };
