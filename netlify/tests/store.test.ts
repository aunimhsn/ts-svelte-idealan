import { beforeEach, describe, expect, it, vi } from "vitest";

// The two kinds of store, replaced so as to see which one each deploy opens.
const blobs = vi.hoisted(() => {
  const fakeStore = (kind: string) => ({
    kind,
    get: vi.fn(async () => ({ kind })),
    setJSON: vi.fn(async () => ({ modified: true })),
  });
  return {
    getStore: vi.fn(() => fakeStore("site")),
    getDeployStore: vi.fn(() => fakeStore("deploy")),
  };
});
vi.mock("@netlify/blobs", () => blobs);

const { openStore } = await import("../lib/store");

const deploy = (context: string) => ({
  deploy: { context, id: "test", published: false },
});

describe("openStore", () => {
  beforeEach(() => vi.clearAllMocks());

  it("opens the site-wide store in production only", async () => {
    const store = openStore(deploy("production"));
    expect(blobs.getStore).toHaveBeenCalledWith({
      name: "idealan",
      consistency: "strong",
    });
    expect(blobs.getDeployStore).not.toHaveBeenCalled();
    expect(await store.getJSON("bag")).toEqual({ kind: "site" });
  });

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
    expect(site.setJSON).toHaveBeenCalledWith("steam/730", {
      name: "Counter-Strike 2",
    });
  });
});
