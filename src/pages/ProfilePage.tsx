import { useAuth } from "@/lib/hooks/useAuth";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { ProfileCard } from "@/components/profile/ProfileCard";
import * as userService from "@/lib/services/userService";
import { ROUTES } from "@/lib/constants/routes";
import type { User } from "@/types/user";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { username } = useParams();
  const [streamsToday] = useState(12);
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      if (username) {
        const found = await userService.getUserByUsername(username);
        setProfileUser(found);
        if (user) {
          setIsFollowing(user.following.includes(found?.id ?? ""));
        }
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
    await userService.followUser(user.id, profileUser.id);
    setIsFollowing(true);
  };

  const handleUnfollow = async () => {
    if (!user) return;
    await userService.unfollowUser(user.id, profileUser.id);
    setIsFollowing(false);
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
        streamsToday={streamsToday}
      />
    </>
  );
}
