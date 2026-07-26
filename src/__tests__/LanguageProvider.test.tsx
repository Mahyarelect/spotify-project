import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LanguageProvider, LANGUAGE_STORAGE_KEY } from "@/lib/i18n/LanguageProvider";
import { LanguageSwitcher } from "@/components/language/LanguageSwitcher";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { makeUser } from "./apiFixtures";

const authState = vi.hoisted(() => ({
  user: null as ReturnType<typeof makeUser> | null,
  refreshUser: vi.fn(),
}));
const settings = vi.hoisted(() => ({ updateLanguage: vi.fn() }));

vi.mock("@/lib/hooks/useAuth", () => ({
  useAuth: () => authState,
}));
vi.mock("@/lib/services/settingsService", () => settings);

function Probe() {
  const { language } = useTranslation();
  return (
    <>
      <span>{language}</span>
      <input aria-label="draft" defaultValue="typed value" />
      <LanguageSwitcher />
    </>
  );
}

describe("LanguageProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    authState.user = null;
    authState.refreshUser.mockReset().mockResolvedValue(undefined);
    settings.updateLanguage.mockReset().mockResolvedValue(undefined);
    document.documentElement.lang = "";
    document.documentElement.dir = "";
  });

  it("persists guest language, updates direction, and keeps active form values", async () => {
    const user = userEvent.setup();
    render(<LanguageProvider><Probe /></LanguageProvider>);

    await user.selectOptions(screen.getByRole("combobox"), "fa");

    expect(screen.getByDisplayValue("typed value")).toBeInTheDocument();
    expect(document.documentElement.lang).toBe("fa");
    expect(document.documentElement.dir).toBe("rtl");
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("fa");
  });

  it("migrates a saved legacy language choice", async () => {
    const legacyKey = ["music", "app_language"].join("");
    localStorage.setItem(legacyKey, "fa");

    render(<LanguageProvider><Probe /></LanguageProvider>);

    expect(await screen.findByText("fa")).toBeInTheDocument();
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("fa");
    expect(localStorage.getItem(legacyKey)).toBeNull();
  });

  it("adopts the backend preference when the guest made no current-session choice", async () => {
    authState.user = makeUser("gold");
    authState.user.preferences.language = "fa";

    render(<LanguageProvider><Probe /></LanguageProvider>);

    expect(await screen.findByText("fa")).toBeInTheDocument();
    expect(settings.updateLanguage).not.toHaveBeenCalled();
  });

  it("synchronizes an explicit guest choice after login and preserves it on logout", async () => {
    const user = userEvent.setup();
    const view = render(<LanguageProvider><Probe /></LanguageProvider>);
    await user.selectOptions(screen.getByRole("combobox"), "fa");

    authState.user = makeUser("free");
    view.rerender(<LanguageProvider><Probe /></LanguageProvider>);

    await waitFor(() => expect(settings.updateLanguage).toHaveBeenCalledWith("fa"));
    authState.user = null;
    view.rerender(<LanguageProvider><Probe /></LanguageProvider>);
    expect(screen.getByText("fa")).toBeInTheDocument();
  });
});
