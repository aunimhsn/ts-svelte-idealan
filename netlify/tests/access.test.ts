import { afterEach, describe, expect, it, vi } from "vitest";
import { ACCESS_CODE_HEADER, checkAccess } from "../lib/access";

const env = { MEMBER_CODE: "member-test-code", ADMIN_CODE: "admin-test-code" };

const requestWith = (code?: string) =>
  new Request("http://localhost/api/anything", {
    headers: code === undefined ? {} : { [ACCESS_CODE_HEADER]: code },
  });

describe("checkAccess", () => {
  afterEach(() => vi.restoreAllMocks());

  it("lets the member code in as a member", () => {
    expect(checkAccess(requestWith("member-test-code"), env)).toEqual({
      ok: true,
      role: "member",
    });
  });

  it("lets the admin code in as the admin", () => {
    expect(checkAccess(requestWith("admin-test-code"), env)).toEqual({
      ok: true,
      role: "admin",
    });
  });

  it.each([undefined, "", "member-test-cod", "MEMBER-TEST-CODE"])(
    "refuses the code %j",
    (code) => {
      expect(checkAccess(requestWith(code), env)).toEqual({
        ok: false,
        status: 401,
        error: "wrong-access-code",
      });
    },
  );

  it("never lets an empty code in when the admin code is not set", () => {
    expect(
      checkAccess(requestWith(""), { MEMBER_CODE: "member-test-code" }),
    ).toMatchObject({ ok: false, error: "wrong-access-code" });
    expect(
      checkAccess(requestWith("member-test-code"), {
        MEMBER_CODE: "member-test-code",
      }),
    ).toEqual({ ok: true, role: "member" });
  });

  it("gives only the member role when both codes are the same", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const same = {
      MEMBER_CODE: "same-test-code",
      ADMIN_CODE: "same-test-code",
    };
    expect(checkAccess(requestWith("same-test-code"), same)).toEqual({
      ok: true,
      role: "member",
    });
    expect(error).toHaveBeenCalledOnce();
  });

  it.each([{}, { MEMBER_CODE: "" }, { ADMIN_CODE: "admin-test-code" }])(
    "says the server is not configured without a member code (%j)",
    (environment) => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      expect(checkAccess(requestWith("admin-test-code"), environment)).toEqual({
        ok: false,
        status: 500,
        error: "server-not-configured",
      });
    },
  );
});
