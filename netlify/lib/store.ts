// The Netlify Blobs store of the application (docs/technical-choices.md, Data). The production
// site uses a site-wide store, which lives from one deploy to the next; any other deploy (a deploy
// preview, a branch deploy, netlify dev) uses a store of its own, emptied with each push, so that
// a preview never reads nor writes the friends' bag (decided by the owner on 2026-11-01).
import { getDeployStore, getStore } from "@netlify/blobs";
import type { Context } from "@netlify/functions";

// A value read with its ETag, the version of the key that a conditional write compares.
export interface Versioned {
  value: unknown;
  etag: string;
}

// A conditional write: only if nobody wrote the key since it was read (`onlyIfMatch`, with the
// ETag read), or only if the key doesn't exist yet (`onlyIfNew`).
export type WriteCondition = { onlyIfMatch: string } | { onlyIfNew: true };

// The few operations the functions need, so that the tests can give an in-memory store.
export interface JsonStore {
  // The value of the key, or null when the key doesn't exist.
  getJSON(key: string): Promise<unknown>;
  // The value of the key with its ETag, or null when the key doesn't exist.
  getVersioned(key: string): Promise<Versioned | null>;
  // Writes the value; false when the condition failed: another friend wrote the key meanwhile.
  setJSON(
    key: string,
    value: unknown,
    condition?: WriteCondition,
  ): Promise<boolean>;
}

const STORE_NAME = "idealan";

// The ETag given in netlify dev when its local server gives none.
const LOCAL_ETAG = "local-without-etag";

export const openStore = (context: Pick<Context, "deploy">): JsonStore => {
  // Strong consistency: a friend sees their own write at once, instead of up to 60 seconds later.
  const options = { name: STORE_NAME, consistency: "strong" } as const;
  // netlify dev serves Blobs from a folder of the project (`.netlify/blobs-serve`), not the site.
  const local = context.deploy.context === "dev";
  const store =
    context.deploy.context === "production"
      ? getStore(options)
      : getDeployStore(options);
  return {
    getJSON: (key) => store.get(key, { type: "json" }),
    getVersioned: async (key) => {
      const entry = await store.getWithMetadata(key, { type: "json" });
      if (entry === null) return null;
      if (entry.etag !== undefined)
        return { value: entry.data, etag: entry.etag };
      // The local Blobs server of netlify dev answers no ETag on a read (@netlify/blobs 11.1.7):
      // there, the write is unconditional, harmless with one developer.
      if (local) return { value: entry.data, etag: LOCAL_ETAG };
      // Online, no conditional write could succeed: say so rather than retry for nothing.
      throw new Error(`Blobs gave no ETag for ${key}.`);
    },
    setJSON: async (key, value, condition) => {
      const unconditional =
        local &&
        condition !== undefined &&
        "onlyIfMatch" in condition &&
        condition.onlyIfMatch === LOCAL_ETAG;
      const result = await store.setJSON(
        key,
        value,
        unconditional ? undefined : condition,
      );
      return result.modified;
    },
  };
};

// How many times a change is tried again when other friends write the same key meanwhile: a few
// friends clicking at the same second, never more.
const MAX_ATTEMPTS = 5;

// What a change of a key decides: write a new value and answer a result, or answer without
// writing (a refusal, or nothing to change).
export type Change<Result> =
  { write: unknown; result: Result } | { result: Result };

export class StoreBusyError extends Error {}

// A short pause before trying again, longer at each try (up to 20, 40, 80, 160 ms) and drawn by
// chance, so that friends who wrote at the same second don't collide again at the next try.
const pause = (attempt: number) =>
  new Promise((resolve) =>
    setTimeout(resolve, Math.random() * 10 * 2 ** attempt),
  );

// Reads the key, lets `change` decide from its current value (null when it doesn't exist), and
// writes conditionally; when another friend wrote meanwhile, reads again and starts over, so that
// no write is ever lost (specs.md, Stored data). `change` may run several times: it must only
// compute, never act outside.
export const updateJSON = async <Result>(
  store: JsonStore,
  key: string,
  change: (current: unknown) => Change<Result> | Promise<Change<Result>>,
): Promise<Result> => {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) await pause(attempt);
    const current = await store.getVersioned(key);
    const decision = await change(current?.value ?? null);
    if (!("write" in decision)) return decision.result;
    const condition: WriteCondition =
      current === null ? { onlyIfNew: true } : { onlyIfMatch: current.etag };
    if (await store.setJSON(key, decision.write, condition)) {
      return decision.result;
    }
  }
  throw new StoreBusyError(`${key} kept changing: gave up.`);
};
