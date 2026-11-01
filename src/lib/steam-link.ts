// Reads the appid of a Steam game in the link a friend pasted (specs.md, Steam links). Shared by
// the interface, which answers at once, and by the functions, which check again whatever they
// receive.

export type SteamLinkResult =
  | { ok: true; appid: number }
  | { ok: false; error: "steam-package" | "not-a-steam-link" };

// The largest appid Steam can give: an unsigned 32-bit integer.
const MAX_APPID = 4_294_967_295;

// A positive whole number without a leading zero, as Steam writes its appids.
const APPID_PATTERN = /^[1-9]\d{0,9}$/;

// The appid written as text, or null when it is not a valid one.
export const parseAppid = (text: string): number | null => {
  if (!APPID_PATTERN.test(text)) return null;
  const appid = Number(text);
  return appid <= MAX_APPID ? appid : null;
};

// The first segments of the path that lead to a game, then to a package, on each Steam site.
const GAME_PATHS: Record<string, string[][]> = {
  "store.steampowered.com": [["app"], ["agecheck", "app"]],
  "steamcommunity.com": [["app"]],
};
const PACKAGE_PATHS = [["sub"], ["bundle"]];

const startsWith = (segments: string[], prefix: string[]) =>
  prefix.every((segment, index) => segments[index] === segment);

export const readSteamLink = (text: string): SteamLinkResult => {
  let url: URL;
  try {
    url = new URL(text.trim());
  } catch {
    return { ok: false, error: "not-a-steam-link" };
  }
  const gamePaths = GAME_PATHS[url.hostname];
  if (!["https:", "http:"].includes(url.protocol) || !gamePaths) {
    return { ok: false, error: "not-a-steam-link" };
  }

  const segments = url.pathname.split("/").filter((segment) => segment !== "");
  for (const prefix of gamePaths) {
    if (!startsWith(segments, prefix)) continue;
    const appid = parseAppid(segments[prefix.length] ?? "");
    return appid === null
      ? { ok: false, error: "not-a-steam-link" }
      : { ok: true, appid };
  }
  if (
    url.hostname === "store.steampowered.com" &&
    PACKAGE_PATHS.some((prefix) => startsWith(segments, prefix))
  ) {
    return { ok: false, error: "steam-package" };
  }
  return { ok: false, error: "not-a-steam-link" };
};
