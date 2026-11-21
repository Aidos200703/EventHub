import { describe, expect, it } from "vitest";
import {
  buyerSchema,
  checkoutFormSchema,
  isExpiryInFuture,
  luhnValid,
  paymentSchema,
} from "@/lib/validation/checkout";
import { normalizeKzPhone } from "@/lib/validation/common";
import { eventFormSchema, publishBlockers, type EventFormInput } from "@/lib/validation/event";
import {
  activeFilterCount,
  catalogSearchToQuery,
  parseCatalogSearch,
} from "@/lib/validation/catalog";
import { profileSchema, signUpSchema } from "@/lib/validation/account";

describe("Kazakhstan phone numbers", () => {
  it.each([
    ["+7 701 234 56 78", "+77012345678"],
    ["87012345678", "+77012345678"],
    ["8 (701) 234-56-78", "+77012345678"],
    ["77012345678", "+77012345678"],
  ])("normalizes %s", (input, expected) => {
    expect(normalizeKzPhone(input)).toBe(expected);
  });

  it.each(["12345", "+1 202 555 0100", "+7 701 234 56 7", "phone"])("rejects %s", (input) => {
    expect(normalizeKzPhone(input)).toBeNull();
  });
});

describe("buyer form", () => {
  it("normalizes email and phone", () => {
    const out = buyerSchema.parse({
      name: "  Aruzhan  ",
      email: " ARU@Example.KZ ",
      phone: "8 701 234 56 78",
    });
    expect(out).toEqual({ name: "Aruzhan", email: "aru@example.kz", phone: "+77012345678" });
  });

  it("returns readable messages", () => {
    const res = buyerSchema.safeParse({ name: "A", email: "not-an-email", phone: "123" });
    expect(res.success).toBe(false);
    const messages = res.error!.issues.map((i) => i.message);
    expect(messages).toContain("Name must be at least 2 characters");
    expect(messages).toContain("Enter a valid email address");
    expect(messages).toContain("Enter a Kazakhstan number, e.g. +7 701 234 56 78");
  });
});

describe("test payment form", () => {
  const now = new Date("2026-11-15T10:00:00Z");

  it("validates card numbers with the Luhn checksum", () => {
    expect(luhnValid("4242424242424242")).toBe(true);
    expect(luhnValid("4242424242424241")).toBe(false);
  });

  it("strips spaces from the card number", () => {
    const out = paymentSchema.parse({
      cardNumber: "4242 4242 4242 4242",
      expiry: "12/30",
      cvc: "123",
    });
    expect(out.cardNumber).toBe("4242424242424242");
  });

  it("checks expiry against the current month", () => {
    expect(isExpiryInFuture("11/26", now)).toBe(true); // valid through end of November
    expect(isExpiryInFuture("10/26", now)).toBe(false);
    expect(isExpiryInFuture("13/30", now)).toBe(false);
    expect(isExpiryInFuture("1230", now)).toBe(false);
  });

  it("rejects malformed payment data", () => {
    const res = checkoutFormSchema.safeParse({
      buyer: { name: "Dias", email: "dias@example.kz", phone: "+77011112233" },
      payment: { cardNumber: "1234", expiry: "99/99", cvc: "12" },
    });
    expect(res.success).toBe(false);
    const paths = res.error!.issues.map((i) => i.path.join("."));
    expect(paths).toEqual(
      expect.arrayContaining(["payment.cardNumber", "payment.expiry", "payment.cvc"]),
    );
  });
});

