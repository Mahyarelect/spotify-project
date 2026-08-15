import { beforeEach, describe, expect, it, vi } from "vitest";

import { createListeningGroup, getListeningGroup, listeningSocketUrl } from "@/lib/services/listeningService";
import { jsonResponse } from "./apiFixtures";

const dto = {
  id: "11111111-1111-4111-8111-111111111111",
  invite_code: "invite-code",
  member_count: 2,
  created_at: "2026-08-15T00:00:00Z",
};

describe("listeningService", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("creates and resolves temporary groups through authenticated APIs", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async () => jsonResponse(dto, 201));

    const created = await createListeningGroup();
    await getListeningGroup("invite-code");

    expect(created).toEqual(expect.objectContaining({ inviteCode: "invite-code", memberCount: 2 }));
    expect(fetchMock.mock.calls[0][1]).toEqual(expect.objectContaining({ method: "POST" }));
    expect(fetchMock.mock.calls[1][0]).toContain("listening-groups/invite-code/");
  });

  it("builds a same-origin websocket URL", () => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    expect(listeningSocketUrl("abc")).toBe(`${protocol}//${window.location.host}/ws/listening/abc/`);
  });
});
