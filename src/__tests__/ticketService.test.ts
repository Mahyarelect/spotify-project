import { beforeEach, describe, expect, it, vi } from "vitest";
import { addTicketMessage, createTicket, getAllTickets, updateTicketStatus } from "@/lib/services/ticketService";
import { jsonResponse } from "./apiFixtures";

const ticket = {
  id: "55555555-5555-4555-8555-555555555555",
  created_by: "11111111-1111-4111-8111-111111111111",
  user_name: "Listener",
  assigned_to: null,
  subject: "Playback issue",
  status: "open" as const,
  priority: "high" as const,
  messages: [{
    id: "66666666-6666-4666-8666-666666666666",
    sender: "11111111-1111-4111-8111-111111111111",
    sender_name: "Listener",
    content: "Please help",
    created_at: "2026-08-15T00:00:00Z",
  }],
  created_at: "2026-08-15T00:00:00Z",
  updated_at: "2026-08-15T00:00:00Z",
};

describe("ticketService", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("loads and maps tickets", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse([ticket]));
    await expect(getAllTickets()).resolves.toEqual([
      expect.objectContaining({ userId: ticket.created_by, userName: "Listener", messages: [expect.objectContaining({ content: "Please help" })] }),
    ]);
  });

  it("creates, replies to, and manages tickets through backend endpoints", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async () => jsonResponse(ticket));
    await createTicket({ subject: "Playback issue", message: "Please help", priority: "high" });
    await addTicketMessage(ticket.id, "We are checking.");
    await updateTicketStatus(ticket.id, "resolved");
    expect(fetchMock.mock.calls.map(([url, init]) => [String(url), (init as RequestInit).method])).toEqual([
      [expect.stringContaining("/tickets/"), "POST"],
      [expect.stringContaining(`/tickets/${ticket.id}/messages/`), "POST"],
      [expect.stringContaining(`/support/tickets/${ticket.id}/`), "PATCH"],
    ]);
  });
});