describe("event form", () => {
  const valid: EventFormInput = {
    title: "Jazz night",
    summary: "An evening of jazz standards",
    description: "A long enough description of the event for the validation rule.",
    category: "CONCERT",
    city: "almaty",
    venueName: "Jazz Club",
    venueAddress: "Abai Ave 1, Almaty",
    startsAt: "2026-12-14T19:00",
    endsAt: "2026-12-14T22:00",
    coverUrl: "/api/uploads/abc123",
    ticketTypes: [{ name: "Standard", price: 5000, quantity: 100, maxPerOrder: 10 }],
    program: [{ time: "19:00", title: "Doors" }],
  };

  it("accepts a valid event", () => {
    expect(eventFormSchema.safeParse(valid).success).toBe(true);
  });

  it("requires the end to be after the start", () => {
    const res = eventFormSchema.safeParse({ ...valid, endsAt: "2026-12-14T18:00" });
    expect(res.error?.issues[0]).toMatchObject({
      path: ["endsAt"],
      message: "End must be after the start",
    });
  });

  it("requires unique ticket type names", () => {
    const res = eventFormSchema.safeParse({
      ...valid,
      ticketTypes: [valid.ticketTypes[0]!, { ...valid.ticketTypes[0]!, name: "standard" }],
    });
    expect(res.error?.issues.some((i) => i.message === "Ticket type names must be unique")).toBe(
      true,
    );
  });

  it("validates prices and quantities", () => {
    const res = eventFormSchema.safeParse({
      ...valid,
      ticketTypes: [{ name: "X1", price: 50, quantity: 0, maxPerOrder: 30 }],
    });
    const messages = res.error!.issues.map((i) => i.message);
    expect(messages).toEqual(
      expect.arrayContaining([
        "Price must be at least 100",
        "Quantity must be at least 1",
        "Limit must be at most 20",
      ]),
    );
  });

  it("reports NaN from empty number inputs as required", () => {
    const res = eventFormSchema.safeParse({
      ...valid,
      ticketTypes: [{ name: "X1", price: Number.NaN, quantity: 10, maxPerOrder: 5 }],
    });
    expect(res.error!.issues[0]!.message).toBe("Price is required");
  });

  it("only accepts covers from our own storage", () => {
    expect(
      eventFormSchema.safeParse({ ...valid, coverUrl: "https://evil.example/x.png" }).success,
    ).toBe(false);
    expect(
      eventFormSchema.safeParse({ ...valid, coverUrl: "/covers/demo-event.webp" }).success,
    ).toBe(true);
  });

  it("lists what blocks publishing", () => {
    const now = new Date("2026-11-15T00:00:00Z");
    expect(
      publishBlockers(
        { coverUrl: null, startsAt: new Date("2026-01-01"), ticketTypeCount: 0 },
        now,
      ),
    ).toEqual([
      "Add a cover image",
      "Add at least one ticket type",
      "Start date must be in the future",
    ]);
    expect(
      publishBlockers(
        { coverUrl: "/covers/x.webp", startsAt: new Date("2027-01-01"), ticketTypeCount: 1 },
        now,
      ),
    ).toEqual([]);
  });
});

describe("account forms", () => {
  it("only allows known roles at sign-up", () => {
    expect(
      signUpSchema.safeParse({
        name: "Org",
        email: "o@x.kz",
        password: "longenough",
        role: "ADMIN",
      }).success,
    ).toBe(false);
  });

  it("turns empty optional profile fields into null", () => {
    expect(profileSchema.parse({ name: "Aruzhan", phone: "", city: "", bio: "  " })).toEqual({
      name: "Aruzhan",
      phone: null,
      city: null,
      bio: null,
    });
  });
});

describe("catalog search params", () => {
  it("falls back to defaults for invalid values instead of throwing", () => {
    const s = parseCatalogSearch({
      city: "atlantis",
      category: "nope",
      sort: "random",
      page: "-3",
      minPrice: "abc",
    });
    expect(s).toMatchObject({
      city: undefined,
      category: undefined,
      sort: "date",
      page: 1,
      minPrice: undefined,
    });
  });

  it("swaps an inverted price range and lets a date preset win over a custom range", () => {
    const s = parseCatalogSearch(
      new URLSearchParams("minPrice=20000&maxPrice=5000&date=weekend&from=2026-12-01"),
    );
    expect(s).toMatchObject({ minPrice: 5000, maxPrice: 20000, date: "weekend", from: undefined });
  });

  it("serializes to a canonical, shareable query string", () => {
    const s = parseCatalogSearch({
      q: " jazz ",
      city: "almaty",
      sort: "date",
      page: "1",
      category: "concert",
    });
    expect(catalogSearchToQuery(s)).toBe("q=jazz&city=almaty&category=concert");
    expect(catalogSearchToQuery({ ...s, sort: "price-asc", page: 2 })).toBe(
      "q=jazz&city=almaty&category=concert&sort=price-asc&page=2",
    );
    expect(activeFilterCount(s)).toBe(2);
  });
});
