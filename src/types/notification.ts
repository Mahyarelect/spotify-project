export type NotificationType =
  | "subscription_expiry"
  | "new_release"
  | "artist_approved"
  | "artist_rejected"
  | "monthly_financial"
  | "ticket_update"
  | "announcement";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
}
