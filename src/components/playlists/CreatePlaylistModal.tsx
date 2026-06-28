import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

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
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = () => {
    if (!title.trim()) return;
    onCreate(title.trim(), description.trim() || undefined);
    setTitle("");
    setDescription("");
  };

  return (
    <Modal open={open} onClose={onClose} title="Create Playlist">
      <div className="space-y-4">
        {limitReached ? (
          <div className="space-y-2">
            <p className="text-sm text-red-400">
              You&apos;ve reached the maximum of {limit} playlists for your
              subscription plan.
            </p>
            <p className="text-xs text-zinc-400">
              Upgrade your plan to create more playlists.
            </p>
            <div className="flex justify-end pt-2">
              <Button variant="secondary" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-zinc-300">
                Playlist Name
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="My new playlist"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit();
                }}
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-zinc-300">
                Description{" "}
                <span className="text-zinc-500">(optional)</span>
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A short description..."
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={!title.trim()}>
                Create
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
