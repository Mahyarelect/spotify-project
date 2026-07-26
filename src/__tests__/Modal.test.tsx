import { useRef, useState } from "react";
import { expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Modal } from "@/components/ui/Modal";
import { DeleteAccountDialog } from "@/components/settings/DeleteAccountDialog";
import { ApiError } from "@/lib/api/apiError";

function ModalHarness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>Open dialog</button>
      <Modal open={open} onClose={() => setOpen(false)} title="Test dialog">
        <label>
          Name
          <input />
        </label>
        <button type="button">Save</button>
      </Modal>
    </>
  );
}

it("traps focus, closes with Escape, and restores the trigger focus", async () => {
  const user = userEvent.setup();
  render(<ModalHarness />);
  const trigger = screen.getByRole("button", { name: "Open dialog" });

  await user.click(trigger);

  expect(screen.getByRole("dialog", { name: "Test dialog" })).toBeInTheDocument();
  expect(document.body.style.overflow).toBe("hidden");
  expect(screen.getByRole("textbox", { name: "Name" })).toHaveFocus();
  screen.getByRole("button", { name: "Close" }).focus();
  await user.keyboard("{Shift>}{Tab}{/Shift}");
  expect(screen.getByRole("button", { name: "Save" })).toHaveFocus();

  await user.keyboard("{Escape}");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
  expect(document.body.style.overflow).toBe("");
});

function RerenderHarness({ onClose }: { onClose: (draft: string) => void }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>Open changing dialog</button>
      <Modal
        open={open}
        onClose={() => {
          onClose(draft);
          setOpen(false);
        }}
        title="Changing dialog"
        initialFocusRef={inputRef}
      >
        <label>
          Draft
          <input
            ref={inputRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
        </label>
      </Modal>
    </>
  );
}

it("does not reset focus on parent rerenders and Escape uses the newest callback", async () => {
  const user = userEvent.setup();
  const onClose = vi.fn();
  render(<RerenderHarness onClose={onClose} />);
  const trigger = screen.getByRole("button", { name: "Open changing dialog" });

  await user.click(trigger);
  const input = screen.getByRole("textbox", { name: "Draft" });
  expect(input).toHaveFocus();

  await user.type(input, "continuous typing");

  expect(input).toHaveFocus();
  expect(input).toHaveValue("continuous typing");
  expect(screen.getByRole("button", { name: "Close" })).not.toHaveFocus();

  await user.keyboard("{Escape}");

  expect(onClose).toHaveBeenCalledTimes(1);
  expect(onClose).toHaveBeenCalledWith("continuous typing");
  expect(trigger).toHaveFocus();
});

it("keeps delete-account inputs stable and preserves them after a failed request", async () => {
  const user = userEvent.setup();
  const onDelete = vi.fn().mockRejectedValue(new ApiError(400, {
    error: {
      code: "invalid_current_password",
      message: "The current password is incorrect.",
    },
  }));
  render(<DeleteAccountDialog onDelete={onDelete} />);

  await user.click(screen.getByRole("button", { name: "Delete Account" }));
  const password = screen.getByLabelText("Current password");
  const confirmation = screen.getByLabelText("Type DELETE to confirm account deletion");
  expect(password).toHaveFocus();

  await user.type(password, "Password123!");
  expect(password).toHaveFocus();
  expect(password).toHaveValue("Password123!");

  await user.type(confirmation, "DELETE");
  expect(confirmation).toHaveFocus();
  expect(confirmation).toHaveValue("DELETE");
  expect(screen.getByRole("button", { name: "Close" })).not.toHaveFocus();

  await user.click(screen.getByRole("button", { name: "Delete" }));

  expect(await screen.findByRole("alert")).toHaveTextContent("The current password is incorrect.");
  expect(password).toHaveValue("Password123!");
  expect(confirmation).toHaveValue("DELETE");
  await waitFor(() => expect(password).toHaveFocus());
});

function LockedHarness() {
  const [open, setOpen] = useState(false);
  const [locked, setLocked] = useState(true);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>Open locked dialog</button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Locked dialog"
        closeDisabled={locked}
      >
        <button type="button" onClick={() => setLocked(false)}>Unlock</button>
      </Modal>
    </>
  );
}

it("prevents close controls and Escape while a destructive action is locked", async () => {
  const user = userEvent.setup();
  render(<LockedHarness />);

  await user.click(screen.getByRole("button", { name: "Open locked dialog" }));
  expect(screen.getByRole("button", { name: "Close" })).toBeDisabled();

  await user.keyboard("{Escape}");
  expect(screen.getByRole("dialog", { name: "Locked dialog" })).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Unlock" }));
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("dialog", { name: "Locked dialog" })).not.toBeInTheDocument();
});
