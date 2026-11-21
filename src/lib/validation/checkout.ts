import { z } from "zod";
import { emailSchema, personNameSchema, phoneSchema } from "./common";

export function luhnValid(digits: string) {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = digits.charCodeAt(i) - 48;
    if (double) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    double = !double;
  }
  return sum % 10 === 0;
}

/** Test card numbers understood by the simulated payment provider. */
export const TEST_CARDS = {
  success: "4242 4242 4242 4242",
  declined: "4000 0000 0000 0002",
} as const;

export const buyerSchema = z.object({
  name: personNameSchema,
  email: emailSchema,
  phone: phoneSchema,
});

export function isExpiryInFuture(value: string, now = new Date()) {
  const m = /^(\d{2})\s?\/\s?(\d{2})$/.exec(value);
  if (!m) return false;
  const month = Number(m[1]);
  const year = 2000 + Number(m[2]);
  if (month < 1 || month > 12) return false;
  // A card is valid through the last day of its expiry month
  return Date.UTC(year, month, 1) > now.getTime();
}

export const paymentSchema = z.object({
  cardNumber: z
    .string()
    .transform((v) => v.replace(/\s+/g, ""))
    .pipe(
      z
        .string()
        .regex(/^\d{16}$/, "Card number must have 16 digits")
        .refine(luhnValid, "Card number is invalid"),
    ),
  expiry: z
    .string()
    .trim()
    .regex(/^\d{2}\s?\/\s?\d{2}$/, "Use MM/YY format")
    .refine((v) => isExpiryInFuture(v), "Card has expired"),
  cvc: z
    .string()
    .trim()
    .regex(/^\d{3}$/, "CVC must have 3 digits"),
});

export const selectionSchema = z
  .record(z.string().regex(/^[a-z0-9]+$/i), z.number().int().min(0).max(100))
  .refine((s) => Object.values(s).some((q) => q > 0), "Select at least one ticket");

export const createOrderSchema = z.object({
  eventId: z.string().min(1),
  idempotencyKey: z.uuid(),
  selection: selectionSchema,
  buyer: buyerSchema,
  payment: paymentSchema,
});

/** The checkout form = buyer details + payment details. */
export const checkoutFormSchema = z.object({ buyer: buyerSchema, payment: paymentSchema });

export type CheckoutFormInput = z.input<typeof checkoutFormSchema>;
export type CheckoutFormValues = z.output<typeof checkoutFormSchema>;
export type CreateOrderInput = z.input<typeof createOrderSchema>;
