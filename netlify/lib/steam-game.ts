// Reads the Steam page of a game: from the cache of Netlify Blobs (`steam/<appid>`) when it was
// asked before, otherwise from the Steam Store, then cached (docs/technical-choices.md, Steam).
// The answer of Steam is untrusted: only the fields the bag needs are kept, checked one by one.
import type { JsonStore } from "./store";

export interface SteamCategory {
  id: number;
  name: string;
}

// What the cache keeps of a Steam page, a game or not, so that Steam is asked once per appid.
export interface SteamPage {
  appid: number;
  type: string;
  name: string;
  // The address of the cover on the Steam CDN, or null when Steam gives none.
  cover: string | null;
  categories: SteamCategory[];
  genres: string[];
}

export type SteamGameResult =
  | { ok: true; game: SteamPage }
  | { ok: false; error: "not-a-game" | "steam-unavailable" };

export interface SteamGameDependencies {
  store: JsonStore;
  fetcher: typeof fetch;
}

// Long enough for a slow answer of Steam, short enough for a friend waiting on « Ajouter ».
const STEAM_TIMEOUT_MS = 8000;

// A text of Steam longer than this is cut: a name or a category is never this long.
const MAX_TEXT_LENGTH = 200;

export const steamDetailsUrl = (appid: number) =>
  `https://store.steampowered.com/api/appdetails?appids=${appid}&cc=fr&l=french&filters=basic,categories,genres`;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const readText = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const text = value.trim().slice(0, MAX_TEXT_LENGTH);
  return text === "" ? null : text;
};

// Only an https address of the Steam CDN, the one host the Content Security Policy allows.
const readCover = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      url.hostname.endsWith(".steamstatic.com")
      ? url.href
      : null;
  } catch {
    return null;
  }
};

const readCategories = (value: unknown): SteamCategory[] =>
  (Array.isArray(value) ? value : []).flatMap((category) => {
    if (!isRecord(category)) return [];
    const name = readText(category.description);
    return Number.isSafeInteger(category.id) && name !== null
      ? [{ id: category.id as number, name }]
      : [];
  });

const readGenres = (value: unknown): string[] =>
  (Array.isArray(value) ? value : []).flatMap((genre) => {
    const name = isRecord(genre) ? readText(genre.description) : null;
    return name === null ? [] : [name];
  });

// The page of the answer of Steam, "unknown" when Steam doesn't know the appid, or null when the
// answer doesn't have the expected shape.
export const readSteamAnswer = (
  appid: number,
  body: unknown,
): SteamPage | "unknown" | null => {
  const entry = isRecord(body) ? body[String(appid)] : undefined;
  if (!isRecord(entry)) return null;
  if (entry.success === false) return "unknown";
  if (entry.success !== true || !isRecord(entry.data)) return null;
  const { data } = entry;
  const type = readText(data.type);
  const name = readText(data.name);
  if (type === null || name === null) return null;
  return {
    appid,
    type,
    name,
    cover: readCover(data.header_image),
    categories: readCategories(data.categories),
    genres: readGenres(data.genres),
  };
};

// A page read back from the cache: written by this code, checked anyway in case its shape changed.
const isSteamPage = (value: unknown, appid: number): value is SteamPage =>
  isRecord(value) &&
  value.appid === appid &&
  typeof value.type === "string" &&
  typeof value.name === "string" &&
  (value.cover === null || typeof value.cover === "string") &&
  Array.isArray(value.categories) &&
  Array.isArray(value.genres);

const askSteam = async (
  appid: number,
  fetcher: typeof fetch,
): Promise<SteamPage | "unknown" | "unavailable"> => {
  try {
    const response = await fetcher(steamDetailsUrl(appid), {
      signal: AbortSignal.timeout(STEAM_TIMEOUT_MS),
    });
    if (response.status !== 200) {
      console.error(`Steam answered ${response.status} for appid ${appid}.`);
      return "unavailable";
    }
    const page = readSteamAnswer(appid, await response.json());
    if (page === null) {
      console.error(`Steam answered an unexpected shape for appid ${appid}.`);
      return "unavailable";
    }
    return page;
  } catch (error) {
    console.error(`Steam didn't answer for appid ${appid}.`, error);
    return "unavailable";
  }
};

export const readSteamGame = async (
  appid: number,
  { store, fetcher }: SteamGameDependencies,
): Promise<SteamGameResult> => {
  const key = `steam/${appid}`;

  // The cache only saves calls to Steam: when Blobs fails, Steam is asked as if nothing was cached.
  let page: SteamPage | null = null;
  try {
    const cached = await store.getJSON(key);
    if (isSteamPage(cached, appid)) page = cached;
  } catch (error) {
    console.error(`Reading ${key} failed.`, error);
  }

  if (page === null) {
    const answer = await askSteam(appid, fetcher);
    if (answer === "unavailable")
      return { ok: false, error: "steam-unavailable" };
    // An unknown appid isn't cached: it may be a game not released yet.
    if (answer === "unknown") return { ok: false, error: "not-a-game" };
    page = answer;
    try {
      await store.setJSON(key, page);
    } catch (error) {
      console.error(`Writing ${key} failed.`, error);
    }
  }

  // A soundtrack or a DLC is cached too, but never goes in the bag.
  return page.type === "game"
    ? { ok: true, game: page }
    : { ok: false, error: "not-a-game" };
};
