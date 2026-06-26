import { describe, it, expect } from "vitest";
import { mockHashPassword, verifyMockPassword } from "@/lib/services/password";

describe("password hashing", () => {
  it("produces consistent hashes for same input", () => {
    const hash1 = mockHashPassword("Password123!");
    const hash2 = mockHashPassword("Password123!");
    expect(hash1).toBe(hash2);
  });

  it("produces different hashes for different inputs", () => {
    const hash1 = mockHashPassword("password1");
    const hash2 = mockHashPassword("password2");
    expect(hash1).not.toBe(hash2);
  });

  it("verifies correct password", () => {
    const stored = mockHashPassword("Password123!");
    expect(verifyMockPassword("Password123!", stored)).toBe(true);
  });

  it("rejects wrong password", () => {
    const stored = mockHashPassword("Password123!");
    expect(verifyMockPassword("WrongPassword!", stored)).toBe(false);
  });
});
