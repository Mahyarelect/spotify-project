import { useRef } from "react";
import { Camera, Upload } from "lucide-react";
import { useTranslation } from "@/lib/i18n/useTranslation";

export function AvatarUploader({
  currentUrl,
  disabled,
  onUpload,
}: {
  currentUrl: string | null;
  disabled: boolean;
  onUpload: (dataUrl: string) => void;
}) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onUpload(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2">
      <div className="w-24 h-24 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center overflow-hidden">
        {currentUrl ? (
          <img src={currentUrl} alt={t.profile.avatarAlt} className="w-full h-full object-cover" />
        ) : (
          <Camera className="w-8 h-8 text-zinc-400" />
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} disabled={disabled} />
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50"
      >
        <Upload size={14} />
        {disabled ? t.profile.upgradeToUpload : t.profile.uploadPhoto}
      </button>
      {disabled && (
        <p className="text-xs text-amber-600 dark:text-amber-400">{t.profile.upgradeHint}</p>
      )}
    </div>
  );
}
