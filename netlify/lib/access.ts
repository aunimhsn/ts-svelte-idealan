// Checks the access code a request carries against the two codes of the Netlify environment
// variables (specs.md, Access code and nicknames): MEMBER_CODE reads the bag, adds and votes;
// ADMIN_CODE does as much and moderates. Every function checks it first.
import { createHash, timingSafeEqual } from "node:crypto";

// The header that carries the code: a query would leave it in the logs of Netlify.
export const ACCESS_CODE_HEADER = "x-access-code";

export type Role = "member" | "admin";

export type Access =
  | { ok: true; role: Role }
  | { ok: false; status: 401; error: "wrong-access-code" }
  | { ok: false; status: 500; error: "server-not-configured" };

export type Environment = Record<string, string | undefined>;

// Compares the digests rather than the codes: the time taken doesn't tell how many characters
// of the code were right, and two digests always have the same length.
const digest = (text: string) => createHash("sha256").update(text).digest();
const matches = (given: string, expected: string | undefined) =>
  expected !== undefined &&
  expected !== "" &&
  timingSafeEqual(digest(given), digest(expected));

export const checkAccess = (request: Request, env: Environment): Access => {
  // Without a member code, nobody could ever enter: say so rather than « wrong code ».
  if (!env.MEMBER_CODE) {
    console.error("MEMBER_CODE is not set for this deploy.");
    return { ok: false, status: 500, error: "server-not-configured" };
  }
  const code = request.headers.get(ACCESS_CODE_HEADER) ?? "";
  if (code !== "" && matches(code, env.ADMIN_CODE)) {
    return { ok: true, role: "admin" };
  }
  if (code !== "" && matches(code, env.MEMBER_CODE)) {
    return { ok: true, role: "member" };
  }
  return { ok: false, status: 401, error: "wrong-access-code" };
};
