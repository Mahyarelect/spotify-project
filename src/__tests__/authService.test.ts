import { beforeEach, expect, it, vi } from "vitest";
import {
  login,
  logout,
  registerArtist,
  registerListener,
} from "@/lib/services/authService";
import { jsonResponse, makeUserDto } from "./apiFixtures";

beforeEach(() => {
  sessionStorage.clear();
  vi.restoreAllMocks();
});

it("logs in through the API and stores JWTs in sessionStorage", async () => {
  const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
    jsonResponse({ access: "access", refresh: "refresh", user: makeUserDto() }),
  );

  const result = await login("test@example.com", "Password123!");

  expect(result.role).toBe("listener");
  expect(result.user).not.toHaveProperty("passwordHash");
  expect(sessionStorage.getItem("musicapp_access_token")).toBe("access");
  expect(sessionStorage.getItem("musicapp_refresh_token")).toBe("refresh");
  expect(fetchMock).toHaveBeenCalledWith(
    "/api/v1/auth/login/",
    expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ email: "test@example.com", password: "Password123!" }),
    }),
  );
});

it("sends the complete listener registration contract", async () => {
  const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
    jsonResponse({ access: "access", refresh: "refresh", user: makeUserDto() }, 201),
  );

  await registerListener({
    displayName: "New Listener",
    email: "new@example.com",
    password: "Password123!",
    confirmPassword: "Password123!",
    birthDate: "1998-04-20",
    gender: "other",
    acceptPolicy: true,
  });

  const request = fetchMock.mock.calls[0][1] as RequestInit;
  expect(JSON.parse(request.body as string)).toEqual(expect.objectContaining({
    display_name: "New Listener",
    password_confirm: "Password123!",
    accept_policy: true,
  }));
});

it("submits artist applications without retaining the password", async () => {
  const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
    jsonResponse({ id: "app-id", status: "pending", submitted_at: "2026-07-21T00:00:00Z" }, 201),
  );

  const application = await registerArtist({
    email: "artist@example.com",
    password: "Password123!",
    confirmPassword: "Password123!",
    artistName: "Test Artist",
    portfolioUrl: "https://example.com",
  });

  expect(application).toEqual({ id: "app-id", status: "pending", submittedAt: "2026-07-21T00:00:00Z" });
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(localStorage.length).toBe(0);
});

it("surfaces the backend generic login error", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    jsonResponse({ error: { code: "invalid_credentials", message: "Invalid email or password." } }, 401),
  );

  await expect(login("unknown@example.com", "WrongPassword!"))
    .rejects.toThrow("Invalid email or password.");
});

it("clears tokens even when the logout request fails", async () => {
  sessionStorage.setItem("musicapp_access_token", "access");
  sessionStorage.setItem("musicapp_refresh_token", "refresh");
  vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));

  await logout();

  expect(sessionStorage.getItem("musicapp_access_token")).toBeNull();
  expect(sessionStorage.getItem("musicapp_refresh_token")).toBeNull();
});
