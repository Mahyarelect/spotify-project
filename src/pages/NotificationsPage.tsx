import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
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
  const { t } = useTranslation();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    getNotifications()
      .then((items) => {
        setNotifications(items);
        setError(null);
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Unable to load notifications."));
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkRead = useCallback(
    async (id: string) => {
      if (!user) return;
      try {
        await markAsRead(id);
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Unable to update notification.");
      }
    },
    [user]
  );

  const handleMarkAllRead = useCallback(async () => {
    if (!user) return;
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update notifications.");
    }
  }, [user]);

  const handleDelete = useCallback(
    async (id: string) => {
      if (!user) return;
      try {
        await deleteNotification(id);
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Unable to delete notification.");
      }
    },
    [user]
  );

  if (!user) return null;

  return (
    <PageShell>
      <PageHeader
        title={t.notifications.title}
        description={
          unreadCount > 0
            ? t.notifications.unreadCount.replace("{count}", String(unreadCount))
            : t.notifications.allCaughtUp
        }
        actions={
          unreadCount > 0 ? (
            <Button variant="secondary" onClick={handleMarkAllRead}>
              {t.notifications.markAllRead}
            </Button>
          ) : undefined
        }
      />

      {error && <p role="alert" className="rounded-lg bg-red-950/50 p-3 text-sm text-red-300">{error}</p>}

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
