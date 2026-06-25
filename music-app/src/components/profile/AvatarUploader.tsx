import { useRef } from "react";
import { Camera, Upload } from "lucide-react";

export function AvatarUploader({
  currentUrl,
  disabled,
  onUpload,
}: {
  currentUrl: string | null;
  disabled: boolean;
  onUpload: (dataUrl: string) => void;
}) {
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
          <img src={currentUrl} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <Camera className="w-8 h-8 text-zinc-400" />
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} disabled={disabled} />
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50"
      >
        <Upload size={14} />
        {disabled ? "Upgrade to upload photo" : "Upload Photo"}
      </button>
      {disabled && (
        <p className="text-xs text-amber-600">Upgrade to Silver to add a profile photo</p>
      )}
    </div>
  );
}
