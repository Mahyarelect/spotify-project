import { expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { I18nProvider } from "@/lib/i18n/useTranslation";

function renderFields(language: "en" | "fa" = "en", onSubmit = vi.fn()) {
  render(
    <I18nProvider language={language} setLanguage={async () => undefined}>
      <form onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>
        <PasswordInput label="Password" name="password" defaultValue="secret-one" />
        <PasswordInput label="Confirmation" name="confirmation" defaultValue="secret-two" />
        <button type="submit">Submit</button>
      </form>
    </I18nProvider>,
  );
  return onSubmit;
}

it("toggles each password independently without clearing or submitting", async () => {
  const user = userEvent.setup();
  const onSubmit = renderFields();
  const password = screen.getByLabelText("Password");
  const confirmation = screen.getByLabelText("Confirmation");
  const toggles = screen.getAllByRole("button", { name: "Show password" });

  expect(password).toHaveAttribute("type", "password");
  expect(password).toHaveAttribute("dir", "ltr");
  expect(password).toHaveClass("pr-12");
  expect(toggles[0]).toHaveClass("right-1", "min-h-11", "min-w-11");
  password.focus();
  await user.click(toggles[0]);
  expect(password).toHaveAttribute("type", "text");
  expect(password).toHaveValue("secret-one");
  expect(password).toHaveFocus();
  expect(confirmation).toHaveAttribute("type", "password");
  expect(onSubmit).not.toHaveBeenCalled();

  toggles[0].focus();
  await user.keyboard("{Enter}");
  expect(password).toHaveAttribute("type", "password");
  expect(password).toHaveValue("secret-one");
  expect(onSubmit).not.toHaveBeenCalled();
});

it("keeps the control physically right and updates Persian accessibility labels", async () => {
  const user = userEvent.setup();
  renderFields("fa");
  const toggles = screen.getAllByRole("button", { name: "نمایش رمز عبور" });
  expect(toggles).toHaveLength(2);
  expect(toggles[0]).toHaveClass("right-1");
  expect(screen.getByLabelText("Password")).toHaveClass("pr-12");

  await user.click(toggles[0]);

  expect(screen.getByRole("button", { name: "پنهان کردن رمز عبور" }))
    .toHaveAttribute("aria-pressed", "true");
});
