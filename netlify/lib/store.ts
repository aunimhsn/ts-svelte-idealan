// The Netlify Blobs store of the application (docs/technical-choices.md, Data). The production
// site uses a site-wide store, which lives from one deploy to the next; any other deploy (a deploy
// preview, a branch deploy, netlify dev) uses a store of its own, emptied with each push, so that
// a preview never reads nor writes the friends' bag (decided by the owner on 2026-11-01).
import { getDeployStore, getStore } from "@netlify/blobs";
import type { Context } from "@netlify/functions";

// The few operations the functions need, so that the tests can give an in-memory store.
export interface JsonStore {
  // The value of the key, or null when the key doesn't exist.
  getJSON(key: string): Promise<unknown>;
  setJSON(key: string, value: unknown): Promise<void>;
}

const STORE_NAME = "idealan";

export const openStore = (context: Pick<Context, "deploy">): JsonStore => {
  // Strong consistency: a friend sees their own write at once, instead of up to 60 seconds later.
  const options = { name: STORE_NAME, consistency: "strong" } as const;
  const store =
    context.deploy.context === "production"
      ? getStore(options)
      : getDeployStore(options);
  return {
    getJSON: (key) => store.get(key, { type: "json" }),
    setJSON: async (key, value) => {
      await store.setJSON(key, value);
    },
  };
};
