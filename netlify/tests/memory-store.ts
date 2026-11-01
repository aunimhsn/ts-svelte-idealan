// A store kept in memory, as Netlify Blobs would keep it, with an ETag per write so that the
// conditional writes behave as in Blobs. Not a test file: the tests of netlify/tests/ import it.
import type { JsonStore } from "../lib/store";

export const memoryStore = (entries: Record<string, unknown> = {}) => {
  const data = new Map(Object.entries(entries));
  const etags = new Map([...data.keys()].map((key) => [key, "v0"]));
  let version = 0;
  // Called before each write, so that a test can slip in the write of another friend.
  let beforeWrite: (key: string) => void = () => {};
  const write = (key: string, value: unknown) => {
    data.set(key, structuredClone(value));
    etags.set(key, `v${++version}`);
  };
  const store: JsonStore = {
    getJSON: async (key) => structuredClone(data.get(key) ?? null),
    getVersioned: async (key) =>
      data.has(key)
        ? { value: structuredClone(data.get(key)), etag: etags.get(key) ?? "" }
        : null,
    setJSON: async (key, value, condition) => {
      beforeWrite(key);
      if (condition && "onlyIfNew" in condition && data.has(key)) return false;
      if (
        condition &&
        "onlyIfMatch" in condition &&
        etags.get(key) !== condition.onlyIfMatch
      ) {
        return false;
      }
      write(key, value);
      return true;
    },
  };
  return {
    store,
    data,
    // Writes as another friend would, outside of the function under test.
    write,
    onBeforeWrite: (hook: (key: string) => void) => {
      beforeWrite = hook;
    },
  };
};
