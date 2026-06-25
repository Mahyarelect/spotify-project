import type { User } from "@/types/user";
import { User as UserIcon } from "lucide-react";

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
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow p-6 space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center overflow-hidden">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full object-cover" />
          ) : (
            <UserIcon size={32} className="text-zinc-400" />
          )}
        </div>
        <div>
          <h1 className="text-xl font-bold">{user.displayName}</h1>
          <p className="text-sm text-zinc-500">@{user.username}</p>
          <span
            className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${
              user.planTier === "gold"
                ? "bg-yellow-100 text-yellow-800"
                : user.planTier === "silver"
                  ? "bg-zinc-200 text-zinc-700"
                  : "bg-zinc-100 text-zinc-500"
            }`}
          >
            {user.planTier.charAt(0).toUpperCase() + user.planTier.slice(1)}
          </span>
        </div>
      </div>

      {user.bio && <p className="text-sm text-zinc-600 dark:text-zinc-400">{user.bio}</p>}

      <div className="flex gap-6 text-sm">
        <div>
          <span className="font-semibold">{user.followers.length}</span>{" "}
          <span className="text-zinc-500">Followers</span>
        </div>
        <div>
          <span className="font-semibold">{user.following.length}</span>{" "}
          <span className="text-zinc-500">Following</span>
        </div>
        <div>
          <span className="font-semibold">{streamsToday}</span>{" "}
          <span className="text-zinc-500">Streams today</span>
        </div>
      </div>

      <div className="flex gap-2">
        {viewerIsOwner ? (
          <button onClick={onEdit} className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg text-sm font-medium hover:bg-zinc-300 dark:hover:bg-zinc-600">
            Edit Profile
          </button>
        ) : (
          <button
            onClick={isFollowing ? onUnfollow : onFollow}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              isFollowing
                ? "bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            {isFollowing ? "Unfollow" : "Follow"}
          </button>
        )}
      </div>
    </div>
  );
}
