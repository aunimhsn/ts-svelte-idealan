import { describe, expect, it } from "vitest";
import {
  KEPT_KEY,
  readKept,
  sessionOf,
  writeKept,
  type KeptStorage,
} from "./session";

const storageWith = (text: string | null) => {
  const items = new Map<string, string>();
  if (text !== null) items.set(KEPT_KEY, text);
  const storage: KeptStorage = {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => void items.set(key, value),
    removeItem: (key) => void items.delete(key),
  };
  return { storage, items };
};

describe("readKept", () => {
  it("reads a kept session", () => {
    const kept = {
      accessCode: "code",
      nickname: "Nova",
      playerId: "j1",
      personalCode: "1234",
    };
    const { storage } = storageWith(JSON.stringify(kept));
    expect(readKept(storage)).toEqual(kept);
    expect(sessionOf(readKept(storage))).toEqual(kept);
  });

  it("leaves out what is missing or malformed", () => {
    const { storage } = storageWith(
      JSON.stringify({ accessCode: "code", nickname: 4, personalCode: "12a4" }),
    );
    expect(readKept(storage)).toEqual({ accessCode: "code" });
    expect(sessionOf(readKept(storage))).toBeNull();
    expect(readKept(storageWith("{not json").storage)).toEqual({});
    expect(readKept(storageWith("null").storage)).toEqual({});
    expect(readKept(null)).toEqual({});
  });
});

describe("writeKept", () => {
  it("writes what is kept, and removes the key when nothing is", () => {
    const { storage, items } = storageWith(null);
    writeKept(storage, { nickname: "Nova" });
    expect(items.get(KEPT_KEY)).toBe('{"nickname":"Nova"}');
    writeKept(storage, {});
    expect(items.has(KEPT_KEY)).toBe(false);
  });

  it("keeps going when the storage refuses", () => {
    const storage: KeptStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
      removeItem: () => undefined,
    };
    expect(() => writeKept(storage, { nickname: "Nova" })).not.toThrow();
  });
});
