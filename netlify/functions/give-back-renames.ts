// Gives a friend their 3 renames back (specs.md, Settings): POST /api/give-back-renames with
// { id }, the admin code and the admin in the headers. Answers the bag with the accounts and the
// journal.
import type { Config, Context } from "@netlify/functions";
import type { Environment } from "../lib/access";
import {
  errorResponse,
  readBody,
  viewResponse,
  withServerErrors,
} from "../lib/http";
import { giveBackRenames } from "../lib/renames";
import {
  openAdminSession,
  playerIdOf,
  settingsView,
  STATUS_OF_SETTINGS_ERROR,
} from "../lib/settings";
import { openStore, type JsonStore } from "../lib/store";

export const handleGiveBackRenames = async (
  request: Request,
  env: Environment,
  store: JsonStore,
): Promise<Response> => {
  const opened = await openAdminSession(request, env, store, "POST");
  if (!opened.ok) return opened.response;
  const id = playerIdOf(await readBody(request));
  if (id === null) return errorResponse("invalid-request", 400);
  const refused = await giveBackRenames(store, id);
  if (refused !== null) {
    return errorResponse(refused, STATUS_OF_SETTINGS_ERROR[refused]);
  }
  return viewResponse(await settingsView(store, opened.session));
};

export default withServerErrors((request: Request, context: Context) =>
  handleGiveBackRenames(request, process.env, openStore(context)),
);

export const config: Config = { path: "/api/give-back-renames" };
