import { beforeEach, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ProfilePage from "@/pages/ProfilePage";
import { makeUser } from "./apiFixtures";
import type { PublicProfile } from "@/types/user";

const state = vi.hoisted(() => ({ user: null as ReturnType<typeof makeUser> | null }));
const service = vi.hoisted(() => ({
  getUserByUsername: vi.fn(),
  followUser: vi.fn(),
  unfollowUser: vi.fn(),
}));

vi.mock("@/lib/services/userService", () => service);
vi.mock("@/lib/hooks/useAuth", () => ({
  useAuth: () => ({ user: state.user, loading: false }),
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

beforeEach(() => {
  state.user = makeUser();
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
  await user.click(screen.getByRole("button", { name: "Follow" }));
  expect(await screen.findByRole("button", { name: "Unfollow" })).toBeInTheDocument();
  expect(screen.getByText("11")).toBeInTheDocument();
});

it("shows a backend profile error instead of hanging", async () => {
  service.getUserByUsername.mockRejectedValue(new Error("Profile not found."));

  renderProfile();

  expect(await screen.findByRole("alert")).toHaveTextContent("Profile not found.");
});
