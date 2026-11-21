import { z } from "zod";

/** Normalizes Kazakhstan phone numbers to +7XXXXXXXXXX. Accepts 8XXXXXXXXXX and formatted input. */
export function normalizeKzPhone(value: string): string | null {
  const digits = value.replace(/[\s()\-.]/g, "");
  const match = /^(?:\+7|8|7)(\d{10})$/.exec(digits);
  return match ? `+7${match[1]}` : null;
}

export const phoneSchema = z
  .string()
  .trim()
  .min(1, "Phone number is required")
  .refine((v) => normalizeKzPhone(v) !== null, "Enter a Kazakhstan number, e.g. +7 701 234 56 78")
  .transform((v) => normalizeKzPhone(v)!);

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required")
  .pipe(z.email("Enter a valid email address"))
  .transform((v) => v.toLowerCase());

export const personNameSchema = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters")
  .max(80, "Name must be at most 80 characters");
