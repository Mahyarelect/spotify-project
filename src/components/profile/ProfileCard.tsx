import type { User } from "@/types/user";
import { User as UserIcon } from "lucide-react";
import { useTranslation } from "@/lib/i18n/useTranslation";

export function ProfileCard({
  user,
  viewerIsOwner,
  onEdit,
  onFollow,
  onUnfollow,
  isFollowing,
  streamsToday = 0,
}: {
  user: User;
  viewerIsOwner: boolean;
  onEdit?: () => void;
  onFollow?: () => void;
  onUnfollow?: () => void;
  isFollowing?: boolean;
  streamsToday?: number;
}) {
  const { t } = useTranslation();

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow p-6 space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="w-20 h-20 shrink-0 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center overflow-hidden">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full object-cover" />
          ) : (
            <UserIcon size={32} className="text-zinc-400" />
          )}
        </div>
        <div className="break-words">
          <h1 className="text-xl font-bold dark:text-white">{user.displayName}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 break-all">@{user.username}</p>
          <span
            className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${
              user.planTier === "gold"
                ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300"
                : user.planTier === "silver"
                  ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
            }`}
          >
            {user.planTier.charAt(0).toUpperCase() + user.planTier.slice(1)}
          </span>
        </div>
      </div>

      {user.bio && <p className="text-sm text-zinc-600 dark:text-zinc-400">{user.bio}</p>}

      <div className="flex gap-6 text-sm">
        <div>
          <span className="font-semibold dark:text-zinc-200">{user.followers.length}</span>{" "}
          <span className="text-zinc-500 dark:text-zinc-400">{t.profile.followers}</span>
        </div>
        <div>
          <span className="font-semibold dark:text-zinc-200">{user.following.length}</span>{" "}
          <span className="text-zinc-500 dark:text-zinc-400">{t.profile.following}</span>
        </div>
        <div>
          <span className="font-semibold dark:text-zinc-200">{streamsToday}</span>{" "}
          <span className="text-zinc-500 dark:text-zinc-400">{t.profile.streamsToday}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        {viewerIsOwner ? (
          <button onClick={onEdit} className="w-full rounded-lg bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600 sm:w-auto">
            {t.profile.editProfile}
          </button>
        ) : (
          <button
            onClick={isFollowing ? onUnfollow : onFollow}
            className={`w-full rounded-lg px-4 py-2 text-sm font-medium sm:w-auto ${
              isFollowing
                ? "bg-zinc-200 text-zinc-800 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            {isFollowing ? t.profile.unfollow : t.profile.follow}
          </button>
        )}
      </div>
    </div>
  );
}
