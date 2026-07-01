import { useState } from "react";
import { X } from "lucide-react";
import type { Song, Album } from "@/types/music";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { UploadAudioMock } from "./UploadAudioMock";
import { CoverUploader } from "./CoverUploader";

export type WorkType = "single" | "album";

export interface WorkFormData {
  title: string;
  genre: string;
  releaseYear: string;
  collaborators: string;
  lyrics: string;
  durationSec: number;
  coverColor: string;
  releaseDate: string;
  isEarlyAccess: boolean;
}

interface WorkFormProps {
  type: WorkType;
  initialData?: Song | Album;
  onSubmit: (data: WorkFormData) => void;
  onCancel: () => void;
}

const GENRES = [
  "Pop", "Rock", "Hip Hop", "R&B", "Electronic",
  "Jazz", "Classical", "Country", "Folk", "Metal",
  "Indie", "Alternative", "Reggae", "Blues", "Other",
];

export function WorkForm({ type, initialData, onSubmit, onCancel }: WorkFormProps) {
  const isEdit = !!initialData;
  const isSong = type === "single";

  const existingSong = isSong ? (initialData as Song) : undefined;
  const existingAlbum = !isSong ? (initialData as Album) : undefined;

  const [form, setForm] = useState<WorkFormData>({
    title: initialData?.title ?? "",
    genre: (initialData as Song)?.genre ?? (initialData as Album)?.genre ?? "",
    releaseYear: existingSong?.releaseYear?.toString() ?? new Date().getFullYear().toString(),
    collaborators: existingSong?.collaborators?.join(", ") ?? "",
    lyrics: existingSong?.lyrics ?? "",
    durationSec: existingSong?.durationSec ?? 0,
    coverColor: initialData?.coverColor ?? "#1a1a2e",
    releaseDate: existingAlbum?.releaseDate ?? new Date().toISOString().split("T")[0],
    isEarlyAccess: existingAlbum?.isEarlyAccess ?? false,
  });

  function update<K extends keyof WorkFormData>(key: K, value: WorkFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(form);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">
            {isEdit ? "Edit" : "New"} {isSong ? "Single" : "Album"}
          </h2>
          <button
            onClick={onCancel}
            className="rounded-full p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder={isSong ? "Song title" : "Album title"}
            required
          />

          <div className="space-y-1">
            <label className="block text-sm font-medium text-zinc-300">
              Genre
            </label>
            <select
              value={form.genre}
              onChange={(e) => update("genre", e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-green-500 focus:outline-none"
            >
              <option value="">Select genre</option>
              {GENRES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {isSong && (
            <>
              <Input
                label="Release Year"
                type="number"
                value={form.releaseYear}
                onChange={(e) => update("releaseYear", e.target.value)}
                min="1900"
                max="2099"
              />
              <Input
                label="Collaborators"
                value={form.collaborators}
                onChange={(e) => update("collaborators", e.target.value)}
                placeholder="Comma-separated names"
              />
              <UploadAudioMock
                onDurationParsed={(dur) => update("durationSec", dur)}
              />
              <div className="space-y-1">
                <label className="block text-sm font-medium text-zinc-300">
                  Lyrics
                </label>
                <textarea
                  value={form.lyrics}
                  onChange={(e) => update("lyrics", e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-green-500 focus:outline-none"
                  placeholder="Paste lyrics here..."
                />
              </div>
            </>
          )}

          {!isSong && (
            <>
              <Input
                label="Release Date"
                type="date"
                value={form.releaseDate}
                onChange={(e) => update("releaseDate", e.target.value)}
              />
              <label className="flex items-center gap-2 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={form.isEarlyAccess}
                  onChange={(e) => update("isEarlyAccess", e.target.checked)}
                  className="rounded border-zinc-600 bg-zinc-800 text-green-500 focus:ring-green-500"
                />
                Early Access (Gold only)
              </label>
            </>
          )}

          <CoverUploader
            value={form.coverColor}
            onChange={(color) => update("coverColor", color)}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              {isEdit ? "Save Changes" : `Publish ${isSong ? "Single" : "Album"}`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
