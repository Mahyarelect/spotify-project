import { useEffect, useRef, useState } from "react";
import { Camera, Upload } from "lucide-react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { validateAvatarFile } from "@/lib/validation/profileSchemas";

export function AvatarUploader({
  currentUrl,
  disabled,
  onUpload,
}: {
  currentUrl: string | null;
  disabled: boolean;
  onUpload: (file: File) => void;
}) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const validationError = validateAvatarFile(file);
    if (validationError) {
      setError(validationError);
      event.target.value = "";
      return;
    }
    const nextPreview = URL.createObjectURL(file);
    setPreviewUrl(nextPreview);
    setError(null);
    onUpload(file);
  };

  return (
    <div className="space-y-2">
      <div className="w-24 h-24 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center overflow-hidden">
        {previewUrl || currentUrl ? (
          <img src={previewUrl ?? currentUrl ?? ""} alt={t.profile.avatarAlt} className="w-full h-full object-cover" />
        ) : (
          <Camera className="w-8 h-8 text-zinc-400" />
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleChange}
        disabled={disabled}
        aria-label={t.profile.uploadPhoto}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50"
      >
        <Upload size={14} />
        {disabled ? t.profile.upgradeToUpload : t.profile.uploadPhoto}
      </button>
      {disabled && <p className="text-xs text-amber-600 dark:text-amber-400">{t.profile.upgradeHint}</p>}
      {error && <p role="alert" className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
