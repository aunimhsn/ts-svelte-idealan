// A friend renames themself (specs.md, Settings (friend panel)): POST /api/rename-self with
// { nickname }, the access code and the player in the headers. The nickname follows the rules of
// the welcome; one taken by another player, without case, is refused, and so is a friend whose 3
// renames are used. The friend keeps their session. Answers the bag with their new nickname. The
// admin, whose interface has no such panel, renames themself as by their settings: not counted.
import type { Config, Context } from "@netlify/functions";
import { readNickname } from "../../src/lib/field-rules";
import type { Environment } from "../lib/access";
import {
  errorResponse,
  freshView,
  openSession,
  playerRefusalResponse,
  readBody,
  viewResponse,
  withServerErrors,
} from "../lib/http";
import { renamePlayer, renameSelf } from "../lib/renames";
import { STATUS_OF_SETTINGS_ERROR } from "../lib/settings";
import { openStore, type JsonStore } from "../lib/store";

export const handleRenameSelf = async (
  request: Request,
  env: Environment,
  store: JsonStore,
  now = new Date(),
): Promise<Response> => {
  const opened = await openSession(request, env, store, "POST");
  if (!opened.ok) return opened.response;
  const body = await readBody(request);
  const nickname =
    typeof body?.nickname === "string" ? readNickname(body.nickname) : null;
  if (nickname === null) return errorResponse("invalid-nickname", 400);
  const { player, role } = opened.session;
  const refused =
    role === "admin"
      ? await renamePlayer(store, player.id, nickname, now)
      : await renameSelf(store, player.id, nickname, now);
  if (refused === "unknown-player") return playerRefusalResponse(refused);
  if (refused !== null) {
    return errorResponse(refused, STATUS_OF_SETTINGS_ERROR[refused]);
  }
  return viewResponse((await freshView(store, opened.session)).view);
};

export default withServerErrors((request: Request, context: Context) =>
  handleRenameSelf(request, process.env, openStore(context)),
);

export const config: Config = { path: "/api/rename-self" };
