import { BadgeCheck } from "lucide-react";

export function VerifiedBadge({ size = 16 }: { size?: number }) {
  return (
    <span
      className="inline-flex items-center gap-1 text-green-400"
      title="Verified Artist"
    >
      <BadgeCheck size={size} />
      <span className="text-xs font-medium">Verified</span>
    </span>
  );
}
