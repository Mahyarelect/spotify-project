import { describe, it, expect, beforeEach } from "vitest";
import {
  canStream,
  recordStream,
  getTodayStreamCount,
  getTodayString,
} from "@/lib/services/streamService";
import { STORAGE_KEYS } from "@/lib/services/storage";

beforeEach(() => {
  localStorage.clear();
});

describe("getTodayString", () => {
  it("returns a YYYY-MM-DD formatted string", () => {
    const result = getTodayString();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("getTodayStreamCount", () => {
  it("returns 0 when no streams recorded", () => {
    expect(getTodayStreamCount("u1")).toBe(0);
  });

  it("returns the correct count after streams are recorded", () => {
    recordStream("u1");
    recordStream("u1");
    recordStream("u1");
    expect(getTodayStreamCount("u1")).toBe(3);
  });

  it("tracks streams per user independently", () => {
    recordStream("u1");
    recordStream("u1");
    recordStream("u2");
    expect(getTodayStreamCount("u1")).toBe(2);
    expect(getTodayStreamCount("u2")).toBe(1);
  });
});

describe("recordStream", () => {
  it("persists stream count to localStorage", () => {
    recordStream("u1");
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.streamCounts) ?? "{}");
    const today = getTodayString();
    expect(stored["u1"][today]).toBe(1);
  });

  it("increments existing count", () => {
    recordStream("u1");
    recordStream("u1");
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.streamCounts) ?? "{}");
    const today = getTodayString();
    expect(stored["u1"][today]).toBe(2);
  });
});

describe("canStream", () => {
  it("allows streaming for silver users regardless of count", () => {
    for (let i = 0; i < 100; i++) recordStream("u1");
    expect(canStream("u1", "silver")).toBe(true);
  });

  it("allows streaming for gold users regardless of count", () => {
    for (let i = 0; i < 100; i++) recordStream("u1");
    expect(canStream("u1", "gold")).toBe(true);
  });

  it("allows streaming for free users under the limit", () => {
    for (let i = 0; i < 59; i++) recordStream("u1");
    expect(canStream("u1", "free")).toBe(true);
  });

  it("allows streaming at exactly 59 streams for free users", () => {
    for (let i = 0; i < 59; i++) recordStream("u1");
    expect(canStream("u1", "free")).toBe(true);
  });

  it("blocks streaming at 60 streams for free users", () => {
    for (let i = 0; i < 60; i++) recordStream("u1");
    expect(canStream("u1", "free")).toBe(false);
  });

  it("blocks streaming beyond 60 streams for free users", () => {
    for (let i = 0; i < 65; i++) recordStream("u1");
    expect(canStream("u1", "free")).toBe(false);
  });
});
