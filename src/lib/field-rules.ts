// The rules of the fields a friend types (specs.md, Access code and nicknames, and The bag),
// shared by the interface, which explains them, and the functions, which enforce them.

// 3 to 16 letters without accents and digits, no space nor special character.
const NICKNAME_PATTERN = /^[A-Za-z0-9]{3,16}$/;

// The nickname as it is kept and shown, its first letter capitalized, or null when refused.
export const readNickname = (text: string): string | null => {
  const nickname = text.trim();
  if (!NICKNAME_PATTERN.test(nickname)) return null;
  return nickname.charAt(0).toUpperCase() + nickname.slice(1);
};

// Two nicknames are the same player when they differ only by case (« SYLENT » is « Sylent »).
export const sameNickname = (a: string, b: string) =>
  a.toLowerCase() === b.toLowerCase();

const PERSONAL_CODE_PATTERN = /^\d{4}$/;

// A personal code is exactly 4 digits.
export const isPersonalCode = (text: string) =>
  PERSONAL_CODE_PATTERN.test(text);

export const MIN_PLAYERS = 1;
// Lowered from 99 in step 9b: a game stored before keeps its number, read by the bag as it is.
export const MAX_PLAYERS = 25;

// The « Joueurs max » of a game: null when left empty, the number when it is a whole number from
// 1 to 25 (typed as text or given as a number), "invalid" otherwise.
export const readMaxPlayers = (value: unknown): number | null | "invalid" => {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") {
    const text = value.trim();
    if (text === "") return null;
    if (!/^\d{1,2}$/.test(text)) return "invalid";
    value = Number(text);
  }
  return typeof value === "number" &&
    Number.isInteger(value) &&
    value >= MIN_PLAYERS &&
    value <= MAX_PLAYERS
    ? value
    : "invalid";
};
