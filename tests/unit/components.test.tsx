import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { FavoriteButton } from "@/components/events/favorite-button";
import { validateCoverFile } from "@/components/organizer/cover-upload";
import { pageWindow } from "@/components/catalog/pagination";
import { QuantityStepper } from "@/components/booking/quantity-stepper";
import { Field } from "@/components/ui/field";
import { useGuestFavorites } from "@/stores/guest-favorites";
import { renderWithProviders } from "./test-utils";

describe("<FavoriteButton /> for guests", () => {
  it("toggles a favorite stored on the device", async () => {
    const user = userEvent.setup();
    useGuestFavorites.setState({ ids: [] });
    renderWithProviders(<FavoriteButton eventId="evt1" title="Jazz Night" />);

    const button = await screen.findByRole("button", { name: "Save Jazz Night to favorites" });
    expect(button).toHaveAttribute("aria-pressed", "false");

    await user.click(button);
    expect(
      screen.getByRole("button", { name: "Remove Jazz Night from favorites" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(useGuestFavorites.getState().ids).toEqual(["evt1"]);

    await user.click(screen.getByRole("button", { name: "Remove Jazz Night from favorites" }));
    expect(useGuestFavorites.getState().ids).toEqual([]);
  });
});

describe("<QuantityStepper />", () => {
  it("is operable from the keyboard and respects bounds", async () => {
    const user = userEvent.setup();
    const values: number[] = [];
    renderWithProviders(
      <QuantityStepper label="VIP" value={0} max={1} onChange={(v) => values.push(v)} />,
    );
    expect(screen.getByRole("button", { name: "Remove one VIP ticket" })).toBeDisabled();
    await user.tab();
    expect(screen.getByRole("button", { name: "Add one VIP ticket" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(values).toEqual([1]);
  });
});

describe("<Field />", () => {
  it("links label, hint and error to the control", () => {
    renderWithProviders(
      <Field label="Email" hint="We never share it" error="Enter a valid email address" required>
        {(p) => <input {...p} />}
      </Field>,
    );
    const input = screen.getByLabelText(/email/i);
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Enter a valid email address");
    expect(screen.getByRole("alert")).toHaveTextContent("Enter a valid email address");
  });
});

describe("cover upload pre-check", () => {
  it("accepts supported images under 4 MB", () => {
    expect(validateCoverFile({ type: "image/webp", size: 1024 })).toBeNull();
  });
  it("rejects other types and large files", () => {
    expect(validateCoverFile({ type: "image/gif", size: 1024 })).toMatch(/JPEG, PNG or WebP/);
    expect(validateCoverFile({ type: "image/png", size: 5 * 1024 * 1024 })).toMatch(
      /Maximum is 4 MB/,
    );
    expect(validateCoverFile({ type: "image/png", size: 0 })).toMatch(/empty/);
  });
});

describe("pagination window", () => {
  it("shows all pages when there are few", () => {
    expect(pageWindow(2, 5)).toEqual([1, 2, 3, 4, 5]);
  });
  it("collapses distant pages into gaps", () => {
    expect(pageWindow(6, 12)).toEqual([1, "gap", 5, 6, 7, "gap", 12]);
    expect(pageWindow(1, 12)).toEqual([1, 2, "gap", 12]);
  });
});
