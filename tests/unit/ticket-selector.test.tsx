import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { TicketSelector } from "@/components/booking/ticket-selector";
import { routerMock } from "../setup";
import { renderWithProviders, visitor } from "./test-utils";

const types = [
  { id: "ga", name: "General", description: null, price: 10000, available: 50, maxPerOrder: 10 },
  { id: "vip", name: "VIP", description: "Front rows", price: 30000, available: 2, maxPerOrder: 4 },
  {
    id: "early",
    name: "Early bird",
    description: null,
    price: 8000,
    available: 0,
    maxPerOrder: 10,
  },
];

describe("<TicketSelector />", () => {
  beforeEach(() => routerMock.push.mockClear());

  it("updates the subtotal as quantities change", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TicketSelector slug="jazz" types={types} salesOpen />, { user: visitor });

    const checkout = screen.getByRole("button", { name: /continue to checkout/i });
    expect(checkout).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Add one General ticket" }));
    await user.click(screen.getByRole("button", { name: "Add one General ticket" }));
    await user.click(screen.getByRole("button", { name: "Add one VIP ticket" }));

    expect(screen.getByText("3 tickets")).toBeInTheDocument();
    expect(screen.getByText("50,000 ₸")).toBeInTheDocument();
    expect(checkout).toBeEnabled();
  });

  it("does not allow more than the remaining inventory", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TicketSelector slug="jazz" types={types} salesOpen />, { user: visitor });
    const add = screen.getByRole("button", { name: "Add one VIP ticket" });
    await user.click(add);
    await user.click(add);
    expect(add).toBeDisabled();
    expect(screen.getByLabelText("VIP: 2 selected")).toHaveTextContent("2");
  });

  it("shows sold out types without a stepper", () => {
    renderWithProviders(<TicketSelector slug="jazz" types={types} salesOpen />, { user: visitor });
    expect(screen.getByText("Sold out")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Add one Early bird ticket" }),
    ).not.toBeInTheDocument();
  });

  it("carries the selection to checkout in the URL", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TicketSelector slug="jazz" types={types} salesOpen />, { user: visitor });
    await user.click(screen.getByRole("button", { name: "Add one VIP ticket" }));
    await user.click(screen.getByRole("button", { name: /continue to checkout/i }));
    expect(routerMock.push).toHaveBeenCalledWith("/checkout/jazz?tickets=vip:1");
  });

  it("sends guests to sign in first, then back to checkout", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TicketSelector slug="jazz" types={types} salesOpen />);
    await user.click(screen.getByRole("button", { name: "Add one General ticket" }));
    await user.click(screen.getByRole("button", { name: /sign in to book/i }));
    expect(routerMock.push).toHaveBeenCalledWith(
      `/sign-in?next=${encodeURIComponent("/checkout/jazz?tickets=ga:1")}`,
    );
  });

  it("explains when sales are closed", () => {
    renderWithProviders(<TicketSelector slug="jazz" types={types} salesOpen={false} />);
    expect(screen.getByText(/ticket sales for this event have ended/i)).toBeInTheDocument();
  });
});
