import { useState, useCallback } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "@/lib/services/notificationService";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/Button";
import { NotificationList } from "@/components/notifications/NotificationList";
import { EmptyNotificationsState } from "@/components/notifications/EmptyNotificationsState";
import type { Notification } from "@/types/notification";

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>(() =>
    user ? getNotifications(user.id) : []
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkRead = useCallback(
    (id: string) => {
      if (!user) return;
      markAsRead(user.id, id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    },
    [user]
  );

  const handleMarkAllRead = useCallback(() => {
    if (!user) return;
    markAllAsRead(user.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, [user]);

  const handleDelete = useCallback(
    (id: string) => {
      if (!user) return;
      deleteNotification(user.id, id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    },
    [user]
  );

  if (!user) return null;

  return (
    <PageShell>
      <PageHeader
        title="Notifications"
        description={
          unreadCount > 0
            ? `You have ${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
            : "All caught up"
        }
        actions={
          unreadCount > 0 ? (
            <Button variant="secondary" onClick={handleMarkAllRead}>
              Mark all as read
            </Button>
          ) : undefined
        }
      />

      {notifications.length === 0 ? (
        <EmptyNotificationsState />
      ) : (
        <NotificationList
          notifications={notifications}
          onMarkRead={handleMarkRead}
          onDelete={handleDelete}
        />
      )}
    </PageShell>
  );
}
