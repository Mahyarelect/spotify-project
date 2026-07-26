import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { UserSearch } from "@/components/users/UserSearch";
import type { PublicProfile, UserSearchResult } from "@/types/user";

const service = vi.hoisted(() => ({
  searchUsers: vi.fn(),
  followUser: vi.fn(),
  unfollowUser: vi.fn(),
}));
const auth = vi.hoisted(() => ({ refreshUser: vi.fn() }));

vi.mock("@/lib/services/userService", () => service);
vi.mock("@/lib/hooks/useAuth", () => ({
  useAuth: () => auth,
}));

const artist: UserSearchResult = {
  id: "22222222-2222-4222-8222-222222222222",
  username: "artist",
  displayName: "Artist",
  avatarUrl: null,
  role: "artist",
  artistVerified: true,
  plan: "gold",
  followersCount: 10,
  followingCount: 2,
  isFollowing: false,
};

const followedProfile: PublicProfile = {
  ...artist,
  bio: "",
  followersCount: 11,
  isFollowing: true,
};

function renderSearch() {
  return render(
    <MemoryRouter>
      <UserSearch currentUserId="11111111-1111-4111-8111-111111111111" />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  service.searchUsers.mockReset();
  service.followUser.mockReset();
  service.unfollowUser.mockReset();
  auth.refreshUser.mockReset().mockResolvedValue(undefined);
});

describe("UserSearch", () => {
  it("waits for two characters and debounces a successful search", async () => {
    service.searchUsers.mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [artist],
    });
    const user = userEvent.setup();
    renderSearch();

    await user.type(screen.getByRole("searchbox"), "a");
    expect(screen.getByText("Enter at least 2 characters.")).toBeInTheDocument();
    expect(service.searchUsers).not.toHaveBeenCalled();

    await user.type(screen.getByRole("searchbox"), "r");
    expect(await screen.findByText("@artist")).toBeInTheDocument();
    expect(service.searchUsers).toHaveBeenCalledWith("ar", 1, expect.any(AbortSignal));
    expect(screen.getByLabelText("Verified artist")).toBeInTheDocument();
  });

  it("shows an empty state", async () => {
    service.searchUsers.mockResolvedValue({ count: 0, next: null, previous: null, results: [] });
    const user = userEvent.setup();
    renderSearch();

    await user.type(screen.getByRole("searchbox"), "zz");
    expect(await screen.findByText("No users found.")).toBeInTheDocument();
  });

  it("shows a search error", async () => {
    service.searchUsers.mockRejectedValue(new Error("Search unavailable"));
    const user = userEvent.setup();
    renderSearch();

    await user.type(screen.getByRole("searchbox"), "yy");
    expect(await screen.findByRole("alert")).toHaveTextContent("Search unavailable");
  });

  it("does not let a stale response overwrite a newer query", async () => {
    let resolveFirst: ((value: {
      count: number;
      next: null;
      previous: null;
      results: UserSearchResult[];
    }) => void) | undefined;
    service.searchUsers
      .mockImplementationOnce(() => new Promise((resolve) => { resolveFirst = resolve; }))
      .mockResolvedValueOnce({
        count: 1,
        next: null,
        previous: null,
        results: [{ ...artist, username: "newer", displayName: "Newer" }],
      });
    const user = userEvent.setup();
    renderSearch();

    await user.type(screen.getByRole("searchbox"), "ar");
    await waitFor(() => expect(service.searchUsers).toHaveBeenCalledTimes(1));
    await user.clear(screen.getByRole("searchbox"));
    await user.type(screen.getByRole("searchbox"), "ne");
    expect(await screen.findByText("@newer")).toBeInTheDocument();

    resolveFirst?.({
      count: 1,
      next: null,
      previous: null,
      results: [artist],
    });
    await waitFor(() => expect(screen.queryByText("@artist")).not.toBeInTheDocument());
  });

  it("disables follow while pending and applies the server response", async () => {
    service.searchUsers.mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [artist],
    });
    let resolveFollow: ((value: PublicProfile) => void) | undefined;
    service.followUser.mockImplementation(() => new Promise((resolve) => { resolveFollow = resolve; }));
    const user = userEvent.setup();
    renderSearch();

    await user.type(screen.getByRole("searchbox"), "ar");
    const follow = await screen.findByRole("button", { name: "Follow" });
    await user.click(follow);

    expect(screen.getByRole("button", { name: "Updating..." })).toBeDisabled();
    resolveFollow?.(followedProfile);
    expect(await screen.findByRole("button", { name: "Unfollow" })).toBeInTheDocument();
    expect(screen.getByText(/11 Followers/)).toBeInTheDocument();
    expect(auth.refreshUser).toHaveBeenCalledTimes(1);
  });

  it("sends only one mutation for a follow double-click", async () => {
    service.searchUsers.mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [artist],
    });
    service.followUser.mockImplementation(() => new Promise(() => undefined));
    const user = userEvent.setup();
    renderSearch();

    await user.type(screen.getByRole("searchbox"), "ar");
    const follow = await screen.findByRole("button", { name: "Follow" });
    await user.dblClick(follow);

    expect(service.followUser).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Updating..." })).toBeDisabled();
  });

  it("keeps the server follow result when viewer-count refresh fails", async () => {
    service.searchUsers.mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [artist],
    });
    service.followUser.mockResolvedValue(followedProfile);
    auth.refreshUser.mockRejectedValue(new Error("Refresh failed"));
    const user = userEvent.setup();
    renderSearch();

    await user.type(screen.getByRole("searchbox"), "ar");
    await user.click(await screen.findByRole("button", { name: "Follow" }));

    expect(await screen.findByRole("button", { name: "Unfollow" })).toBeInTheDocument();
    expect(screen.getByText(/11 Followers/)).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Follow status updated, but your profile count could not be refreshed.",
    );
  });
});
