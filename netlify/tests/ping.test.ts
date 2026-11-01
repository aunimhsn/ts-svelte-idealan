import { describe, expect, it } from "vitest";
import ping, { config } from "../functions/ping";

describe("ping", () => {
  it("answers on /api/ping", () => {
    expect(config.path).toBe("/api/ping");
  });

  it("answers ok to a GET", async () => {
    const response = await ping(new Request("http://localhost/api/ping"));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });

  it("refuses another method with an error code", async () => {
    const response = await ping(
      new Request("http://localhost/api/ping", { method: "POST" }),
    );
    expect(response.status).toBe(405);
    expect(response.headers.get("allow")).toBe("GET");
    expect(await response.json()).toEqual({ error: "method-not-allowed" });
  });
});
