import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/lib/hooks/useAuth";
import { ProfileCard } from "@/components/profile/ProfileCard";
import * as userService from "@/lib/services/userService";
import { ROUTES } from "@/lib/constants/routes";
import type { PublicProfile, User } from "@/types/user";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { username } = useParams();
  const [profileUser, setProfileUser] = useState<User | PublicProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          setError(caught instanceof Error ? caught.message : "Unable to load profile.");
          setProfileUser(null);
        }
      } finally {
        if (!controller.signal.aborted) setProfileLoading(false);
      }
    }
    void loadProfile();
    return () => controller.abort();
  }, [username, user, loading]);

  if (loading || profileLoading) {
    return <p className="py-12 text-center text-sm text-zinc-400">Loading profile…</p>;
  }
  if (error) return <p role="alert" className="py-12 text-center text-sm text-red-400">{error}</p>;
  if (!profileUser) return <p className="py-12 text-center text-sm text-zinc-400">Profile not found.</p>;

  const viewerIsOwner = !username || user?.id === profileUser.id;
  const isFollowing = "isFollowing" in profileUser && profileUser.isFollowing;

  const handleFollow = async () => {
    if (!user || viewerIsOwner) return;
    setError(null);
    try {
      setProfileUser(await userService.followUser(profileUser.username));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to follow this user.");
    }
  };

  const handleUnfollow = async () => {
    if (!user || viewerIsOwner) return;
    setError(null);
    try {
      setProfileUser(await userService.unfollowUser(profileUser.username));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to unfollow this user.");
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
      streamsToday={"streamsToday" in profileUser ? (profileUser.streamsToday ?? 0) : 0}
    />
  );
}
