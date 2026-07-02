import { useState } from "react";
import { ImageIcon, X } from "lucide-react";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface CoverUploaderProps {
  value: string;
  onChange: (coverColor: string) => void;
}

const COVER_COLORS = [
  "#1a1a2e", "#16213e", "#0f3460", "#533483",
  "#2d132c", "#3c1642", "#1b1b2f", "#1a1a40",
  "#0d1b2a", "#1b263b", "#415a77", "#778da9",
];

export function CoverUploader({ value, onChange }: CoverUploaderProps) {
  const [showPicker, setShowPicker] = useState(false);
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-zinc-300">
        {t.workForm.coverArtLabel}
      </label>
      <div className="flex items-start gap-4">
        <div
          className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: value || "#27272a" }}
        >
          {value ? (
            <ImageIcon size={32} className="text-white/40" />
          ) : (
            <ImageIcon size={32} className="text-zinc-600" />
          )}
        </div>
        <div className="flex-1 space-y-2">
          <button
            type="button"
            onClick={() => setShowPicker((v) => !v)}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-700"
          >
            {value ? t.workForm.changeColor : t.workForm.pickColor}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="ml-2 text-sm text-zinc-500 hover:text-red-400"
            >
              <X size={14} className="inline" /> {t.workForm.remove}
            </button>
          )}
          {showPicker && (
            <div className="grid grid-cols-6 gap-2 pt-2">
              {COVER_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => {
                    onChange(color);
                    setShowPicker(false);
                  }}
                  className={`h-8 w-8 rounded-lg border-2 transition ${
                    value === color
                      ? "border-green-400 scale-110"
                      : "border-transparent hover:border-zinc-500"
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
