// Turns the error codes of the functions and of the interface into the French messages of
// src/i18n/fr.json (CLAUDE.md, Language), and says where each shows on the welcome.
import fr from "../i18n/fr.json";

// Fills the {names} of a text.
export const format = (
  template: string,
  values: Record<string, string | number> = {},
) =>
  template.replace(/\{(\w+)\}/g, (marker, name: string) =>
    Object.hasOwn(values, name) ? String(values[name]) : marker,
  );

const has = <T extends object>(
  texts: T,
  code: string,
): code is keyof T & string => Object.hasOwn(texts, code);

// « 21 h 04 »: the time a bag was read.
export const formatTime = (date: Date) =>
  format(fr.time, {
    hours: date.getHours(),
    minutes: String(date.getMinutes()).padStart(2, "0"),
  });

export type WelcomeField = "accessCode" | "nickname" | "personalCode" | "form";

// The field of the welcome an error sits under; `form` is under « Entrer ».
const FIELD_OF_ERROR: Record<string, WelcomeField> = {
  "missing-access-code": "accessCode",
  "wrong-access-code": "accessCode",
  "server-not-configured": "accessCode",
  "invalid-nickname": "nickname",
  "too-many-players": "nickname",
  "invalid-personal-code": "personalCode",
  "wrong-personal-code": "personalCode",
  "player-locked": "personalCode",
  "personal-code-reset": "personalCode",
  "player-busy": "personalCode",
};

export interface WelcomeError {
  field: WelcomeField;
  code: string;
}

export const welcomeErrorOf = (code: string): WelcomeError => ({
  field: FIELD_OF_ERROR[code] ?? "form",
  code,
});

export const welcomeMessage = (code: string, nickname: string) =>
  format(
    has(fr.welcomeErrors, code)
      ? fr.welcomeErrors[code]
      : fr.welcomeErrors.unexpected,
    { nickname },
  );

// Why the friend was sent back to the welcome: a refusal of their player, or a code changed.
export type Notice = keyof typeof fr.notices;

export const isNotice = (code: string): code is Notice => has(fr.notices, code);

// The message of the strip of the errors of the bag. `loadedAt` is when the bag shown was read,
// in milliseconds since 1970.
export const bagMessage = (code: string, loadedAt: number | null) => {
  if (code === "server-unreachable" && loadedAt !== null) {
    return format(fr.bagErrors["server-unreachable-since"], {
      time: formatTime(new Date(loadedAt)),
    });
  }
  return has(fr.bagErrors, code) ? fr.bagErrors[code] : fr.bagErrors.unexpected;
};

// The message of an error of a panel of the admin (the settings, emptying the bag), in the panel
// itself, since the strip of the bag is under it. `nickname` is the one the admin typed, for « …
// existe déjà ». The errors the welcome knows too (a nickname against the rules, the server not
// answering) take its texts, kept in one place.
export const adminMessage = (code: string, nickname = "") =>
  format(
    has(fr.adminErrors, code)
      ? fr.adminErrors[code]
      : has(fr.welcomeErrors, code)
        ? fr.welcomeErrors[code]
        : fr.welcomeErrors.unexpected,
    { nickname },
  );
