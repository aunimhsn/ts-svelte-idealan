import { describe, expect, it } from "vitest";
import fr from "../i18n/fr.json";
import { MAX_PLAYERS } from "./field-rules";
import {
  panelMessage,
  bagMessage,
  format,
  formatTime,
  welcomeErrorOf,
  welcomeMessage,
} from "./messages";

// The error codes the functions answer (netlify/), and those of the interface.
const WELCOME_ERRORS = [
  "missing-access-code",
  "wrong-access-code",
  "server-not-configured",
  "invalid-nickname",
  "too-many-players",
  "invalid-personal-code",
  "wrong-personal-code",
  "player-locked",
  "personal-code-reset",
  "player-busy",
  "server-unreachable",
  "server-error",
];
const BAG_ERRORS = [
  "not-a-steam-link",
  "steam-package",
  "not-a-game",
  "invalid-max-players",
  "already-in-bag",
  "bag-full",
  "steam-unavailable",
  "player-busy",
  "server-not-configured",
  "server-unreachable",
  "server-error",
];

const texts = (value: unknown): string[] =>
  typeof value === "string"
    ? [value]
    : typeof value === "object" && value !== null
      ? Object.entries(value).flatMap(([key, child]) =>
          key === "$comment" ? [] : texts(child),
        )
      : [];

describe("fr.json", () => {
  it("follows French typography", () => {
    for (const text of texts(fr)) {
      expect(text, text).not.toMatch(/ [:;?!»]/);
      expect(text, text).not.toMatch(/« /);
      expect(text, text).not.toMatch(/[^\s][:;?!](\s|$)/);
      expect(text, text).not.toContain("'");
    }
  });
});

describe("welcome messages", () => {
  it("has a message for each error the welcome may meet", () => {
    for (const code of WELCOME_ERRORS) {
      expect(Object.keys(fr.welcomeErrors), code).toContain(code);
    }
  });

  it("puts each error under its field, the others under « Entrer »", () => {
    expect(welcomeErrorOf("wrong-access-code").field).toBe("accessCode");
    expect(welcomeErrorOf("too-many-players").field).toBe("nickname");
    expect(welcomeErrorOf("player-locked").field).toBe("personalCode");
    expect(welcomeErrorOf("server-unreachable").field).toBe("form");
    expect(welcomeErrorOf("something-new").field).toBe("form");
  });

  it("names the nickname, and falls back on a message for an unknown code", () => {
    expect(welcomeMessage("wrong-personal-code", "Nova")).toContain("Nova");
    expect(welcomeMessage("something-new", "Nova")).toBe(
      fr.welcomeErrors.unexpected,
    );
  });
});

describe("bag messages", () => {
  it("has a message for each error the bag may meet", () => {
    for (const code of BAG_ERRORS) {
      expect(Object.keys(fr.bagErrors), code).toContain(code);
    }
    expect(bagMessage("constructor", null)).toBe(fr.bagErrors.unexpected);
  });

  it("gives the limit of « Joueurs max » the functions enforce", () => {
    expect(fr.bagErrors["invalid-max-players"]).toContain(
      `entre 1 et ${MAX_PLAYERS},`,
    );
  });

  it("says when the bag shown was read, when the server doesn't answer", () => {
    const loadedAt = new Date(2026, 10, 7, 21, 4).getTime();
    expect(bagMessage("server-unreachable", loadedAt)).toContain(
      "21\u00a0h\u00a004",
    );
    expect(bagMessage("server-unreachable", null)).toBe(
      fr.bagErrors["server-unreachable"],
    );
  });
});

describe("format", () => {
  it("fills the names it is given and leaves the others", () => {
    expect(format("{a} et {b}", { a: 1 })).toBe("1 et {b}");
    expect(formatTime(new Date(2026, 10, 7, 9, 5))).toBe("9\u00a0h\u00a005");
  });
});

describe("panelMessage", () => {
  it("names the nickname taken, and falls back on an unknown code", () => {
    expect(panelMessage("nickname-taken", "Lou")).toBe(
      "Lou existe déjà : choisis un autre pseudo.",
    );
    expect(panelMessage("no-such-code")).toContain("recharge la page");
  });

  it("takes the texts the welcome shares, kept in one place", () => {
    expect(panelMessage("invalid-nickname")).toBe(
      "3 à 16 lettres ou chiffres, sans accents ni espace.",
    );
    expect(panelMessage("server-unreachable")).toContain(
      "Le serveur ne répond pas",
    );
  });
});
