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
  await user.click(toggles[0]);
  expect(password).toHaveAttribute("type", "text");
  expect(password).toHaveValue("secret-one");
  expect(confirmation).toHaveAttribute("type", "password");
  expect(onSubmit).not.toHaveBeenCalled();

  toggles[0].focus();
  await user.keyboard("{Enter}");
  expect(password).toHaveAttribute("type", "password");
  expect(password).toHaveValue("secret-one");
  expect(onSubmit).not.toHaveBeenCalled();
});

it("uses translated Persian accessibility labels", () => {
  renderFields("fa");
  expect(screen.getAllByRole("button", { name: "نمایش رمز عبور" })).toHaveLength(2);
});
