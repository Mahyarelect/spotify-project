import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const MIN_AGE_YEARS = 13;
export const MAX_AGE_YEARS = 120;

export function dateInputValueYearsAgo(years: number): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() - years);
  return date.toISOString().slice(0, 10);
}

function parseDateOnly(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  const validCalendarDate =
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day;

  return validCalendarDate ? parsed : null;
}

function todayUtcDateOnly(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

function yearsBeforeToday(years: number): Date {
  const date = todayUtcDateOnly();
  date.setUTCFullYear(date.getUTCFullYear() - years);
  return date;
}

export const birthDateSchema = z
  .string()
  .min(1, "Birth date is required")
  .refine((value) => parseDateOnly(value) !== null, "Enter a valid birth date")
  .refine((value) => {
    const parsed = parseDateOnly(value);
    return parsed !== null && parsed <= todayUtcDateOnly();
  }, "Birth date cannot be in the future")
  .refine((value) => {
    const parsed = parseDateOnly(value);
    return parsed !== null && parsed >= yearsBeforeToday(MAX_AGE_YEARS);
  }, `Birth date cannot be more than ${MAX_AGE_YEARS} years ago`)
  .refine((value) => {
    const parsed = parseDateOnly(value);
    return parsed !== null && parsed <= yearsBeforeToday(MIN_AGE_YEARS);
  }, `You must be at least ${MIN_AGE_YEARS} years old to register`);

export const registerSchema = z
  .object({
    displayName: z.string().trim().min(2, "Display name must be at least 2 characters"),
    email: z.string().trim().email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your password"),
    birthDate: birthDateSchema,
    gender: z.enum(["male", "female", "other", "unspecified"], {
      message: "Please select a gender",
    }),
    acceptPolicy: z.literal(true, {
      message: "You must accept the privacy policy",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const artistRegisterSchema = z
  .object({
    email: z.string().trim().email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your password"),
    artistName: z.string().min(2, "Artist name must be at least 2 characters"),
    portfolioUrl: z.string().trim().min(1, "Portfolio is required").url("Enter a valid URL"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});
