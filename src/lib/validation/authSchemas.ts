import { z } from "zod";
import { en, type Translations } from "@/lib/i18n/translations/en";

export const MIN_AGE_YEARS = 13;
export const MAX_AGE_YEARS = 120;

type ValidationMessages = Translations["validation"];

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
  return parsed.getUTCFullYear() === year
    && parsed.getUTCMonth() === month - 1
    && parsed.getUTCDate() === day
    ? parsed
    : null;
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

export function createAuthSchemas(messages: ValidationMessages) {
  const birthDate = z
    .string()
    .min(1, messages.birthDateRequired)
    .refine((value) => parseDateOnly(value) !== null, messages.birthDateInvalid)
    .refine((value) => {
      const parsed = parseDateOnly(value);
      return parsed !== null && parsed <= todayUtcDateOnly();
    }, messages.birthDateFuture)
    .refine((value) => {
      const parsed = parseDateOnly(value);
      return parsed !== null && parsed >= yearsBeforeToday(MAX_AGE_YEARS);
    }, messages.birthDateTooOld.replace("{years}", String(MAX_AGE_YEARS)))
    .refine((value) => {
      const parsed = parseDateOnly(value);
      return parsed !== null && parsed <= yearsBeforeToday(MIN_AGE_YEARS);
    }, messages.minimumAge.replace("{years}", String(MIN_AGE_YEARS)));

  const passwordPair = {
    password: z.string().min(8, messages.passwordMin),
    confirmPassword: z.string().min(1, messages.passwordConfirmationRequired),
  };

  const passwordPairSchema = z.object(passwordPair).refine(
    (data) => data.password === data.confirmPassword,
    {
      message: messages.passwordMismatch,
      path: ["confirmPassword"],
    },
  );

  const register = z.intersection(z.object({
    displayName: z.string().trim().min(2, messages.displayNameMin),
    email: z.string().trim().email(messages.emailInvalid),
    birthDate,
    gender: z.enum(["male", "female", "other", "unspecified"], {
      message: messages.genderRequired,
    }),
    acceptPolicy: z.literal(true, { message: messages.policyRequired }),
  }), passwordPairSchema);

  const artistRegister = z.intersection(z.object({
    email: z.string().trim().email(messages.emailInvalid),
    artistName: z.string().trim().min(2, messages.artistNameMin),
    portfolioUrl: z.string().trim().min(1, messages.portfolioRequired).url(messages.urlInvalid),
  }), passwordPairSchema);

  return {
    login: z.object({
      email: z.string().trim().email(messages.emailInvalid),
      password: z.string().min(1, messages.passwordRequired),
    }),
    register,
    artistRegister,
    forgotPassword: z.object({
      email: z.string().trim().email(messages.emailInvalid),
    }),
    resetPassword: passwordPairSchema,
    birthDate,
  };
}

// English defaults remain available for non-React validation tests and callers.
const defaultSchemas = createAuthSchemas(en.validation);
export const loginSchema = defaultSchemas.login;
export const registerSchema = defaultSchemas.register;
export const artistRegisterSchema = defaultSchemas.artistRegister;
export const forgotPasswordSchema = defaultSchemas.forgotPassword;
export const resetPasswordSchema = defaultSchemas.resetPassword;
export const birthDateSchema = defaultSchemas.birthDate;
