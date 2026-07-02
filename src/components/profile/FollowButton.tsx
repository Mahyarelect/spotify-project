import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/lib/i18n/useTranslation";

export function FollowButton({
  isFollowing,
  onFollow,
  onUnfollow,
}: {
  isFollowing: boolean;
  onFollow: () => void;
  onUnfollow: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Button variant={isFollowing ? "secondary" : "primary"} onClick={isFollowing ? onUnfollow : onFollow}>
      {isFollowing ? t.profile.unfollow : t.profile.follow}
    </Button>
  );
}
