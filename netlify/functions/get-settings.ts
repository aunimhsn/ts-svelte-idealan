// Answers the bag with the accounts, for the settings of the admin (specs.md, Settings):
// GET /api/get-settings with the admin code, the id of the player and their personal code in the
// headers. A member is refused with `admin-only`.
import type { Config, Context } from "@netlify/functions";
import type { Environment } from "../lib/access";
import { viewResponse, withServerErrors } from "../lib/http";
import { openAdminSession, settingsView } from "../lib/settings";
import { openStore, type JsonStore } from "../lib/store";

export const handleGetSettings = async (
  request: Request,
  env: Environment,
  store: JsonStore,
): Promise<Response> => {
  const opened = await openAdminSession(request, env, store, "GET");
  if (!opened.ok) return opened.response;
  return viewResponse(await settingsView(store, opened.session));
};

export default withServerErrors((request: Request, context: Context) =>
  handleGetSettings(request, process.env, openStore(context)),
);

export const config: Config = { path: "/api/get-settings" };
