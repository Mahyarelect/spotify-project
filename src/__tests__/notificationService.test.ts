import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  deleteNotification,
  getNotifications,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
} from "@/lib/services/notificationService";
import { jsonResponse } from "./apiFixtures";

const notification = {
  id: "44444444-4444-4444-8444-444444444444",
  type: "announcement",
  title: "Hello",
  message: "World",
  link: "/",
  read: false,
  read_at: null,
  created_at: "2026-08-15T00:00:00Z",
};

describe("notificationService", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("loads and maps notifications from the backend", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse([notification]));
    await expect(getNotifications()).resolves.toEqual([
      expect.objectContaining({ id: notification.id, type: "announcement", createdAt: notification.created_at }),
    ]);
  });

  it("loads the unread count", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ count: 3 }));
    await expect(getUnreadCount()).resolves.toBe(3);
  });

  it("uses backend mutation endpoints", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 204 }));
    await markAsRead(notification.id);
    await markAllAsRead();
    await deleteNotification(notification.id);
    expect(fetchMock.mock.calls.map(([url, init]) => [String(url), (init as RequestInit).method])).toEqual([
      [expect.stringContaining(`/notifications/${notification.id}/read/`), "POST"],
      [expect.stringContaining("/notifications/read-all/"), "POST"],
      [expect.stringContaining(`/notifications/${notification.id}/`), "DELETE"],
    ]);
  });
});
