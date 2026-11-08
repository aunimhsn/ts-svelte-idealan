// Votes for a game or withdraws the vote (specs.md, The bag): POST /api/vote with
// { appid, vote: "up" | null }, the access code and the player in the headers. The interface
// sends the vote the friend ends with: a second tap on the arrow sends null. The friend who added
// a game keeps their upvote. Answers the bag.
import type { Config, Context } from "@netlify/functions";
import type { Vote } from "../../src/lib/bag";
import type { Environment } from "../lib/access";
import { BAG_KEY, readBag, viewOfBag, type Bag } from "../lib/bag";
import {
  errorResponse,
  openSession,
  playerRefusalResponse,
  readBody,
  viewResponse,
  withServerErrors,
} from "../lib/http";
import { isStillPlayer } from "../lib/players";
import { openStore, updateJSON, type JsonStore } from "../lib/store";

const STATUS_OF_ERROR = {
  "game-not-found": 404,
  "own-game": 403,
} as const;

export const handleVote = async (
  request: Request,
  env: Environment,
  store: JsonStore,
): Promise<Response> => {
  const opened = await openSession(request, env, store, "POST");
  if (!opened.ok) return opened.response;
  const { session } = opened;
  const body = await readBody(request);
  const appid = body?.appid;
  const vote = body?.vote;
  if (!Number.isSafeInteger(appid) || !(vote === "up" || vote === null)) {
    return errorResponse("invalid-request", 400);
  }
  const me = session.player.id;
  const voted = await updateJSON<
    | { ok: true; bag: Bag }
    | { ok: false; error: keyof typeof STATUS_OF_ERROR }
    | { ok: false; error: "unknown-player" }
  >(store, BAG_KEY, async (current) => {
    if (!(await isStillPlayer(store, me))) {
      return { result: { ok: false, error: "unknown-player" } };
    }
    const bag = readBag(current);
    const game = bag.games.find((candidate) => candidate.appid === appid);
    if (game === undefined) {
      return {
        result: { ok: false, error: "game-not-found" },
      };
    }
    if (game.addedBy === me) {
      return { result: { ok: false, error: "own-game" } };
    }
    const votes: Record<string, Vote> = { ...game.votes };
    if (vote === null) delete votes[me];
    else votes[me] = vote;
    const next = {
      games: bag.games.map((candidate) =>
        candidate === game ? { ...game, votes } : candidate,
      ),
    };
    return { write: next, result: { ok: true, bag: next } };
  });
  if (!voted.ok) {
    return voted.error === "unknown-player"
      ? playerRefusalResponse(voted.error)
      : errorResponse(voted.error, STATUS_OF_ERROR[voted.error]);
  }
  return viewResponse(
    viewOfBag(voted.bag, session.players, session.player, session.role),
  );
};

export default withServerErrors((request: Request, context: Context) =>
  handleVote(request, process.env, openStore(context)),
);

export const config: Config = { path: "/api/vote" };
