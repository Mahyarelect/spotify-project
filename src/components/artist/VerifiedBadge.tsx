import { BadgeCheck } from "lucide-react";
import { useTranslation } from "@/lib/i18n/useTranslation";

export function VerifiedBadge({ size = 16 }: { size?: number }) {
  const { t } = useTranslation();

  return (
    <span
      className="inline-flex items-center gap-1 text-green-400"
      title={t.artist.verified}
    >
      <BadgeCheck size={size} />
      <span className="text-xs font-medium">{t.artist.verifiedLabel}</span>
    </span>
  );
}
