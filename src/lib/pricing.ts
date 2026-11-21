import { MAX_TICKETS_PER_ORDER, SERVICE_FEE_RATE } from "./constants";

export type PricedTicketType = {
  id: string;
  name: string;
  price: number;
  /** Remaining inventory (quantity - sold). */
  available: number;
  maxPerOrder: number;
};

/** ticketTypeId → quantity */
export type TicketSelection = Record<string, number>;

export type OrderLine = {
  ticketTypeId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

export type OrderQuote = {
  lines: OrderLine[];
  ticketCount: number;
  subtotal: number;
  serviceFee: number;
  total: number;
};

export type SelectionIssue =
  | { code: "EMPTY" }
  | { code: "UNKNOWN_TICKET_TYPE"; ticketTypeId: string }
  | { code: "INVALID_QUANTITY"; ticketTypeId: string }
  | { code: "SOLD_OUT"; ticketTypeId: string; name: string }
  | { code: "NOT_ENOUGH_AVAILABLE"; ticketTypeId: string; name: string; available: number }
  | { code: "OVER_TYPE_LIMIT"; ticketTypeId: string; name: string; limit: number }
  | { code: "OVER_ORDER_LIMIT"; limit: number };

export function serviceFeeFor(subtotal: number) {
  return Math.round(subtotal * SERVICE_FEE_RATE);
}

/** Highest quantity a customer can pick for a ticket type right now. */
export function maxSelectable(type: Pick<PricedTicketType, "available" | "maxPerOrder">) {
  return Math.max(0, Math.min(type.available, type.maxPerOrder, MAX_TICKETS_PER_ORDER));
}

export function validateSelection(
  types: PricedTicketType[],
  selection: TicketSelection,
): SelectionIssue[] {
  const issues: SelectionIssue[] = [];
  const byId = new Map(types.map((t) => [t.id, t]));
  let count = 0;

  for (const [id, qty] of Object.entries(selection)) {
    if (qty === 0) continue;
    const type = byId.get(id);
    if (!type) {
      issues.push({ code: "UNKNOWN_TICKET_TYPE", ticketTypeId: id });
      continue;
    }
    if (!Number.isInteger(qty) || qty < 0) {
      issues.push({ code: "INVALID_QUANTITY", ticketTypeId: id });
      continue;
    }
    if (type.available <= 0) issues.push({ code: "SOLD_OUT", ticketTypeId: id, name: type.name });
    else if (qty > type.available)
      issues.push({
        code: "NOT_ENOUGH_AVAILABLE",
        ticketTypeId: id,
        name: type.name,
        available: type.available,
      });
    else if (qty > type.maxPerOrder)
      issues.push({
        code: "OVER_TYPE_LIMIT",
        ticketTypeId: id,
        name: type.name,
        limit: type.maxPerOrder,
      });
    count += qty;
  }

  if (count === 0 && issues.length === 0) issues.push({ code: "EMPTY" });
  if (count > MAX_TICKETS_PER_ORDER)
    issues.push({ code: "OVER_ORDER_LIMIT", limit: MAX_TICKETS_PER_ORDER });
  return issues;
}

export function describeIssue(issue: SelectionIssue): string {
  switch (issue.code) {
    case "EMPTY":
      return "Select at least one ticket.";
    case "UNKNOWN_TICKET_TYPE":
      return "One of the selected ticket types is no longer available.";
    case "INVALID_QUANTITY":
      return "Ticket quantity must be a whole positive number.";
    case "SOLD_OUT":
      return `"${issue.name}" is sold out.`;
    case "NOT_ENOUGH_AVAILABLE":
      return `Only ${issue.available} "${issue.name}" ticket${issue.available === 1 ? "" : "s"} left.`;
    case "OVER_TYPE_LIMIT":
      return `You can buy up to ${issue.limit} "${issue.name}" tickets per order.`;
    case "OVER_ORDER_LIMIT":
      return `An order can contain up to ${issue.limit} tickets.`;
  }
}

/**
 * Pure price calculation shared by the checkout UI and the order service.
 * The server always recalculates from database prices — client totals are display-only.
 */
export function calculateQuote(types: PricedTicketType[], selection: TicketSelection): OrderQuote {
  const lines: OrderLine[] = [];
  for (const type of types) {
    const quantity = selection[type.id] ?? 0;
    if (quantity <= 0) continue;
    lines.push({
      ticketTypeId: type.id,
      name: type.name,
      unitPrice: type.price,
      quantity,
      lineTotal: type.price * quantity,
    });
  }
  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const serviceFee = serviceFeeFor(subtotal);
  return {
    lines,
    ticketCount: lines.reduce((s, l) => s + l.quantity, 0),
    subtotal,
    serviceFee,
    total: subtotal + serviceFee,
  };
}

/** "tt1:2,tt2:1" <-> { tt1: 2, tt2: 1 } — carries a selection to checkout via the URL. */
export function encodeSelection(selection: TicketSelection): string {
  return Object.entries(selection)
    .filter(([, q]) => q > 0)
    .map(([id, q]) => `${id}:${q}`)
    .join(",");
}

export function decodeSelection(value: string | null | undefined): TicketSelection {
  const out: TicketSelection = {};
  if (!value) return out;
  for (const part of value.split(",")) {
    const [id, raw] = part.split(":");
    const qty = Number(raw);
    if (id && /^[a-z0-9]+$/i.test(id) && Number.isInteger(qty) && qty > 0 && qty <= 100)
      out[id] = qty;
  }
  return out;
}
