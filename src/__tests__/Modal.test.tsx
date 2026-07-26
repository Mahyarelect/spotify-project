import { useState } from "react";
import { expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Modal } from "@/components/ui/Modal";

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
  expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();
  await user.keyboard("{Shift>}{Tab}{/Shift}");
  expect(screen.getByRole("button", { name: "Save" })).toHaveFocus();

  await user.keyboard("{Escape}");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
});
