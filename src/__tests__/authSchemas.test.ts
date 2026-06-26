import { describe, it, expect } from "vitest";
import { birthDateSchema, registerSchema } from "@/lib/validation/authSchemas";

describe("birthDateSchema", () => {
  it("rejects 0001-10-10 as unrealistically old", () => {
    const result = birthDateSchema.safeParse("0001-10-10");
    expect(result.success).toBe(false);
  });

  it("rejects future dates", () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const dateStr = futureDate.toISOString().slice(0, 10);
    const result = birthDateSchema.safeParse(dateStr);
    expect(result.success).toBe(false);
  });

  it("rejects invalid calendar date 2025-02-31", () => {
    const result = birthDateSchema.safeParse("2025-02-31");
    expect(result.success).toBe(false);
  });

  it("accepts valid date for user at least 13 years old", () => {
    const result = birthDateSchema.safeParse("1995-03-15");
    expect(result.success).toBe(true);
  });
});

describe("registerSchema", () => {
  it("rejects password mismatch", () => {
    const result = registerSchema.safeParse({
      displayName: "Test User",
      email: "test@example.com",
      password: "Password123!",
      confirmPassword: "DifferentPassword!",
      birthDate: "1995-03-15",
      gender: "male",
      acceptPolicy: true,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const confirmError = result.error.issues.find(
        (i) => i.path.includes("confirmPassword")
      );
      expect(confirmError).toBeDefined();
    }
  });

  it("rejects unchecked privacy policy", () => {
    const result = registerSchema.safeParse({
      displayName: "Test User",
      email: "test@example.com",
      password: "Password123!",
      confirmPassword: "Password123!",
      birthDate: "1995-03-15",
      gender: "male",
      acceptPolicy: false,
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid complete registration data", () => {
    const result = registerSchema.safeParse({
      displayName: "Test User",
      email: "test@example.com",
      password: "Password123!",
      confirmPassword: "Password123!",
      birthDate: "1995-03-15",
      gender: "male",
      acceptPolicy: true,
    });
    expect(result.success).toBe(true);
  });
});
