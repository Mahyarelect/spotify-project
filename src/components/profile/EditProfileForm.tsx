import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { editProfileSchema } from "@/lib/validation/profileSchemas";
import type { User } from "@/types/user";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { AvatarUploader } from "./AvatarUploader";
import { useSubscriptionLimits } from "@/lib/hooks/useSubscriptionLimits";
import { useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";

export function EditProfileForm({
  user,
  onSave,
}: {
  user: User;
  onSave: (data: { displayName: string; bio?: string; avatarUrl?: string }) => void;
}) {
  const { t } = useTranslation();
  const limits = useSubscriptionLimits(user);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user.avatarUrl);
  const canUploadAvatar = limits.canUploadProfileImage;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(editProfileSchema),
    defaultValues: { displayName: user.displayName, bio: user.bio ?? "" },
  });

  const onSubmit = (data: { displayName: string; bio?: string }) => {
    onSave({
      ...data,
      avatarUrl: canUploadAvatar ? (avatarUrl ?? user.avatarUrl ?? undefined) : (user.avatarUrl ?? undefined),
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <AvatarUploader
        currentUrl={avatarUrl}
        disabled={!canUploadAvatar}
        onUpload={(dataUrl) => setAvatarUrl(dataUrl)}
      />
      <Input label={t.profile.displayNameLabel} error={errors.displayName?.message} {...register("displayName")} />
      <div className="space-y-1">
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t.profile.bioLabel}</label>
        <textarea
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-zinc-800 dark:border-zinc-600 dark:text-zinc-100 border-zinc-300"
          rows={3}
          {...register("bio")}
        />
        {errors.bio && <p className="text-sm text-red-500">{errors.bio.message}</p>}
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? t.profile.saving : t.profile.saveChanges}
      </Button>
    </form>
  );
}
