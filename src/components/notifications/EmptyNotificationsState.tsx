import { Bell } from "lucide-react";
import { useTranslation } from "@/lib/i18n/useTranslation";

export function EmptyNotificationsState() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-zinc-500">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800/50">
        <Bell size={28} className="text-zinc-600" />
      </div>
      <p className="text-sm font-medium">{t.notifications.emptyTitle}</p>
      <p className="text-xs text-zinc-600">
        {t.notifications.emptyDescription}
      </p>
    </div>
  );
}
