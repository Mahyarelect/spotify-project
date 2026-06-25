import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z
  .object({
    displayName: z.string().min(2, "Display name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    birthDate: z.string().min(1, "Birth date is required"),
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

export const artistRegisterSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  artistName: z.string().min(2, "Artist name must be at least 2 characters"),
  portfolioUrl: z
    .string()
    .url("Please enter a valid URL")
    .min(1, "Portfolio URL is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});
