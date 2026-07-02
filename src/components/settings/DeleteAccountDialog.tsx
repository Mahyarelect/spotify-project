import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useTranslation } from "@/lib/i18n/useTranslation";

export function DeleteAccountDialog({ onDelete }: { onDelete: () => void }) {
  const { t } = useTranslation();
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
        {t.settings.deleteAccountButton}
      </Button>
      <Modal open={open} onClose={() => { setOpen(false); setConfirmText(""); }} title={t.settings.deleteAccountTitle}>
        <div className="space-y-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {t.settings.deleteAccountWarning}
          </p>
          <div className="space-y-1">
            <label className="block text-sm font-medium dark:text-zinc-300">{t.settings.deleteAccountConfirmLabel}</label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 border-zinc-300 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              placeholder={t.settings.deleteAccountConfirmPlaceholder}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => { setOpen(false); setConfirmText(""); }}>{t.settings.cancel}</Button>
            <Button variant="danger" onClick={handleDelete} disabled={confirmText !== "DELETE"}>{t.settings.delete}</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
