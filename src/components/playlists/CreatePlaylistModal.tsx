import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/lib/i18n/useTranslation";

export function CreatePlaylistModal({
  open,
  onClose,
  onCreate,
  limitReached,
  limit,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (title: string, description?: string) => void;
  limitReached: boolean;
  limit: number | null;
}) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = () => {
    if (!title.trim()) return;
    onCreate(title.trim(), description.trim() || undefined);
    setTitle("");
    setDescription("");
  };

  return (
    <Modal open={open} onClose={onClose} title={t.playlists.createTitle}>
      <div className="space-y-4">
        {limitReached ? (
          <div className="space-y-2">
            <p className="text-sm text-red-400">
              {t.playlists.limitMessage.replace("{limit}", String(limit))}
            </p>
            <p className="text-xs text-zinc-400">
              {t.playlists.upgradeHint}
            </p>
            <div className="flex justify-end pt-2">
              <Button variant="secondary" onClick={onClose}>
                {t.playlists.close}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-zinc-300">
                {t.playlists.nameLabel}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t.playlists.namePlaceholder}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit();
                }}
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-zinc-300">
                {t.playlists.descriptionLabel}{" "}
                <span className="text-zinc-500">{t.playlists.descriptionOptional}</span>
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t.playlists.descriptionPlaceholder}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={onClose}>
                {t.playlists.cancel}
              </Button>
              <Button onClick={handleSubmit} disabled={!title.trim()}>
                {t.playlists.create}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
