import { Bell } from "lucide-react";

export function EmptyNotificationsState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-zinc-500">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800/50">
        <Bell size={28} className="text-zinc-600" />
      </div>
      <p className="text-sm font-medium">No notifications yet</p>
      <p className="text-xs text-zinc-600">
        You&apos;ll see notifications here when there&apos;s activity.
      </p>
    </div>
  );
}
