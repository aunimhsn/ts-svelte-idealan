// Answers that the server part runs: the home screen of the skeleton shows it, until the welcome
// of step 6b.
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
