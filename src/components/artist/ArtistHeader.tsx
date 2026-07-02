import { User as UserIcon } from "lucide-react";
import type { User } from "@/types/user";
import { VerifiedBadge } from "./VerifiedBadge";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface ArtistHeaderProps {
  artist: User;
  isVerified: boolean;
  isFollowing: boolean;
  isOwnProfile: boolean;
  onFollow: () => void;
  onUnfollow: () => void;
}

export function ArtistHeader({
  artist,
  isVerified,
  isFollowing,
  isOwnProfile,
  onFollow,
  onUnfollow,
}: ArtistHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
      <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-zinc-800">
        {artist.avatarUrl ? (
          <img
            src={artist.avatarUrl}
            alt={artist.displayName}
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          <UserIcon size={48} className="text-zinc-500" />
        )}
      </div>

      <div className="flex-1 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">
            {artist.displayName}
          </h1>
          {isVerified && <VerifiedBadge size={20} />}
        </div>

        <p className="text-sm text-zinc-400">@{artist.username}</p>

        {artist.bio && (
          <p className="max-w-lg text-sm leading-relaxed text-zinc-300">
            {artist.bio}
          </p>
        )}

        <div className="flex items-center gap-6 text-sm">
          <div>
            <span className="font-semibold text-zinc-100">
              {artist.followers.length}
            </span>{" "}
            <span className="text-zinc-400">{t.artist.followers}</span>
          </div>
          <div>
            <span className="font-semibold text-zinc-100">
              {artist.following.length}
            </span>{" "}
            <span className="text-zinc-400">{t.profile.following}</span>
          </div>
        </div>

        {!isOwnProfile && (
          <button
            onClick={isFollowing ? onUnfollow : onFollow}
            className={`rounded-lg px-5 py-2 text-sm font-medium transition ${
              isFollowing
                ? "bg-zinc-700 text-zinc-200 hover:bg-zinc-600"
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
