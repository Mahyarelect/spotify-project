import { useState } from "react";
import { Upload, Music, X } from "lucide-react";

interface UploadAudioMockProps {
  onDurationParsed: (durationSec: number) => void;
}

export function UploadAudioMock({ onDurationParsed }: UploadAudioMockProps) {
  const [fileName, setFileName] = useState<string | null>(null);

  function handleMockUpload() {
    const name = `track_${Date.now()}.mp3`;
    setFileName(name);
    const mockDuration = Math.floor(Math.random() * 180) + 120;
    onDurationParsed(mockDuration);
  }

  function handleClear() {
    setFileName(null);
    onDurationParsed(0);
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-zinc-300">
        Audio File (Mock)
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
        <button
          type="button"
          onClick={handleMockUpload}
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-900/50 px-4 py-6 text-sm text-zinc-400 transition hover:border-green-500 hover:text-green-400"
        >
          <Upload size={20} />
          Click to upload audio file (mock)
        </button>
      )}
    </div>
  );
}
