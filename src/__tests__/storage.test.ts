import { describe, it, expect, beforeEach } from "vitest";
import { readJson, getUsers, STORAGE_KEYS } from "@/lib/services/storage";

describe("storage.readJson", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns fallback on invalid JSON", () => {
    localStorage.setItem("bad-key", "{invalid json!!!");
    const result = readJson("bad-key", "default-value");
    expect(result).toBe("default-value");
  });

  it("returns fallback when key is missing", () => {
    const result = readJson("nonexistent-key", 42);
    expect(result).toBe(42);
  });

  it("returns parsed value for valid JSON", () => {
    localStorage.setItem("good-key", JSON.stringify([1, 2, 3]));
    const result = readJson("good-key", []);
    expect(result).toEqual([1, 2, 3]);
  });
});

describe("storage seeding", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("does not reseed users when users key exists as an empty array", () => {
    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify([]));
    const users = getUsers();
    expect(users).toEqual([]);
  });

  it("seeds users only when the users key is missing", () => {
    localStorage.removeItem(STORAGE_KEYS.users);
    const users = getUsers();
    expect(users.length).toBeGreaterThan(0);
  });
});
