import { describe, it, expect, beforeEach } from "vitest";
import { readJson } from "@/lib/services/storage";

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
