import { describe, expect, it } from "vitest";
import {
  calculateQuote,
  decodeSelection,
  describeIssue,
  encodeSelection,
  maxSelectable,
  serviceFeeFor,
  validateSelection,
  type PricedTicketType,
} from "@/lib/pricing";

const types: PricedTicketType[] = [
  { id: "ga", name: "General", price: 12000, available: 100, maxPerOrder: 10 },
  { id: "vip", name: "VIP", price: 45000, available: 3, maxPerOrder: 4 },
  { id: "gone", name: "Early bird", price: 9000, available: 0, maxPerOrder: 10 },
];

describe("calculateQuote", () => {
  it("sums line totals and adds a 4% service fee", () => {
    const quote = calculateQuote(types, { ga: 2, vip: 1 });
    expect(quote.lines).toEqual([
      { ticketTypeId: "ga", name: "General", unitPrice: 12000, quantity: 2, lineTotal: 24000 },
      { ticketTypeId: "vip", name: "VIP", unitPrice: 45000, quantity: 1, lineTotal: 45000 },
    ]);
    expect(quote.subtotal).toBe(69000);
    expect(quote.serviceFee).toBe(2760);
    expect(quote.total).toBe(71760);
    expect(quote.ticketCount).toBe(3);
  });

  it("ignores zero quantities and unknown ids", () => {
    const quote = calculateQuote(types, { ga: 0, nope: 5 });
    expect(quote.lines).toHaveLength(0);
    expect(quote.total).toBe(0);
  });

  it("rounds the service fee to whole tenge", () => {
    expect(serviceFeeFor(1999)).toBe(80); // 79.96
    expect(serviceFeeFor(1)).toBe(0);
    expect(serviceFeeFor(0)).toBe(0);
  });

  it("keeps the order of ticket types, not of the selection", () => {
    const quote = calculateQuote(types, { vip: 1, ga: 1 });
    expect(quote.lines.map((l) => l.ticketTypeId)).toEqual(["ga", "vip"]);
  });
});

describe("validateSelection", () => {
  it("accepts a valid selection", () => {
    expect(validateSelection(types, { ga: 2 })).toEqual([]);
  });

  it("requires at least one ticket", () => {
    expect(validateSelection(types, {})).toEqual([{ code: "EMPTY" }]);
    expect(validateSelection(types, { ga: 0 })).toEqual([{ code: "EMPTY" }]);
  });

  it("rejects more than available", () => {
    const [issue] = validateSelection(types, { vip: 4 });
    expect(issue).toMatchObject({ code: "NOT_ENOUGH_AVAILABLE", available: 3 });
    expect(describeIssue(issue!)).toBe('Only 3 "VIP" tickets left.');
  });

  it("rejects sold out types", () => {
    expect(validateSelection(types, { gone: 1 })[0]).toMatchObject({ code: "SOLD_OUT" });
  });

  it("enforces the per-type limit", () => {
    expect(validateSelection(types, { ga: 11 })[0]).toMatchObject({
      code: "OVER_TYPE_LIMIT",
      limit: 10,
    });
  });

  it("enforces the per-order limit of 20 tickets", () => {
    const many: PricedTicketType[] = [
      { id: "a", name: "A", price: 1000, available: 100, maxPerOrder: 20 },
      { id: "b", name: "B", price: 1000, available: 100, maxPerOrder: 20 },
    ];
    expect(validateSelection(many, { a: 15, b: 6 })).toContainEqual({
      code: "OVER_ORDER_LIMIT",
      limit: 20,
    });
  });

  it("rejects unknown ids and non-integer quantities", () => {
    expect(validateSelection(types, { other: 1 })[0]).toMatchObject({
      code: "UNKNOWN_TICKET_TYPE",
    });
    expect(validateSelection(types, { ga: 1.5 })[0]).toMatchObject({ code: "INVALID_QUANTITY" });
    expect(validateSelection(types, { ga: -1 })[0]).toMatchObject({ code: "INVALID_QUANTITY" });
  });
});

describe("maxSelectable", () => {
  it("is the smallest of availability, per-type and per-order limits", () => {
    expect(maxSelectable({ available: 3, maxPerOrder: 10 })).toBe(3);
    expect(maxSelectable({ available: 100, maxPerOrder: 4 })).toBe(4);
    expect(maxSelectable({ available: 100, maxPerOrder: 50 })).toBe(20);
    expect(maxSelectable({ available: -2, maxPerOrder: 4 })).toBe(0);
  });
});

describe("selection URL encoding", () => {
  it("round-trips and drops zero quantities", () => {
    const encoded = encodeSelection({ ga: 2, vip: 0, x1: 1 });
    expect(encoded).toBe("ga:2,x1:1");
    expect(decodeSelection(encoded)).toEqual({ ga: 2, x1: 1 });
  });

  it("ignores malformed parts", () => {
    expect(decodeSelection("ga:2,bad,vip:-1,x:abc,<script>:1,ok:1000")).toEqual({ ga: 2 });
    expect(decodeSelection(null)).toEqual({});
  });
});
