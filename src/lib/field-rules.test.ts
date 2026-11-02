import { describe, expect, it } from "vitest";
import {
  isPersonalCode,
  readMaxPlayers,
  readNickname,
  sameNickname,
} from "./field-rules";

describe("readNickname", () => {
  it.each([
    ["sylent", "Sylent"],
    ["  Nova2 ", "Nova2"],
    ["kRAK", "KRAK"],
    ["abc", "Abc"],
    ["a".repeat(16), `A${"a".repeat(15)}`],
    ["42zero", "42zero"],
  ])("keeps %j as %j", (text, nickname) => {
    expect(readNickname(text)).toBe(nickname);
  });

  it.each(["", "ab", "a".repeat(17), "Élodie", "Nova 2", "Nova_2", "Nova!"])(
    "refuses %j",
    (text) => {
      expect(readNickname(text)).toBeNull();
    },
  );

  it("compares nicknames without case", () => {
    expect(sameNickname("SYLENT", "Sylent")).toBe(true);
    expect(sameNickname("Sylent", "Sylent2")).toBe(false);
  });
});

describe("isPersonalCode", () => {
  it.each(["0000", "1234", "9999"])("accepts %j", (code) => {
    expect(isPersonalCode(code)).toBe(true);
  });

  it.each(["", "123", "12345", "12a4", " 1234", "١٢٣٤"])(
    "refuses %j",
    (code) => {
      expect(isPersonalCode(code)).toBe(false);
    },
  );
});

describe("readMaxPlayers", () => {
  it.each([
    [undefined, null],
    [null, null],
    ["", null],
    ["  ", null],
    ["8", 8],
    [" 12 ", 12],
    [1, 1],
    [25, 25],
    ["25", 25],
  ])("reads %j as %j", (value, expected) => {
    expect(readMaxPlayers(value)).toBe(expected);
  });

  it.each([
    0,
    26,
    99,
    2.5,
    -1,
    "0",
    "26",
    "99",
    "100",
    "8.0",
    "huit",
    "1e1",
    true,
    {},
    [],
  ])("refuses %j", (value) => {
    expect(readMaxPlayers(value)).toBe("invalid");
  });
});
