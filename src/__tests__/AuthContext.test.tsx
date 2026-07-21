import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { AuthProvider } from "@/lib/context/AuthContext";
import { useAuth } from "@/lib/hooks/useAuth";
import { resetHttpClientForTests } from "@/lib/api/httpClient";
import { jsonResponse, makeUserDto } from "./apiFixtures";

function AuthState() {
  const { user, loading } = useAuth();
  return <div>{loading ? "loading" : user ? `${user.displayName}:${user.role}` : "guest"}</div>;
}

describe("AuthContext bootstrap", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
    resetHttpClientForTests();
  });

  it("loads the current user from a session JWT", async () => {
    sessionStorage.setItem("musicapp_access_token", "access");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(makeUserDto("admin")));

    render(<AuthProvider><AuthState /></AuthProvider>);

    expect(await screen.findByText("Test User:admin")).toBeInTheDocument();
  });

  it("always finishes loading and clears tokens when refresh fails", async () => {
    sessionStorage.setItem("musicapp_refresh_token", "expired-refresh");
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ error: { code: "token_not_valid", message: "Token is invalid." } }, 401),
    );

    render(<AuthProvider><AuthState /></AuthProvider>);

    expect(await screen.findByText("guest")).toBeInTheDocument();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(sessionStorage.getItem("musicapp_refresh_token")).toBeNull();
  });
});
