// Answers the bag: GET /api/get-bag with the access code, the id of the player and their personal
// code in the headers. The interface asks it every 30 seconds while the tab is shown, and with
// « Rafraîchir » (specs.md, The bag).
import type { Config, Context } from "@netlify/functions";
import type { Environment } from "../lib/access";
import {
  currentView,
  openSession,
  viewResponse,
  withServerErrors,
} from "../lib/http";
import { openStore, type JsonStore } from "../lib/store";

export const handleGetBag = async (
  request: Request,
  env: Environment,
  store: JsonStore,
): Promise<Response> => {
  const opened = await openSession(request, env, store, "GET");
  if (!opened.ok) return opened.response;
  return viewResponse(await currentView(store, opened.session));
};

export default withServerErrors((request: Request, context: Context) =>
  handleGetBag(request, process.env, openStore(context)),
);

export const config: Config = { path: "/api/get-bag" };
