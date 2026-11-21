import { z } from "zod";
import { CITY_SLUGS } from "../constants";
import { emailSchema, normalizeKzPhone, personNameSchema } from "./common";

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const signUpSchema = z.object({
  name: personNameSchema,
  email: emailSchema,
  password: z.string().min(8, "Use at least 8 characters").max(128, "Password is too long"),
  role: z.enum(["VISITOR", "ORGANIZER"]),
});

export const profileSchema = z.object({
  name: personNameSchema,
  phone: z
    .string()
    .trim()
    .refine(
      (v) => v === "" || normalizeKzPhone(v) !== null,
      "Enter a Kazakhstan number, e.g. +7 701 234 56 78",
    )
    .transform((v) => (v === "" ? null : normalizeKzPhone(v))),
  city: z.union([z.enum(CITY_SLUGS), z.literal("")]).transform((v) => (v === "" ? null : v)),
  bio: z
    .string()
    .trim()
    .max(400, "Keep it under 400 characters")
    .transform((v) => (v === "" ? null : v)),
});

export type SignInInput = z.input<typeof signInSchema>;
export type SignUpInput = z.input<typeof signUpSchema>;
export type ProfileInput = z.input<typeof profileSchema>;
