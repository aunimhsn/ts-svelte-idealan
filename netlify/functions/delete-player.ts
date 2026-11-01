// Deletes a player with their games, their votes and their tries (specs.md, Settings):
// POST /api/delete-player with { id }, the admin code and the admin in the headers. The admin
// can't delete themself. Answers the bag with the accounts.
import type { Config, Context } from "@netlify/functions";
import type { Environment } from "../lib/access";
import {
  errorResponse,
  readBody,
  viewResponse,
  withServerErrors,
} from "../lib/http";
import {
  deletePlayer,
  openAdminSession,
  playerIdOf,
  settingsView,
  STATUS_OF_SETTINGS_ERROR,
} from "../lib/settings";
import { openStore, type JsonStore } from "../lib/store";

export const handleDeletePlayer = async (
  request: Request,
  env: Environment,
  store: JsonStore,
): Promise<Response> => {
  const opened = await openAdminSession(request, env, store, "POST");
  if (!opened.ok) return opened.response;
  const id = playerIdOf(await readBody(request));
  if (id === null) return errorResponse("invalid-request", 400);
  const refused = await deletePlayer(store, id, opened.session.player.id);
  if (refused !== null) {
    return errorResponse(refused, STATUS_OF_SETTINGS_ERROR[refused]);
  }
  return viewResponse(await settingsView(store, opened.session));
};

export default withServerErrors((request: Request, context: Context) =>
  handleDeletePlayer(request, process.env, openStore(context)),
);

export const config: Config = { path: "/api/delete-player" };
