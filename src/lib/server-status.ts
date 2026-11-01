// Asks the ping function whether the server part answers.
export type ServerStatus = "checking" | "ok" | "error";

export const pingServer = async (
  fetcher: typeof fetch = fetch,
): Promise<ServerStatus> => {
  try {
    const response = await fetcher("/api/ping");
    if (!response.ok) return "error";
    const body: unknown = await response.json();
    return typeof body === "object" &&
      body !== null &&
      "ok" in body &&
      body.ok === true
      ? "ok"
      : "error";
  } catch {
    return "error";
  }
};
