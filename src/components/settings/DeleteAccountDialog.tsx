import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

export function DeleteAccountDialog({ onDelete }: { onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const handleDelete = () => {
    if (confirmText === "DELETE") {
      onDelete();
    }
  };

  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)}>
        Delete Account
      </Button>
      <Modal open={open} onClose={() => { setOpen(false); setConfirmText(""); }} title="Delete Account">
        <div className="space-y-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            This action cannot be undone. All your data will be permanently deleted.
          </p>
          <div className="space-y-1">
            <label className="block text-sm font-medium dark:text-zinc-300">Type DELETE to confirm</label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 border-zinc-300 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              placeholder="DELETE"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => { setOpen(false); setConfirmText(""); }}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete} disabled={confirmText !== "DELETE"}>Delete</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
