import { describe, expect, it } from "vitest";
import { pingServer } from "./server-status";

const answering =
  (status: number, body: unknown): typeof fetch =>
  async () =>
    Response.json(body, { status });

describe("pingServer", () => {
  it("is ok when the function answers ok", async () => {
    expect(await pingServer(answering(200, { ok: true }))).toBe("ok");
  });

  it("is an error when the function fails", async () => {
    expect(await pingServer(answering(500, { ok: true }))).toBe("error");
  });

  it("is an error when the answer is not the expected one", async () => {
    expect(await pingServer(answering(200, "<html>"))).toBe("error");
  });

  it("is an error when the network fails", async () => {
    const failing: typeof fetch = async () => {
      throw new TypeError("Failed to fetch");
    };
    expect(await pingServer(failing)).toBe("error");
  });
});
