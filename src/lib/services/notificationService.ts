import { apiRequest } from "@/lib/api/httpClient";
import type { Notification, NotificationType } from "@/types/notification";

interface NotificationDto {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string;
  read: boolean;
  created_at: string;
}

function mapNotification(dto: NotificationDto): Notification {
  return {
    id: dto.id,
    type: dto.type,
    title: dto.title,
    message: dto.message,
    link: dto.link || undefined,
    read: dto.read,
    createdAt: dto.created_at,
  };
}

export async function getNotifications(): Promise<Notification[]> {
  const data = await apiRequest<NotificationDto[]>("notifications/");
  return data.map(mapNotification);
}

export async function getUnreadCount(): Promise<number> {
  const data = await apiRequest<{ count: number }>("notifications/unread-count/");
  return data.count;
}

export async function markAsRead(notificationId: string): Promise<void> {
  await apiRequest(`notifications/${notificationId}/read/`, { method: "POST" });
}

export async function markAllAsRead(): Promise<void> {
  await apiRequest("notifications/read-all/", { method: "POST" });
}

export async function deleteNotification(notificationId: string): Promise<void> {
  await apiRequest(`notifications/${notificationId}/`, { method: "DELETE" });
}
