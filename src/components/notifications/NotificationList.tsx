import type { Notification } from "@/types/notification";
import { NotificationCard } from "./NotificationCard";

interface NotificationListProps {
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}

export function NotificationList({
  notifications,
  onMarkRead,
  onDelete,
}: NotificationListProps) {
  return (
    <div className="space-y-2">
      {notifications.map((notification) => (
        <NotificationCard
          key={notification.id}
          notification={notification}
          onMarkRead={onMarkRead}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
