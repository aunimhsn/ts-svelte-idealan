// Answers that the server part runs: the skeleton of every function of the application, until
// the functions of steps 5 and 6 (read a Steam game, add a game to the bag).
import type { Config } from "@netlify/functions";

export default async (request: Request): Promise<Response> => {
  if (request.method !== "GET") {
    return Response.json(
      { error: "method-not-allowed" },
      { status: 405, headers: { allow: "GET" } },
    );
  }
  return Response.json({ ok: true });
};

export const config: Config = { path: "/api/ping" };
