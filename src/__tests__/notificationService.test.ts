import { describe, it, expect, beforeEach } from "vitest";
import {
  getNotifications,
  getUnreadCount,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  notifySubscriptionExpiry,
  notifyNewRelease,
  notifyArtistApproved,
  notifyArtistRejected,
} from "@/lib/services/notificationService";

beforeEach(() => {
  localStorage.clear();
});

describe("notificationService.getNotifications", () => {
  it("returns empty array for new user", () => {
    expect(getNotifications("user1")).toEqual([]);
  });
});

describe("notificationService.createNotification", () => {
  it("creates and persists a notification", () => {
    const notif = createNotification({
      userId: "user1",
      type: "admin_announcement",
      title: "Test Title",
      message: "Test message",
    });

    expect(notif.id).toMatch(/^notif_/);
    expect(notif.title).toBe("Test Title");
    expect(notif.message).toBe("Test message");
    expect(notif.read).toBe(false);
    expect(notif.createdAt).toBeTruthy();

    const stored = getNotifications("user1");
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe(notif.id);
  });

  it("prepends new notifications to the list", () => {
    createNotification({
      userId: "user1",
      type: "admin_announcement",
      title: "First",
      message: "First message",
    });
    createNotification({
      userId: "user1",
      type: "new_release",
      title: "Second",
      message: "Second message",
    });

    const stored = getNotifications("user1");
    expect(stored).toHaveLength(2);
    expect(stored[0].title).toBe("Second");
    expect(stored[1].title).toBe("First");
  });

  it("isolates notifications per user", () => {
    createNotification({
      userId: "user1",
      type: "admin_announcement",
      title: "User1 Notif",
      message: "For user1",
    });
    createNotification({
      userId: "user2",
      type: "new_release",
      title: "User2 Notif",
      message: "For user2",
    });

    expect(getNotifications("user1")).toHaveLength(1);
    expect(getNotifications("user2")).toHaveLength(1);
    expect(getNotifications("user1")[0].title).toBe("User1 Notif");
    expect(getNotifications("user2")[0].title).toBe("User2 Notif");
  });
});

describe("notificationService.markAsRead", () => {
  it("sets read to true for the specified notification", () => {
    const notif = createNotification({
      userId: "user1",
      type: "admin_announcement",
      title: "Test",
      message: "Test",
    });

    expect(getNotifications("user1")[0].read).toBe(false);

    markAsRead("user1", notif.id);

    expect(getNotifications("user1")[0].read).toBe(true);
  });

  it("does not affect other notifications", () => {
    const n1 = createNotification({
      userId: "user1",
      type: "admin_announcement",
      title: "First",
      message: "First",
    });
    createNotification({
      userId: "user1",
      type: "new_release",
      title: "Second",
      message: "Second",
    });

    markAsRead("user1", n1.id);

    const stored = getNotifications("user1");
    expect(stored.find((n) => n.id === n1.id)?.read).toBe(true);
    expect(stored.find((n) => n.id !== n1.id)?.read).toBe(false);
  });
});

describe("notificationService.markAllAsRead", () => {
  it("marks all notifications as read", () => {
    createNotification({
      userId: "user1",
      type: "admin_announcement",
      title: "First",
      message: "First",
    });
    createNotification({
      userId: "user1",
      type: "new_release",
      title: "Second",
      message: "Second",
    });

    expect(getUnreadCount("user1")).toBe(2);

    markAllAsRead("user1");

    expect(getUnreadCount("user1")).toBe(0);
    expect(getNotifications("user1").every((n) => n.read)).toBe(true);
  });
});

describe("notificationService.deleteNotification", () => {
  it("removes the specified notification", () => {
    const n1 = createNotification({
      userId: "user1",
      type: "admin_announcement",
      title: "First",
      message: "First",
    });
    createNotification({
      userId: "user1",
      type: "new_release",
      title: "Second",
      message: "Second",
    });

    deleteNotification("user1", n1.id);

    const stored = getNotifications("user1");
    expect(stored).toHaveLength(1);
    expect(stored[0].title).toBe("Second");
  });
});

describe("notificationService.getUnreadCount", () => {
  it("returns 0 for new user", () => {
    expect(getUnreadCount("user1")).toBe(0);
  });

  it("counts only unread notifications", () => {
    createNotification({
      userId: "user1",
      type: "admin_announcement",
      title: "A",
      message: "A",
    });
    const n2 = createNotification({
      userId: "user1",
      type: "new_release",
      title: "B",
      message: "B",
    });
    createNotification({
      userId: "user1",
      type: "new_release",
      title: "C",
      message: "C",
    });

    markAsRead("user1", n2.id);

    expect(getUnreadCount("user1")).toBe(2);
  });
});

describe("notificationService role-based triggers", () => {
  it("notifySubscriptionExpiry creates notification when plan expiring within 7 days", () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);

    notifySubscriptionExpiry("user1", "silver", futureDate.toISOString());

    const stored = getNotifications("user1");
    expect(stored).toHaveLength(1);
    expect(stored[0].type).toBe("subscription_expiry");
    expect(stored[0].title).toBe("Subscription Expiring Soon");
    expect(stored[0].message).toContain("5 days");
  });

  it("notifySubscriptionExpiry does not create duplicate unread notifications", () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);

    notifySubscriptionExpiry("user1", "gold", futureDate.toISOString());
    notifySubscriptionExpiry("user1", "gold", futureDate.toISOString());

    expect(getNotifications("user1")).toHaveLength(1);
  });

  it("notifySubscriptionExpiry does not create notification for free plan", () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);

    notifySubscriptionExpiry("user1", "free", futureDate.toISOString());

    expect(getNotifications("user1")).toHaveLength(0);
  });

  it("notifyNewRelease creates notifications for all followers", () => {
    notifyNewRelease(["user1", "user2"], "Artist Name", "Album Title");

    expect(getNotifications("user1")).toHaveLength(1);
    expect(getNotifications("user2")).toHaveLength(1);
    expect(getNotifications("user1")[0].type).toBe("new_release");
    expect(getNotifications("user1")[0].message).toContain("Artist Name");
    expect(getNotifications("user1")[0].message).toContain("Album Title");
  });

  it("notifyArtistApproved creates approval notification", () => {
    notifyArtistApproved("user1", "Cool Artist");

    const stored = getNotifications("user1");
    expect(stored).toHaveLength(1);
    expect(stored[0].type).toBe("artist_approved");
    expect(stored[0].message).toContain("Cool Artist");
    expect(stored[0].link).toBe("/artist-dashboard");
  });

  it("notifyArtistRejected creates rejection notification with reason", () => {
    notifyArtistRejected("user1", "Incomplete portfolio");

    const stored = getNotifications("user1");
    expect(stored).toHaveLength(1);
    expect(stored[0].type).toBe("artist_rejected");
    expect(stored[0].message).toContain("Incomplete portfolio");
  });
});
