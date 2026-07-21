import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useTranslation } from "@/lib/i18n/useTranslation";

export function DeleteAccountDialog({
  onDelete,
}: {
  onDelete: (currentPassword: string) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    if (deleting) return;
    setOpen(false);
    setConfirmText("");
    setCurrentPassword("");
    setError(null);
  };

  const handleDelete = async () => {
    if (confirmText !== "DELETE" || !currentPassword) return;
    setDeleting(true);
    setError(null);
    try {
      await onDelete(currentPassword);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to delete account.");
      setDeleting(false);
    }
  };

  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)}>
        {t.settings.deleteAccountButton}
      </Button>
      <Modal open={open} onClose={close} title={t.settings.deleteAccountTitle}>
        <div className="space-y-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{t.settings.deleteAccountWarning}</p>
          <div className="space-y-1">
            <label className="block text-sm font-medium dark:text-zinc-300">Current password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              autoComplete="current-password"
              disabled={deleting}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 border-zinc-300 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium dark:text-zinc-300">{t.settings.deleteAccountConfirmLabel}</label>
            <input
              type="text"
              value={confirmText}
              onChange={(event) => setConfirmText(event.target.value)}
              disabled={deleting}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 border-zinc-300 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              placeholder={t.settings.deleteAccountConfirmPlaceholder}
            />
          </div>
          {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={close} disabled={deleting}>{t.settings.cancel}</Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={deleting || confirmText !== "DELETE" || !currentPassword}
            >
              {deleting ? "Deleting…" : t.settings.delete}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
