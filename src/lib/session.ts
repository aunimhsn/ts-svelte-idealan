// What the browser keeps of the friend (specs.md, Stored data): the access code, their id and
// nickname, and their personal code itself, sent with each action and checked again by the
// server, until « Se déconnecter ». After a refusal, only the access code and the nickname may be
// kept, to fill the welcome again.
import { isPersonalCode } from "./field-rules";

// The key of the browser's storage; scripts/check-overflow.mjs writes it too.
export const KEPT_KEY = "idealan";

// Each field is optional: a session is the four of them together.
export interface Kept {
  accessCode?: string;
  nickname?: string;
  playerId?: string;
  personalCode?: string;
}

export interface Session {
  accessCode: string;
  nickname: string;
  playerId: string;
  personalCode: string;
}

export type KeptStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

// A text of the storage is kept only when it has a plausible length: the storage is edited by
// hand sometimes, and a value from it goes into a header.
const MAX_LENGTH = 200;

const readText = (value: unknown) =>
  typeof value === "string" && value !== "" && value.length <= MAX_LENGTH
    ? value
    : undefined;

// What the storage holds, field by field: a field that is missing or malformed is left out.
export const readKept = (storage: KeptStorage | null): Kept => {
  let value: unknown;
  try {
    value = JSON.parse(storage?.getItem(KEPT_KEY) ?? "null");
  } catch {
    return {};
  }
  if (typeof value !== "object" || value === null) return {};
  const record = value as Record<string, unknown>;
  const personalCode = readText(record.personalCode);
  const kept: Kept = {
    accessCode: readText(record.accessCode),
    nickname: readText(record.nickname),
    playerId: readText(record.playerId),
    personalCode:
      personalCode !== undefined && isPersonalCode(personalCode)
        ? personalCode
        : undefined,
  };
  return Object.fromEntries(
    Object.entries(kept).filter(([, text]) => text !== undefined),
  );
};

// Writes what is kept; an empty one removes the key. A storage that refuses (a private window,
// a full disk) keeps the friend for this visit only.
export const writeKept = (storage: KeptStorage | null, kept: Kept) => {
  try {
    if (Object.keys(kept).length === 0) storage?.removeItem(KEPT_KEY);
    else storage?.setItem(KEPT_KEY, JSON.stringify(kept));
  } catch {
    // Kept in memory only.
  }
};

// The session of what is kept, when the four fields are there.
export const sessionOf = (kept: Kept): Session | null =>
  kept.accessCode !== undefined &&
  kept.nickname !== undefined &&
  kept.playerId !== undefined &&
  kept.personalCode !== undefined
    ? {
        accessCode: kept.accessCode,
        nickname: kept.nickname,
        playerId: kept.playerId,
        personalCode: kept.personalCode,
      }
    : null;

// Whether two sessions carry the same credentials (both none, or the same three fields): the
// nickname aside, which the admin may rename.
export const sameSession = (a: Session | null, b: Session | null) =>
  a === null || b === null
    ? a === b
    : a.accessCode === b.accessCode &&
      a.playerId === b.playerId &&
      a.personalCode === b.personalCode;

// The storage of the browser, or null when it can't be reached (blocked site data).
export const browserStorage = (): KeptStorage | null => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};
