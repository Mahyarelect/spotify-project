import { BadgeCheck, User as UserIcon } from "lucide-react";
import { Link } from "react-router-dom";
import type { PublicProfile, User } from "@/types/user";
import { ROUTES } from "@/lib/constants/routes";
import { useTranslation } from "@/lib/i18n/useTranslation";

function isPrivateUser(user: User | PublicProfile): user is User {
  return "email" in user && "preferences" in user && "subscription" in user;
}

export function ProfileCard({
  user,
  viewerIsOwner,
  onEdit,
  onFollow,
  onUnfollow,
  isFollowing,
  followPending = false,
}: {
  user: User | PublicProfile;
  viewerIsOwner: boolean;
  onEdit?: () => void;
  onFollow?: () => void;
  onUnfollow?: () => void;
  isFollowing?: boolean;
  followPending?: boolean;
}) {
  const { t, language } = useTranslation();
  const privateUser = isPrivateUser(user) ? user : null;
  const plan = "subscription" in user ? user.subscription.plan : user.plan;
  const locale = language === "fa" ? "fa-IR" : "en-US";
  const formatDate = (value: string | null | undefined, dateOnly = false) => {
    if (!value) return t.profile.notAvailable;
    const date = new Date(dateOnly ? `${value}T00:00:00` : value);
    return Number.isNaN(date.getTime())
      ? t.profile.notAvailable
      : new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(date);
  };
  const roleLabel = t.profile.roles[user.role];

  return (
    <article className="space-y-6 rounded-xl bg-white p-4 shadow dark:bg-zinc-900 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.displayName} className="h-full w-full object-cover" />
          ) : (
            <UserIcon size={32} aria-hidden="true" className="text-zinc-400" />
          )}
        </div>
        <div className="min-w-0 break-words">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold dark:text-white">{user.displayName}</h1>
            {user.role === "artist" && user.artistVerified && (
              <span
                className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 px-2 py-1 text-xs font-semibold text-blue-400"
                aria-label={t.profile.verifiedArtist}
                title={t.profile.verifiedArtist}
              >
                <BadgeCheck size={16} aria-hidden="true" />
                {t.profile.verified}
              </span>
            )}
          </div>
          <p dir="ltr" className="w-fit break-all text-sm text-zinc-500 dark:text-zinc-400">
            @{user.username}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-full bg-zinc-800 px-2 py-1 text-xs font-medium text-zinc-300">
              {roleLabel}
            </span>
            <span
              className={`rounded-full px-2 py-1 text-xs font-medium ${
                plan === "gold"
                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                  : plan === "silver"
                    ? "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300"
                    : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
              }`}
            >
              {t.profile.plans[plan]}
            </span>
          </div>
        </div>
      </div>

      {user.bio && <p className="text-sm text-zinc-600 dark:text-zinc-400">{user.bio}</p>}

      <div className="grid grid-cols-2 gap-3 text-sm sm:flex sm:gap-6">
        <div>
          <span className="font-semibold dark:text-zinc-200">{user.followersCount}</span>{" "}
          <span className="text-zinc-500 dark:text-zinc-400">{t.profile.followers}</span>
        </div>
        <div>
          <span className="font-semibold dark:text-zinc-200">{user.followingCount}</span>{" "}
          <span className="text-zinc-500 dark:text-zinc-400">{t.profile.following}</span>
        </div>
        {privateUser && (
          <div className="col-span-2">
            <span className="font-semibold dark:text-zinc-200">
              {typeof privateUser.streamsToday === "number"
                ? new Intl.NumberFormat(locale).format(privateUser.streamsToday)
                : t.profile.notAvailable}
            </span>{" "}
            <span className="text-zinc-500 dark:text-zinc-400">{t.profile.streamsToday}</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        {viewerIsOwner ? (
          <button
            onClick={onEdit}
            className="min-h-11 w-full rounded-lg bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600 sm:w-auto"
          >
            {t.profile.editProfile}
          </button>
        ) : (
          <button
            onClick={isFollowing ? onUnfollow : onFollow}
            disabled={followPending}
            className={`min-h-11 w-full rounded-lg px-4 py-2 text-sm font-medium disabled:cursor-wait disabled:opacity-60 sm:w-auto ${
              isFollowing
                ? "bg-zinc-200 text-zinc-800 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            {isFollowing ? t.profile.unfollow : t.profile.follow}
          </button>
        )}
      </div>

      {viewerIsOwner && privateUser && (
        <section aria-labelledby="account-details-title" className="border-t border-zinc-200 pt-5 dark:border-zinc-800">
          <h2 id="account-details-title" className="text-lg font-semibold">
            {t.profile.accountDetails}
          </h2>
          <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
            <Detail label={t.profile.email} value={privateUser.email} ltr />
            <Detail label={t.profile.username} value={`@${privateUser.username}`} ltr />
            <Detail label={t.profile.displayNameLabel} value={privateUser.displayName} />
            <Detail label={t.profile.role} value={roleLabel} />
            <Detail label={t.profile.birthDate} value={formatDate(privateUser.birthDate, true)} />
            <Detail label={t.profile.gender} value={t.profile.genders[privateUser.gender]} />
            {privateUser.role === "artist" && (
              <Detail
                label={t.profile.verificationStatus}
                value={privateUser.artistVerified ? t.profile.verified : t.profile.notVerified}
              />
            )}
            <Detail label={t.profile.subscriptionPlan} value={t.profile.plans[privateUser.subscription.plan]} />
            <Detail
              label={t.profile.subscriptionStatus}
              value={t.profile.subscriptionStatuses[privateUser.subscription.status]}
            />
            <Detail
              label={t.profile.subscriptionStart}
              value={formatDate(privateUser.subscription.startsAt)}
            />
            <Detail
              label={t.profile.subscriptionExpiry}
              value={formatDate(privateUser.subscription.expiresAt)}
            />
          </dl>
          {privateUser.role === "listener" && (
            <Link
              to={ROUTES.SUBSCRIPTION}
              className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              {t.profile.manageSubscription}
            </Link>
          )}
        </section>
      )}
    </article>
  );
}

function Detail({ label, value, ltr = false }: { label: string; value: string; ltr?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd dir={ltr ? "ltr" : undefined} className={`mt-1 break-words font-medium ${ltr ? "w-fit" : ""}`}>
        {value}
      </dd>
    </div>
  );
}
