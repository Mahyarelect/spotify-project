import { useNavigate } from "react-router-dom";
import {
  Bell,
  CreditCard,
  Music,
  CheckCircle,
  XCircle,
  DollarSign,
  MessageSquare,
  UserCheck,
  Megaphone,
  Trash2,
} from "lucide-react";
import type { Notification, NotificationType } from "@/types/notification";

const TYPE_CONFIG: Record<
  NotificationType,
  { icon: typeof Bell; color: string; bg: string }
> = {
  subscription_expiry: {
    icon: CreditCard,
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
  },
  new_release: {
    icon: Music,
    color: "text-green-400",
    bg: "bg-green-400/10",
  },
  artist_approved: {
    icon: CheckCircle,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
  },
  artist_rejected: {
    icon: XCircle,
    color: "text-red-400",
    bg: "bg-red-400/10",
  },
  monthly_financial: {
    icon: DollarSign,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
  },
  new_ticket: {
    icon: MessageSquare,
    color: "text-orange-400",
    bg: "bg-orange-400/10",
  },
  artist_verification: {
    icon: UserCheck,
    color: "text-purple-400",
    bg: "bg-purple-400/10",
  },
  admin_announcement: {
    icon: Megaphone,
    color: "text-cyan-400",
    bg: "bg-cyan-400/10",
  },
};

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

interface NotificationCardProps {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}

export function NotificationCard({
  notification,
  onMarkRead,
  onDelete,
}: NotificationCardProps) {
  const navigate = useNavigate();
  const config = TYPE_CONFIG[notification.type];
  const Icon = config.icon;

  function handleClick() {
    if (!notification.read) {
      onMarkRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  }

  return (
    <div
      className={`group flex items-start gap-3 rounded-lg border px-4 py-3 transition ${
        notification.read
          ? "border-zinc-800 bg-zinc-900/30"
          : "border-l-4 border-zinc-800 border-l-green-400 bg-zinc-900/70"
      } ${notification.link ? "cursor-pointer hover:bg-zinc-800/50" : ""}`}
      onClick={handleClick}
      role={notification.link ? "button" : undefined}
      tabIndex={notification.link ? 0 : undefined}
    >
      <div
        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${config.bg}`}
      >
        <Icon size={18} className={config.color} />
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={`text-sm ${
            notification.read
              ? "font-medium text-zinc-300"
              : "font-semibold text-zinc-100"
          }`}
        >
          {notification.title}
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-zinc-400">
          {notification.message}
        </p>
        <p className="mt-1 text-[11px] text-zinc-600">
          {formatRelativeTime(notification.createdAt)}
        </p>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(notification.id);
        }}
        className="shrink-0 rounded p-1 text-zinc-600 opacity-0 transition hover:bg-zinc-800 hover:text-red-400 group-hover:opacity-100"
        aria-label="Delete notification"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
