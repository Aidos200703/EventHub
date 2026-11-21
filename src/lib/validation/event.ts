import { z } from "zod";
import { CITY_SLUGS } from "../constants";
import { kzLocalInputToUtc } from "../dates";

export const CATEGORY_VALUES = [
  "CONCERT",
  "FESTIVAL",
  "THEATRE",
  "STANDUP",
  "CONFERENCE",
  "SPORT",
  "EXHIBITION",
  "WORKSHOP",
  "KIDS",
] as const;

const localDateTime = z
  .string()
  .min(1, "Pick a date and time")
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Pick a date and time");

const int = (label: string, min: number, max: number) =>
  z
    .number({ error: `${label} is required` })
    .int(`${label} must be a whole number`)
    .min(min, `${label} must be at least ${min.toLocaleString("en-US")}`)
    .max(max, `${label} must be at most ${max.toLocaleString("en-US")}`);

export const ticketTypeInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Name is too short").max(60, "Name is too long"),
  description: z
    .string()
    .trim()
    .max(160, "Keep it under 160 characters")
    .optional()
    .or(z.literal("")),
  price: int("Price", 100, 10_000_000),
  quantity: int("Quantity", 1, 100_000),
  maxPerOrder: int("Limit", 1, 20),
});

export const programItemInputSchema = z.object({
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM"),
  title: z.string().trim().min(2, "Title is too short").max(80, "Title is too long"),
  description: z
    .string()
    .trim()
    .max(200, 'Keep it underaria-label="Search events" 200 characters')
    .optional()
    .or(z.literal("")),
});

export const coverUrlSchema = z
  .string()
  .regex(/^\/(covers\/[\w-]+\.(webp|jpg|png)|api\/uploads\/[a-z0-9]+)$/i, "Upload a cover image");

export const eventFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, "Title must be at least 3 characters")
      .max(120, "Title is too long"),
    summary: z
      .string()
      .trim()
      .min(10, "Write at least 10 characters")
      .max(200, "Keep the summary under 200 characters"),
    description: z
      .string()
      .trim()
      .min(30, "Describe the event in at least 30 characters")
      .max(5000, "Description is too long"),
    category: z.enum(CATEGORY_VALUES, { error: "Choose a category" }),
    city: z.enum(CITY_SLUGS, { error: "Choose a city" }),
    venueName: z
      .string()
      .trim()
      .min(2, "Venue name is required")
      .max(100, "Venue name is too long"),
    venueAddress: z.string().trim().min(5, "Address is required").max(200, "Address is too long"),
    startsAt: localDateTime,
    endsAt: localDateTime,
    coverUrl: coverUrlSchema.nullable(),
    ticketTypes: z
      .array(ticketTypeInputSchema)
      .min(1, "Add at least one ticket type")
      .max(8, "Up to 8 ticket types"),
    program: z.array(programItemInputSchema).max(20, "Up to 20 program items"),
  })
  .refine((v) => kzLocalInputToUtc(v.endsAt) > kzLocalInputToUtc(v.startsAt), {
    path: ["endsAt"],
    message: "End must be after the start",
  })
  .refine(
    (v) =>
      new Set(v.ticketTypes.map((t) => t.name.trim().toLowerCase())).size === v.ticketTypes.length,
    {
      path: ["ticketTypes"],
      message: "Ticket type names must be unique",
    },
  );

export type EventFormInput = z.input<typeof eventFormSchema>;
export type EventFormValues = z.output<typeof eventFormSchema>;

/** Additional checks required before an event can go live. Returns human readable problems. */
export function publishBlockers(
  event: { coverUrl: string | null; startsAt: Date; ticketTypeCount: number },
  now = new Date(),
): string[] {
  const problems: string[] = [];
  if (!event.coverUrl) problems.push("Add a cover image");
  if (event.ticketTypeCount === 0) problems.push("Add at least one ticket type");
  if (event.startsAt <= now) problems.push("Start date must be in the future");
  return problems;
}
