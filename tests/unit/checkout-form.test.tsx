import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CheckoutForm, formatCardNumber, formatExpiry } from "@/components/booking/checkout-form";
import { routerMock } from "../setup";
import { renderWithProviders, visitor } from "./test-utils";

const types = [
  { id: "ga", name: "General", description: null, price: 10000, available: 5, maxPerOrder: 10 },
];
const defaults = { name: "Aruzhan Sadykova", email: "visitor@eventhub.kz", phone: "+77012345678" };

function renderForm() {
  return renderWithProviders(
    <CheckoutForm eventId="evt1" types={types} initialSelection={{ ga: 2 }} defaults={defaults} />,
    { user: visitor },
  );
}

describe("<CheckoutForm />", () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    routerMock.replace.mockClear();
  });
  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it("shows the total with service fee and a clear test-payment notice", () => {
    renderForm();
    expect(screen.getByTestId("order-total")).toHaveTextContent("20,800 ₸");
    expect(screen.getByText(/test payment — no real money is charged/i)).toBeInTheDocument();
  });

  it("shows accessible validation errors and does not submit", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.clear(screen.getByLabelText(/full name/i));
    await user.click(screen.getByRole("button", { name: /pay/i }));

    expect(await screen.findByText("Name must be at least 2 characters")).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText(/card number/i)).toHaveAccessibleDescription(
      /card number must have 16 digits/i,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("submits once with an idempotency key, even on a double click", async () => {
    const user = userEvent.setup();
    let resolve!: (r: Response) => void;
    fetchMock.mockReturnValue(new Promise<Response>((r) => (resolve = r)));
    renderForm();

    await user.click(screen.getByRole("button", { name: /fill in the test card/i }));
    const pay = screen.getByRole("button", { name: /pay 20,800/i });
    await user.dblClick(pay);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("button", { name: /processing/i })).toBeDisabled();

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("/api/orders");
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({
      eventId: "evt1",
      selection: { ga: 2 },
      buyer: defaults,
      // Parsed by Zod before sending: spaces are stripped.
      payment: { cardNumber: "4242424242424242", expiry: "12/30", cvc: "123" },
    });
    expect(body.idempotencyKey).toMatch(/^[0-9a-f-]{36}$/);

    resolve(
      new Response(JSON.stringify({ number: "EH-ABC123", replayed: false }), { status: 201 }),
    );
    await waitFor(() => expect(routerMock.replace).toHaveBeenCalledWith("/orders/EH-ABC123?new=1"));
  });

  it("shows the server error when tickets run out", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          error: { code: "NOT_ENOUGH_AVAILABLE", message: 'Not enough "General" tickets left.' },
        }),
        { status: 409 },
      ),
    );
    renderForm();
    await user.click(screen.getByRole("button", { name: /fill in the test card/i }));
    await user.click(screen.getByRole("button", { name: /pay/i }));
    expect(await screen.findByText('Not enough "General" tickets left.')).toBeInTheDocument();
    expect(routerMock.replace).not.toHaveBeenCalled();
  });
});

describe("card input masks", () => {
  it("groups card digits and formats expiry", () => {
    expect(formatCardNumber("4242424242424242999")).toBe("4242 4242 4242 4242");
    expect(formatCardNumber("42a42")).toBe("4242");
    expect(formatExpiry("1230")).toBe("12/30");
    expect(formatExpiry("1")).toBe("1");
  });
});
