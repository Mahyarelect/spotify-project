export type NotificationType =
  | "subscription_expiry"
  | "new_release"
  | "artist_approved"
  | "artist_rejected"
  | "monthly_financial"
  | "new_ticket"
  | "artist_verification"
  | "admin_announcement";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
}
