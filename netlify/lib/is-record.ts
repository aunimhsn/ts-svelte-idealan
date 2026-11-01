// Whether a value read from JSON (a request, Steam, Blobs) is an object, not an array nor null.
export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
