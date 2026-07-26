import { beforeEach, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Link, MemoryRouter, Route, Routes } from "react-router-dom";
import ProfilePage from "@/pages/ProfilePage";
import { makeUser } from "./apiFixtures";
import type { PublicProfile } from "@/types/user";

const state = vi.hoisted(() => ({
  user: null as ReturnType<typeof makeUser> | null,
  refreshUser: vi.fn(),
}));
const service = vi.hoisted(() => ({
  getUserByUsername: vi.fn(),
  followUser: vi.fn(),
  unfollowUser: vi.fn(),
}));

vi.mock("@/lib/services/userService", () => service);
vi.mock("@/lib/hooks/useAuth", () => ({
  useAuth: () => ({ user: state.user, loading: false, refreshUser: state.refreshUser }),
}));

const profile: PublicProfile = {
  id: "22222222-2222-4222-8222-222222222222",
  username: "artist",
  displayName: "Artist",
  avatarUrl: null,
  bio: "Bio",
  role: "artist",
  artistVerified: true,
  plan: "gold",
  followersCount: 10,
  followingCount: 2,
  isFollowing: false,
};

function renderProfile() {
  return render(
    <MemoryRouter initialEntries={["/profile/artist"]}>
      <Routes>
        <Route path="/profile/:username" element={<ProfilePage />} />
      </Routes>
    </MemoryRouter>,
  );
}

function renderOwnProfile() {
  return render(
    <MemoryRouter initialEntries={["/profile"]}>
      <Routes>
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/subscription" element={<div>Subscription destination</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

function renderProfileJourney() {
  return render(
    <MemoryRouter initialEntries={["/profile/artist"]}>
      <Link to="/profile">Own profile</Link>
      <Routes>
        <Route path="/profile/:username" element={<ProfilePage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  state.user = makeUser();
  state.refreshUser.mockReset().mockResolvedValue(undefined);
  service.getUserByUsername.mockReset();
  service.followUser.mockReset();
  service.unfollowUser.mockReset();
});

it("loads a public profile and updates follow state from the API response", async () => {
  service.getUserByUsername.mockResolvedValue(profile);
  service.followUser.mockResolvedValue({ ...profile, followersCount: 11, isFollowing: true });
  const user = userEvent.setup();

  renderProfile();

  expect(await screen.findByText("@artist")).toBeInTheDocument();
  expect(screen.getByLabelText("Verified artist")).toBeInTheDocument();
  expect(screen.queryByText("Account details")).not.toBeInTheDocument();
  expect(screen.queryByText(state.user?.email ?? "")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Follow" }));
  expect(await screen.findByRole("button", { name: "Unfollow" })).toBeInTheDocument();
  expect(screen.getByText("11")).toBeInTheDocument();
  expect(state.refreshUser).toHaveBeenCalledTimes(1);
});

it("shows the refreshed own following count after SPA navigation", async () => {
  service.getUserByUsername.mockResolvedValue(profile);
  service.followUser.mockResolvedValue({ ...profile, followersCount: 11, isFollowing: true });
  state.refreshUser.mockImplementation(async () => {
    if (state.user) state.user = { ...state.user, followingCount: 4 };
  });
  const user = userEvent.setup();
  renderProfileJourney();

  await user.click(await screen.findByRole("button", { name: "Follow" }));
  await screen.findByRole("button", { name: "Unfollow" });
  await user.click(screen.getByRole("link", { name: "Own profile" }));

  expect(await screen.findByText("Account details")).toBeInTheDocument();
  expect(screen.getByText("Following").parentElement).toHaveTextContent("4");
});

it("keeps the successful target update visible if viewer refresh fails", async () => {
  service.getUserByUsername.mockResolvedValue(profile);
  service.followUser.mockResolvedValue({ ...profile, followersCount: 11, isFollowing: true });
  state.refreshUser.mockRejectedValue(new Error("Refresh failed"));
  const user = userEvent.setup();
  renderProfile();

  await user.click(await screen.findByRole("button", { name: "Follow" }));

  expect(await screen.findByRole("button", { name: "Unfollow" })).toBeInTheDocument();
  expect(screen.getByText("11")).toBeInTheDocument();
  expect(screen.getByRole("alert")).toHaveTextContent(
    "Follow status updated, but your profile count could not be refreshed.",
  );
});

it("refreshes the viewer after unfollow and applies the server count", async () => {
  service.getUserByUsername.mockResolvedValue({ ...profile, followersCount: 11, isFollowing: true });
  service.unfollowUser.mockResolvedValue({ ...profile, followersCount: 10, isFollowing: false });
  const user = userEvent.setup();
  renderProfile();

  await user.click(await screen.findByRole("button", { name: "Unfollow" }));

  expect(await screen.findByRole("button", { name: "Follow" })).toBeInTheDocument();
  expect(screen.getByText("10")).toBeInTheDocument();
  expect(state.refreshUser).toHaveBeenCalledTimes(1);
});

it("leaves follow state unchanged when the mutation fails", async () => {
  service.getUserByUsername.mockResolvedValue(profile);
  service.followUser.mockRejectedValue(new Error("Follow unavailable"));
  const user = userEvent.setup();
  renderProfile();

  await user.click(await screen.findByRole("button", { name: "Follow" }));

  expect(await screen.findByRole("alert")).toHaveTextContent("Follow unavailable");
  expect(screen.getByRole("button", { name: "Follow" })).toBeInTheDocument();
  expect(screen.getByText("10")).toBeInTheDocument();
  expect(state.refreshUser).not.toHaveBeenCalled();
});

it("renders private account details only on the owner's profile", async () => {
  if (!state.user) throw new Error("Missing test user");
  state.user.streamsToday = null;

  renderOwnProfile();

  expect(await screen.findByText("Account details")).toBeInTheDocument();
  expect(screen.getByText(state.user.email)).toBeInTheDocument();
  expect(screen.getAllByText("Listener")).toHaveLength(2);
  expect(screen.getByRole("link", { name: "Manage subscription" })).toHaveAttribute(
    "href",
    "/subscription",
  );
  expect(screen.getByText("Streams today").parentElement).toHaveTextContent("Not available");
});

it("renders a numeric daily stream aggregate when it is available", async () => {
  if (!state.user) throw new Error("Missing test user");
  state.user.streamsToday = 17;

  renderOwnProfile();

  expect(await screen.findByText("Streams today")).toBeInTheDocument();
  expect(screen.getByText("Streams today").parentElement).toHaveTextContent("17");
});

it("shows a backend profile error instead of hanging", async () => {
  service.getUserByUsername.mockRejectedValue(new Error("Profile not found."));

  renderProfile();

  expect(await screen.findByRole("alert")).toHaveTextContent("Profile not found.");
});
