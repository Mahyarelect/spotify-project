import { useAuth } from "@/lib/hooks/useAuth";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { ProfileCard } from "@/components/profile/ProfileCard";
import * as userService from "@/lib/services/userService";
import { ROUTES } from "@/lib/constants/routes";
import type { PublicProfile, User } from "@/types/user";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { username } = useParams();
  const [profileUser, setProfileUser] = useState<User | PublicProfile | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      if (username) {
        const found = await userService.getUserByUsername(username);
        setProfileUser(found);
        setIsFollowing(found.isFollowing);
      } else {
        setProfileUser(user);
      }
    }
    if (!loading) loadProfile();
  }, [username, user, loading]);

  if (loading || !profileUser) return null;

  const viewerIsOwner = !username || (user?.id === profileUser.id);

  const handleFollow = async () => {
    if (!user) return;
    const updated = await userService.followUser(profileUser.username);
    setProfileUser(updated);
    setIsFollowing(updated.isFollowing);
  };

  const handleUnfollow = async () => {
    if (!user) return;
    const updated = await userService.unfollowUser(profileUser.username);
    setProfileUser(updated);
    setIsFollowing(updated.isFollowing);
  };

  return (
    <>
      <ProfileCard
        user={profileUser}
        viewerIsOwner={viewerIsOwner}
        onEdit={() => navigate(ROUTES.EDIT_PROFILE)}
        onFollow={handleFollow}
        onUnfollow={handleUnfollow}
        isFollowing={isFollowing}
        streamsToday={"streamsToday" in profileUser ? (profileUser.streamsToday ?? 0) : 0}
      />
    </>
  );
}
