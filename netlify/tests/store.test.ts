import { beforeEach, describe, expect, it, vi } from "vitest";

// The two kinds of store, replaced so as to see which one each deploy opens.
const blobs = vi.hoisted(() => {
  const fakeStore = (kind: string) => ({
    kind,
    get: vi.fn(async () => ({ kind })),
    getWithMetadata: vi.fn(
      async (): Promise<{ data: unknown; etag?: string } | null> => ({
        data: { kind },
        etag: "etag-1",
      }),
    ),
    setJSON: vi.fn(async () => ({ modified: true })),
  });
  return {
    getStore: vi.fn(() => fakeStore("site")),
    getDeployStore: vi.fn(() => fakeStore("deploy")),
  };
});
vi.mock("@netlify/blobs", () => blobs);

const { openStore, updateJSON, StoreBusyError } = await import("../lib/store");
const { memoryStore } = await import("./memory-store");

const deploy = (context: string) => ({
  deploy: { context, id: "test", published: false },
});

describe("openStore", () => {
  beforeEach(() => vi.clearAllMocks());

  it.each(["production"])(
    "opens the site-wide store for the context %j only",
    async (context) => {
      const store = openStore(deploy(context));
      expect(blobs.getStore).toHaveBeenCalledWith({
        name: "idealan",
        consistency: "strong",
      });
      expect(blobs.getDeployStore).not.toHaveBeenCalled();
      expect(await store.getJSON("bag")).toEqual({ kind: "site" });
    },
  );

  it.each(["deploy-preview", "branch-deploy", "dev", "", "Production"])(
    "opens a store of the deploy for the context %j, never the friends' bag",
    async (context) => {
      const store = openStore(deploy(context));
      expect(blobs.getDeployStore).toHaveBeenCalledWith({
        name: "idealan",
        consistency: "strong",
      });
      expect(blobs.getStore).not.toHaveBeenCalled();
      expect(await store.getJSON("bag")).toEqual({ kind: "deploy" });
    },
  );

  it("reads as JSON and writes as JSON", async () => {
    const store = openStore(deploy("production"));
    await store.setJSON("steam/730", { name: "Counter-Strike 2" });
    const site = blobs.getStore.mock.results[0]?.value;
    expect(site.get).not.toHaveBeenCalled();
    await store.getJSON("steam/730");
    expect(site.get).toHaveBeenCalledWith("steam/730", { type: "json" });
    // Without a condition: the cache of Steam is written whatever was there.
    expect(site.setJSON).toHaveBeenCalledWith(
      "steam/730",
      { name: "Counter-Strike 2" },
      undefined,
    );
  });

  it("reads with the ETag and passes the condition of a write to Blobs", async () => {
    const store = openStore(deploy("production"));
    const site = blobs.getStore.mock.results[0]?.value;
    expect(await store.getVersioned("bag")).toEqual({
      value: { kind: "site" },
      etag: "etag-1",
    });
    expect(site.getWithMetadata).toHaveBeenCalledWith("bag", { type: "json" });
    expect(await store.setJSON("bag", {}, { onlyIfMatch: "etag-1" })).toBe(
      true,
    );
    expect(site.setJSON).toHaveBeenCalledWith(
      "bag",
      {},
      { onlyIfMatch: "etag-1" },
    );
    site.setJSON.mockResolvedValueOnce({ modified: false });
    expect(await store.setJSON("bag", {}, { onlyIfNew: true })).toBe(false);
  });

  it("answers null for a key that doesn't exist, and fails without an ETag", async () => {
    const store = openStore(deploy("production"));
    const site = blobs.getStore.mock.results[0]?.value;
    site.getWithMetadata.mockResolvedValueOnce(null);
    expect(await store.getVersioned("bag")).toBeNull();
    site.getWithMetadata.mockResolvedValueOnce({ data: {} });
    await expect(store.getVersioned("bag")).rejects.toThrow("ETag");
  });

  it("writes without condition in netlify dev, whose local server gives no ETag", async () => {
    const store = openStore(deploy("dev"));
    const site = blobs.getDeployStore.mock.results[0]?.value;
    site.getWithMetadata.mockResolvedValueOnce({ data: { count: 1 } });
    const read = await store.getVersioned("bag");
    expect(read?.value).toEqual({ count: 1 });
    await store.setJSON("bag", {}, { onlyIfMatch: read?.etag ?? "" });
    expect(site.setJSON).toHaveBeenLastCalledWith("bag", {}, undefined);
    // A real ETag keeps its condition, in netlify dev too.
    await store.setJSON("bag", {}, { onlyIfMatch: "etag-1" });
    expect(site.setJSON).toHaveBeenLastCalledWith(
      "bag",
      {},
      { onlyIfMatch: "etag-1" },
    );
  });
});

describe("updateJSON", () => {
  it("creates a key only if it doesn't exist yet", async () => {
    const { store, data } = memoryStore();
    const result = await updateJSON(store, "bag", (current) => ({
      write: { count: current === null ? 1 : 0 },
      result: "written",
    }));
    expect(result).toBe("written");
    expect(data.get("bag")).toEqual({ count: 1 });
  });

  it("answers without writing when the change decides so", async () => {
    const { store, data } = memoryStore({ bag: { count: 1 } });
    const setJSON = vi.spyOn(store, "setJSON");
    expect(await updateJSON(store, "bag", () => ({ result: "refused" }))).toBe(
      "refused",
    );
    expect(setJSON).not.toHaveBeenCalled();
    expect(data.get("bag")).toEqual({ count: 1 });
  });

  it("starts over when another friend wrote meanwhile, losing no write", async () => {
    const { store, data, write, onBeforeWrite } = memoryStore({
      bag: { count: 1 },
    });
    let other = true;
    onBeforeWrite(() => {
      // The other friend writes once, between the read and the write of this one.
      if (other) {
        other = false;
        write("bag", { count: 10 });
      }
    });
    const change = vi.fn((current: unknown) => {
      const count = (current as { count: number }).count + 1;
      return { write: { count }, result: count };
    });
    expect(await updateJSON(store, "bag", change)).toBe(11);
    expect(change).toHaveBeenCalledTimes(2);
    expect(data.get("bag")).toEqual({ count: 11 });
  });

  it("gives up after a few tries when the key keeps changing", async () => {
    const { store, write, onBeforeWrite } = memoryStore({ bag: {} });
    onBeforeWrite(() => write("bag", {}));
    await expect(
      updateJSON(store, "bag", () => ({ write: {}, result: null })),
    ).rejects.toBeInstanceOf(StoreBusyError);
  });
});
