import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/lib/hooks/useAuth";
import { ProfileCard } from "@/components/profile/ProfileCard";
import * as userService from "@/lib/services/userService";
import { ROUTES } from "@/lib/constants/routes";
import type { PublicProfile, User } from "@/types/user";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function ProfilePage() {
  const { user, loading, refreshUser } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { username } = useParams();
  const [profileUser, setProfileUser] = useState<User | PublicProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [followPending, setFollowPending] = useState(false);
  const followPendingRef = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    async function loadProfile() {
      if (loading) return;
      setProfileLoading(true);
      setError(null);
      try {
        setProfileUser(
          username
            ? await userService.getUserByUsername(username, controller.signal)
            : user,
        );
      } catch (caught) {
        if (!controller.signal.aborted) {
          setError(caught instanceof Error ? caught.message : t.profile.loadError);
          setProfileUser(null);
        }
      } finally {
        if (!controller.signal.aborted) setProfileLoading(false);
      }
    }
    void loadProfile();
    return () => controller.abort();
  }, [username, user, loading, t.profile.loadError]);

  if (loading || profileLoading) {
    return <p className="py-12 text-center text-sm text-zinc-400">{t.profile.loading}</p>;
  }
  if (error) return <p role="alert" className="py-12 text-center text-sm text-red-400">{error}</p>;
  if (!profileUser) return <p className="py-12 text-center text-sm text-zinc-400">{t.profile.notFound}</p>;

  const viewerIsOwner = !username || user?.id === profileUser.id;
  const isFollowing = "isFollowing" in profileUser && profileUser.isFollowing;

  const handleFollow = async () => {
    if (!user || viewerIsOwner || followPendingRef.current) return;
    followPendingRef.current = true;
    setActionError(null);
    setFollowPending(true);
    try {
      const updated = await userService.followUser(profileUser.username);
      setProfileUser(updated);
      try {
        await refreshUser();
      } catch {
        setActionError(t.profile.followSyncError);
      }
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : t.profile.followError);
    } finally {
      followPendingRef.current = false;
      setFollowPending(false);
    }
  };

  const handleUnfollow = async () => {
    if (!user || viewerIsOwner || followPendingRef.current) return;
    followPendingRef.current = true;
    setActionError(null);
    setFollowPending(true);
    try {
      const updated = await userService.unfollowUser(profileUser.username);
      setProfileUser(updated);
      try {
        await refreshUser();
      } catch {
        setActionError(t.profile.followSyncError);
      }
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : t.profile.unfollowError);
    } finally {
      followPendingRef.current = false;
      setFollowPending(false);
    }
  };

  return (
    <>
      {actionError && (
        <p role="alert" className="mb-4 rounded-lg bg-red-950/30 p-3 text-sm text-red-400">
          {actionError}
        </p>
      )}
      <ProfileCard
        user={profileUser}
        viewerIsOwner={viewerIsOwner}
        onEdit={() => navigate(ROUTES.EDIT_PROFILE)}
        onFollow={handleFollow}
        onUnfollow={handleUnfollow}
        isFollowing={isFollowing}
        followPending={followPending}
      />
    </>
  );
}
