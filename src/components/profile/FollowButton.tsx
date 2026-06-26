import { Button } from "@/components/ui/Button";

export function FollowButton({
  isFollowing,
  onFollow,
  onUnfollow,
}: {
  isFollowing: boolean;
  onFollow: () => void;
  onUnfollow: () => void;
}) {
  return (
    <Button variant={isFollowing ? "secondary" : "primary"} onClick={isFollowing ? onUnfollow : onFollow}>
      {isFollowing ? "Unfollow" : "Follow"}
    </Button>
  );
}
