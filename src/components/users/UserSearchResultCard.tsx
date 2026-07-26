import { BadgeCheck, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { UserSearchResult } from "@/types/user";

export function UserSearchResultCard({
  result,
  currentUserId,
  pending,
  disabled,
  onToggleFollow,
}: {
  result: UserSearchResult;
  currentUserId: string;
  pending: boolean;
  disabled: boolean;
  onToggleFollow: (result: UserSearchResult) => void;
}) {
  const { t } = useTranslation();
  const profileUrl = `/profile/${encodeURIComponent(result.username)}`;

  return (
    <li className="flex min-w-0 flex-col gap-4 rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-800">
          {result.avatarUrl ? (
            <img src={result.avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <UserRound size={22} aria-hidden="true" className="text-zinc-400" />
          )}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link to={profileUrl} className="truncate font-semibold hover:text-green-400">
              {result.displayName}
            </Link>
            {result.role === "artist" && result.artistVerified && (
              <span
                aria-label={t.profile.verifiedArtist}
                title={t.profile.verifiedArtist}
                className="text-blue-400"
              >
                <BadgeCheck size={17} aria-hidden="true" />
              </span>
            )}
          </div>
          <p dir="ltr" className="w-fit truncate text-sm text-zinc-400">@{result.username}</p>
          <p className="mt-1 text-xs text-zinc-500">
            {t.profile.roles[result.role]} · {result.followersCount} {t.profile.followers}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        <Link
          to={profileUrl}
          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg border border-zinc-700 px-3 py-2 text-sm font-medium hover:bg-zinc-800 sm:flex-none"
        >
          {t.userSearch.viewProfile}
        </Link>
        {result.id !== currentUserId && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onToggleFollow(result)}
            className="min-h-11 flex-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-wait disabled:opacity-60 sm:flex-none"
          >
            {pending
              ? t.userSearch.updating
              : result.isFollowing
                ? t.profile.unfollow
                : t.profile.follow}
          </button>
        )}
      </div>
    </li>
  );
}
