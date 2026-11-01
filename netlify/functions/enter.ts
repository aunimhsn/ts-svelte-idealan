// Enters the bag with a nickname and its personal code (specs.md, Welcome): POST /api/enter with
// { nickname, code } and the access code in the x-access-code header. A new nickname makes a new
// player with this code; a known one checks it. Answers the bag, with the id of the player that
// the interface sends back with each action.
import type { Config, Context } from "@netlify/functions";
import { isPersonalCode, readNickname } from "../../src/lib/field-rules";
import type { Environment } from "../lib/access";
import { BAG_KEY, readBag, viewOfBag } from "../lib/bag";
import {
  checkRequest,
  errorResponse,
  readBody,
  playerRefusalResponse,
  viewResponse,
  withServerErrors,
} from "../lib/http";
import { enterPlayer } from "../lib/players";
import { openStore, type JsonStore } from "../lib/store";

export const handleEnter = async (
  request: Request,
  env: Environment,
  store: JsonStore,
  now = new Date(),
): Promise<Response> => {
  const checked = checkRequest(request, env, "POST");
  if (!checked.ok) return checked.response;
  const body = await readBody(request);
  if (body === null) return errorResponse("invalid-request", 400);
  const nickname =
    typeof body.nickname === "string" ? readNickname(body.nickname) : null;
  if (nickname === null) return errorResponse("invalid-nickname", 400);
  if (typeof body.code !== "string" || !isPersonalCode(body.code)) {
    return errorResponse("invalid-personal-code", 400);
  }
  const entered = await enterPlayer(store, nickname, body.code, now);
  if (!entered.ok) {
    return entered.error === "too-many-players"
      ? errorResponse(entered.error, 409)
      : playerRefusalResponse(entered.error);
  }
  return viewResponse(
    viewOfBag(
      readBag(await store.getJSON(BAG_KEY)),
      entered.players,
      entered.player,
      checked.role,
    ),
  );
};

export default withServerErrors((request: Request, context: Context) =>
  handleEnter(request, process.env, openStore(context)),
);

export const config: Config = { path: "/api/enter" };
