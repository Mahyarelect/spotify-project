import type { Notification } from "@/types/notification";
import {
  getNotifications as readNotifications,
  saveNotifications,
} from "./storage";
import { MOCK_USERS } from "@/lib/mockData/users";

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `notif_${crypto.randomUUID()}`;
  }
  return `notif_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export function getNotifications(userId: string): Notification[] {
  return readNotifications(userId);
}

export function getUnreadCount(userId: string): number {
  return readNotifications(userId).filter((n) => !n.read).length;
}

export function markAsRead(userId: string, notificationId: string): void {
  const notifications = readNotifications(userId);
  const updated = notifications.map((n) =>
    n.id === notificationId ? { ...n, read: true } : n
  );
  saveNotifications(userId, updated);
}

export function markAllAsRead(userId: string): void {
  const notifications = readNotifications(userId);
  const updated = notifications.map((n) => ({ ...n, read: true }));
  saveNotifications(userId, updated);
}

export function deleteNotification(userId: string, notificationId: string): void {
  const notifications = readNotifications(userId);
  const updated = notifications.filter((n) => n.id !== notificationId);
  saveNotifications(userId, updated);
}

export function createNotification(
  data: Omit<Notification, "id" | "createdAt" | "read">
): Notification {
  const notification: Notification = {
    ...data,
    id: createId(),
    read: false,
    createdAt: new Date().toISOString(),
  };

  const existing = readNotifications(data.userId);
  saveNotifications(data.userId, [notification, ...existing]);
  return notification;
}

export function notifySubscriptionExpiry(userId: string, planTier: string, renewsAt: string): void {
  if (planTier === "free") return;

  const renewsDate = new Date(renewsAt);
  const now = new Date();
  const daysUntil = Math.ceil((renewsDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntil <= 7 && daysUntil > 0) {
    const existing = readNotifications(userId);
    const alreadyNotified = existing.some(
      (n) => n.type === "subscription_expiry" && !n.read
    );
    if (!alreadyNotified) {
      createNotification({
        userId,
        type: "subscription_expiry",
        title: "Subscription Expiring Soon",
        message: `Your ${planTier} plan expires in ${daysUntil} day${daysUntil === 1 ? "" : "s"}. Renew to keep your benefits.`,
        link: "/subscription",
      });
    }
  }
}

export function notifyNewRelease(followerIds: string[], artistName: string, albumTitle: string): void {
  for (const userId of followerIds) {
    createNotification({
      userId,
      type: "new_release",
      title: "New Release",
      message: `${artistName} just released "${albumTitle}". Listen now!`,
      link: "/albums",
    });
  }
}

export function notifyArtistApproved(userId: string, artistName: string): void {
  createNotification({
    userId,
    type: "artist_approved",
    title: "Artist Application Approved",
    message: `Congratulations! Your artist application as "${artistName}" has been approved. You can now access the artist dashboard.`,
    link: "/artist-dashboard",
  });
}

export function notifyArtistRejected(userId: string, reason: string): void {
  createNotification({
    userId,
    type: "artist_rejected",
    title: "Artist Application Update",
    message: `Your artist application was not approved. Reason: ${reason}. You may reapply.`,
    link: "/register-artist",
  });
}

export function notifyMonthlyFinancial(userId: string, month: string): void {
  createNotification({
    userId,
    type: "monthly_financial",
    title: "Monthly Financial Report",
    message: `Your financial report for ${month} is ready. Check your artist dashboard for details.`,
    link: "/artist-dashboard",
  });
}

export function notifyNewTicket(_ticketId: string): void {
  const supportUsers = MOCK_USERS.filter((u) => u.role === "support" || u.role === "admin");
  for (const user of supportUsers) {
    if (user.preferences.ticketUpdates) {
      createNotification({
        userId: user.id,
        type: "new_ticket",
        title: "New Support Ticket",
        message: "A new support ticket has been submitted and requires attention.",
        link: "/admin-dashboard",
      });
    }
  }
}

export function notifyArtistVerification(_applicationId: string, artistName: string): void {
  const supportUsers = MOCK_USERS.filter((u) => u.role === "support" || u.role === "admin");
  for (const user of supportUsers) {
    createNotification({
      userId: user.id,
      type: "artist_verification",
      title: "New Artist Verification Request",
      message: `Artist "${artistName}" has submitted a verification request and is awaiting review.`,
      link: "/admin-dashboard",
    });
  }
}

export function notifyAdminAnnouncement(userIds: string[], title: string, message: string): void {
  for (const userId of userIds) {
    createNotification({
      userId,
      type: "admin_announcement",
      title,
      message,
    });
  }
}
