import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  approveApplication,
  getPendingApplications,
  rejectApplication,
} from "@/lib/services/adminService";
import { jsonResponse } from "./apiFixtures";

const application = {
  id: "44444444-4444-4444-8444-444444444444",
  email: "artist@example.com",
  artist_name: "Artist",
  portfolio_url: "https://example.com/portfolio",
  status: "pending" as const,
  rejection_reason: "",
  submitted_at: "2026-07-21T00:00:00Z",
  reviewed_at: null,
};

describe("adminService artist review", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("loads pending applications from the protected backend API", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse([application]));

    const applications = await getPendingApplications();

    expect(applications[0]).toEqual(expect.objectContaining({
      id: application.id,
      artistName: "Artist",
      portfolioUrl: "https://example.com/portfolio",
    }));
    expect(fetchMock.mock.calls[0][0]).toContain("?status=pending");
  });

  it("approves and rejects applications through review endpoints", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
      jsonResponse({ ...application, status: "approved" }),
    );

    await approveApplication(application.id);
    await rejectApplication(application.id, "Needs more work.");

    expect((fetchMock.mock.calls[0][1] as RequestInit).method).toBe("POST");
    expect(JSON.parse((fetchMock.mock.calls[1][1] as RequestInit).body as string)).toEqual({
      reason: "Needs more work.",
    });
  });
});
