// Adds a game to the bag from its Steam link (specs.md, The bag): POST /api/add-game with
// { link, maxPlayers }, the access code and the player in the headers. The friend who adds it
// counts as an upvote. Answers the bag.
import type { Config, Context } from "@netlify/functions";
import { MAX_GAMES, type BagGame } from "../../src/lib/bag";
import { readMaxPlayers } from "../../src/lib/field-rules";
import { readSteamLink } from "../../src/lib/steam-link";
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
import { readSteamGame, type SteamGameDependencies } from "../lib/steam-game";
import { openStore, updateJSON } from "../lib/store";

const STATUS_OF_ERROR = {
  "not-a-steam-link": 400,
  "steam-package": 400,
  "invalid-max-players": 400,
  "not-a-game": 422,
  "steam-unavailable": 502,
  "already-in-bag": 409,
  "bag-full": 409,
} as const;

type AddError = keyof typeof STATUS_OF_ERROR;

const refuse = (error: AddError) =>
  errorResponse(error, STATUS_OF_ERROR[error]);

// Why the bag refuses the game of `appid`, if it does.
const refusalOf = (games: BagGame[], appid: number): AddError | null => {
  if (games.some((game) => game.appid === appid)) return "already-in-bag";
  if (games.length >= MAX_GAMES) return "bag-full";
  return null;
};

export const handleAddGame = async (
  request: Request,
  env: Environment,
  { store, fetcher }: SteamGameDependencies,
  now = new Date(),
): Promise<Response> => {
  const opened = await openSession(request, env, store, "POST");
  if (!opened.ok) return opened.response;
  const { session } = opened;
  const body = await readBody(request);
  if (body === null) return errorResponse("invalid-request", 400);
  const link = readSteamLink(typeof body.link === "string" ? body.link : "");
  if (!link.ok) return refuse(link.error);
  const maxPlayers = readMaxPlayers(body.maxPlayers);
  if (maxPlayers === "invalid") return refuse("invalid-max-players");

  // Refused before asking Steam when the link already tells: Steam is asked only when needed.
  const before = refusalOf(
    readBag(await store.getJSON(BAG_KEY)).games,
    link.appid,
  );
  if (before !== null) return refuse(before);

  const steam = await readSteamGame(link.appid, { store, fetcher });
  if (!steam.ok) return refuse(steam.error);
  const { game } = steam;

  // Checked again on the bag as it stands when written: the appid of Steam may differ from the
  // link's, and another friend may have added a game meanwhile.
  const added = await updateJSON<
    | { ok: true; bag: Bag }
    | { ok: false; refusal: AddError }
    | { ok: false; refusal: "unknown-player" }
  >(store, BAG_KEY, async (current) => {
    if (!(await isStillPlayer(store, session.player.id))) {
      return { result: { ok: false, refusal: "unknown-player" } };
    }
    const bag = readBag(current);
    const refusal = refusalOf(bag.games, game.appid);
    if (refusal !== null) return { result: { ok: false, refusal } };
    const next = {
      games: [
        ...bag.games,
        {
          appid: game.appid,
          name: game.name,
          cover: game.cover,
          categories: game.categories,
          genres: game.genres,
          maxPlayers,
          addedBy: session.player.id,
          addedAt: now.toISOString(),
          votes: { [session.player.id]: "up" as const },
        },
      ],
    };
    return { write: next, result: { ok: true, bag: next } };
  });
  if (!added.ok) {
    return added.refusal === "unknown-player"
      ? playerRefusalResponse(added.refusal)
      : refuse(added.refusal);
  }
  return viewResponse(
    viewOfBag(added.bag, session.players, session.player, session.role),
  );
};

export default withServerErrors((request: Request, context: Context) =>
  handleAddGame(request, process.env, {
    store: openStore(context),
    fetcher: fetch,
  }),
);

export const config: Config = { path: "/api/add-game" };
