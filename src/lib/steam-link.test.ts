import { describe, expect, it } from "vitest";
import { parseAppid, readSteamLink, steamPage } from "./steam-link";

describe("readSteamLink", () => {
  it.each([
    "https://store.steampowered.com/app/730/CounterStrike_2/",
    "https://store.steampowered.com/app/730",
    "https://store.steampowered.com/app/730/",
    "https://store.steampowered.com/app/730/CounterStrike_2/?snr=1_7_15__13",
    "https://store.steampowered.com/app/730#app_reviews_hash",
    "  https://store.steampowered.com/app/730  ",
    "http://store.steampowered.com/app/730",
    "https://store.steampowered.com/agecheck/app/730/",
    "https://steamcommunity.com/app/730",
  ])("reads game 730 in %s", (link) => {
    expect(readSteamLink(link)).toEqual({ ok: true, appid: 730 });
  });

  it.each([
    "https://store.steampowered.com/sub/54029/",
    "https://store.steampowered.com/bundle/232/Valve_Complete_Pack/",
  ])("refuses the package %s", (link) => {
    expect(readSteamLink(link)).toEqual({ ok: false, error: "steam-package" });
  });

  it.each([
    "",
    "Counter-Strike 2",
    "store.steampowered.com/app/730",
    "https://store.epicgames.com/app/730",
    "https://store.steampowered.com.evil.example/app/730",
    "https://evil.example/?u=https://store.steampowered.com/app/730",
    "javascript:alert(1)//store.steampowered.com/app/730",
    "ftp://store.steampowered.com/app/730",
    "https://store.steampowered.com/",
    "https://store.steampowered.com/app/",
    "https://store.steampowered.com/app/abc",
    "https://store.steampowered.com/app/0",
    "https://store.steampowered.com/app/0730",
    "https://store.steampowered.com/app/-730",
    "https://store.steampowered.com/app/99999999999",
    "https://store.steampowered.com/search/?term=app/730",
    "https://steamcommunity.com/sub/54029",
    "https://steamcommunity.com/id/sylent",
    "https://constructor/app/730",
    "https://__proto__/app/730",
    "https://hasownproperty/app/730",
  ])("refuses %s", (link) => {
    expect(readSteamLink(link)).toEqual({
      ok: false,
      error: "not-a-steam-link",
    });
  });
});

describe("parseAppid", () => {
  it("reads a positive whole number", () => {
    expect(parseAppid("730")).toBe(730);
    expect(parseAppid("4294967295")).toBe(4_294_967_295);
  });

  it.each(["", "0", "07", "-1", "1.5", "1e3", " 730", "4294967296", "730abc"])(
    "refuses %j",
    (text) => {
      expect(parseAppid(text)).toBeNull();
    },
  );
});

describe("steamPage", () => {
  it("leads to the Steam page that the link of a game is read from", () => {
    expect(steamPage(730)).toBe("https://store.steampowered.com/app/730/");
    expect(readSteamLink(steamPage(730))).toEqual({ ok: true, appid: 730 });
  });
});
