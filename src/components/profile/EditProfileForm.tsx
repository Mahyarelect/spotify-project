import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { editProfileSchema } from "@/lib/validation/profileSchemas";
import type { Gender, User } from "@/types/user";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { AvatarUploader } from "./AvatarUploader";
import { useSubscriptionLimits } from "@/lib/hooks/useSubscriptionLimits";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface ProfileFormData {
  displayName: string;
  bio?: string;
  birthDate: string;
  gender: Gender;
}

export function EditProfileForm({
  user,
  onSave,
}: {
  user: User;
  onSave: (data: ProfileFormData & { avatar?: File }) => Promise<void>;
}) {
  const { t } = useTranslation();
  const limits = useSubscriptionLimits(user);
  const [avatar, setAvatar] = useState<File | undefined>();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      displayName: user.displayName,
      bio: user.bio ?? "",
      birthDate: user.birthDate ?? "",
      gender: user.gender,
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    setSubmitError(null);
    try {
      await onSave({ ...data, avatar: limits.canUploadProfileImage ? avatar : undefined });
    } catch (caught) {
      setSubmitError(caught instanceof Error ? caught.message : "Unable to save profile.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <AvatarUploader
        currentUrl={user.avatarUrl}
        disabled={!limits.canUploadProfileImage || isSubmitting}
        onUpload={setAvatar}
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
      <Input label="Birth date" type="date" error={errors.birthDate?.message} {...register("birthDate")} />
      <div className="space-y-1">
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Gender</label>
        <select
          {...register("gender")}
          className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-zinc-800 dark:border-zinc-600 dark:text-zinc-100 border-zinc-300"
        >
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
          <option value="unspecified">Prefer not to say</option>
        </select>
      </div>
      {submitError && <p role="alert" className="text-sm text-red-500">{submitError}</p>}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? t.profile.saving : t.profile.saveChanges}
      </Button>
    </form>
  );
}
