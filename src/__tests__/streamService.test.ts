import { beforeEach, describe, expect, it, vi } from "vitest";
import { canStream, getStreamStatus, getTodayStreamCount, recordStream } from "@/lib/services/streamService";
import { jsonResponse } from "./apiFixtures";

describe("streamService", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("reads the server-enforced stream status", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async () => jsonResponse({ streams_today: 12, daily_limit: 60, can_stream: true }));
    await expect(getStreamStatus()).resolves.toEqual({ streams_today: 12, daily_limit: 60, can_stream: true });
    await expect(getTodayStreamCount()).resolves.toBe(12);
  });

  it("uses the backend can_stream decision", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ streams_today: 60, daily_limit: 60, can_stream: false }));
    await expect(canStream()).resolves.toBe(false);
  });

  it("records the selected song through the API", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}, 201));
    await recordStream("song-1");
    expect((fetchMock.mock.calls[0][1] as RequestInit).method).toBe("POST");
    expect(JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string)).toEqual({ song_id: "song-1" });
  });

  it("fails open only when the status endpoint is unavailable", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));
    await expect(canStream()).resolves.toBe(true);
  });
});
