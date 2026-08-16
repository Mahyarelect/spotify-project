import { useState } from "react";
import { Upload, Music, X } from "lucide-react";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface UploadAudioUploaderProps {
  onDurationParsed: (durationSec: number) => void;
  onFileSelected: (file?: File) => void;
}

export function UploadAudioUploader({ onDurationParsed, onFileSelected }: UploadAudioUploaderProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const { t } = useTranslation();

  function handleUpload(file?: File) {
    if (!file) return;
    setFileName(file.name);
    onFileSelected(file);
    const audio = document.createElement("audio");
    audio.preload = "metadata";
    audio.onloadedmetadata = () => {
      onDurationParsed(Math.max(1, Math.round(audio.duration)));
      URL.revokeObjectURL(audio.src);
    };
    audio.src = URL.createObjectURL(file);
  }

  function handleClear() {
    setFileName(null);
    onFileSelected(undefined);
    onDurationParsed(0);
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-zinc-300">
        {t.workForm.audioFileLabel}
      </label>
      {fileName ? (
        <div className="flex items-center gap-3 rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-3">
          <Music size={18} className="text-green-400" />
          <span className="flex-1 truncate text-sm text-zinc-200">
            {fileName}
          </span>
          <button
            type="button"
            onClick={handleClear}
            className="text-zinc-500 hover:text-red-400"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <label
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-900/50 px-4 py-6 text-sm text-zinc-400 transition hover:border-green-500 hover:text-green-400"
        >
          <Upload size={20} />
          {t.workForm.audioFileCta}
          <input
            type="file"
            accept=".mp3,.wav,.flac,audio/mpeg,audio/wav,audio/flac"
            className="sr-only"
            onChange={(event) => handleUpload(event.target.files?.[0])}
          />
        </label>
      )}
    </div>
  );
}
