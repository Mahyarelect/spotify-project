import { describe, it, expect, beforeEach } from "vitest";
import { readJson, STORAGE_KEYS } from "@/lib/services/storage";

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

  it("migrates legacy product keys without losing stored data", () => {
    const legacyKey = ["music", "app_playerPrefs"].join("");
    const preferences = { volume: 55, shuffle: true, repeatMode: "all" };
    localStorage.setItem(legacyKey, JSON.stringify(preferences));

    expect(readJson(STORAGE_KEYS.playerPrefs, {})).toEqual(preferences);
    expect(localStorage.getItem(STORAGE_KEYS.playerPrefs)).toBe(JSON.stringify(preferences));
    expect(localStorage.getItem(legacyKey)).toBeNull();
  });
});
