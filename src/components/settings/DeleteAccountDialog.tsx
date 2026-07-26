import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Input } from "@/components/ui/Input";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { ApiError } from "@/lib/api/apiError";

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
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!deleting && error) passwordRef.current?.focus();
  }, [deleting, error]);

  const close = useCallback(() => {
    if (deleting) return;
    setOpen(false);
    setConfirmText("");
    setCurrentPassword("");
    setError(null);
  }, [deleting]);

  const handleDelete = async () => {
    if (confirmText !== "DELETE" || !currentPassword) return;
    setDeleting(true);
    setError(null);
    try {
      await onDelete(currentPassword);
    } catch (caught) {
      setError(
        caught instanceof ApiError && caught.code === "invalid_current_password"
          ? t.settings.currentPasswordIncorrect
          : t.settings.deleteAccountFailed,
      );
      setDeleting(false);
    }
  };

  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)}>
        {t.settings.deleteAccountButton}
      </Button>
      <Modal
        open={open}
        onClose={close}
        title={t.settings.deleteAccountTitle}
        initialFocusRef={passwordRef}
        closeDisabled={deleting}
      >
        <div className="space-y-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{t.settings.deleteAccountWarning}</p>
          <PasswordInput
            ref={passwordRef}
            label={t.settings.currentPassword}
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            autoComplete="current-password"
            disabled={deleting}
            required
          />
          <Input
            id="delete-account-confirm"
            label={t.settings.deleteAccountConfirmLabel}
            type="text"
            dir="ltr"
            value={confirmText}
            onChange={(event) => setConfirmText(event.target.value)}
            disabled={deleting}
            autoComplete="off"
            autoCapitalize="characters"
            placeholder={t.settings.deleteAccountConfirmPlaceholder}
          />
          {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={close} disabled={deleting}>{t.settings.cancel}</Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={deleting || confirmText !== "DELETE" || !currentPassword}
            >
              {deleting ? t.settings.deleting : t.settings.delete}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
