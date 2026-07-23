import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/lib/hooks/useAuth";
import { ProfileCard } from "@/components/profile/ProfileCard";
import * as userService from "@/lib/services/userService";
import { ROUTES } from "@/lib/constants/routes";
import type { PublicProfile, User } from "@/types/user";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { username } = useParams();
  const [profileUser, setProfileUser] = useState<User | PublicProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [followPending, setFollowPending] = useState(false);

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
    if (!user || viewerIsOwner) return;
    setError(null);
    setFollowPending(true);
    try {
      setProfileUser(await userService.followUser(profileUser.username));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t.profile.followError);
    } finally {
      setFollowPending(false);
    }
  };

  const handleUnfollow = async () => {
    if (!user || viewerIsOwner) return;
    setError(null);
    setFollowPending(true);
    try {
      setProfileUser(await userService.unfollowUser(profileUser.username));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t.profile.unfollowError);
    } finally {
      setFollowPending(false);
    }
  };

  return (
    <ProfileCard
      user={profileUser}
      viewerIsOwner={viewerIsOwner}
      onEdit={() => navigate(ROUTES.EDIT_PROFILE)}
      onFollow={handleFollow}
      onUnfollow={handleUnfollow}
      isFollowing={isFollowing}
      followPending={followPending}
    />
  );
}
