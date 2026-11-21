import { expect, test } from "@playwright/test";
import { accounts, signIn } from "./helpers";

test("search → pick tickets → test payment → ticket in my account", async ({ page }) => {
  await signIn(page, accounts.visitor);

  // 1. Search the catalog; filters are reflected in the URL
  await page.goto("/events");
  await page.getByRole("searchbox", { name: "Search events" }).fill("Winter Run");
  await expect(page).toHaveURL(/q=Winter\+Run|q=Winter%20Run/);
  const card = page.getByRole("article").filter({ hasText: "Almaty Winter Run" });
  await expect(card).toBeVisible();
  await card.getByRole("link", { name: "Almaty Winter Run" }).click();

  // 2. Event page: choose ticket type and quantity
  await expect(page.getByRole("heading", { level: 1, name: "Almaty Winter Run" })).toBeVisible();
  await page.getByRole("button", { name: "Add one 10 km ticket" }).click();
  await page.getByRole("button", { name: "Add one 10 km ticket" }).click();
  await page.getByRole("button", { name: "Continue to checkout" }).click();

  // 3. Checkout: buyer details are pre-filled, total includes the service fee
  await expect(page).toHaveURL(/\/checkout\/almaty-winter-run/);
  await expect(page.getByTestId("order-total")).toHaveText("24,960 ₸");
  await expect(page.getByText("Test payment — no real money is charged.")).toBeVisible();
  await page.getByRole("button", { name: "Fill in the test card" }).click();
  await page.getByRole("button", { name: /Pay 24,960/ }).click();

  // 4. Success page with QR tickets
  await expect(page.getByRole("heading", { name: "You're going!" })).toBeVisible();
  await expect(page.getByTestId("ticket")).toHaveCount(2);
  const orderNumber = (await page
    .getByText(/^EH-[A-Z0-9]{6}$/)
    .first()
    .textContent())!.trim();

  // 5. The order is in the visitor's account
  await page.goto("/account");
  const booking = page
    .getByRole("article")
    .filter({ hasText: "Almaty Winter Run" })
    .filter({ hasText: orderNumber });
  await expect(booking).toBeVisible();
  await expect(booking.getByText("2 tickets")).toBeVisible();
  await booking.getByRole("link").click();
  await expect(page.getByTestId("ticket")).toHaveCount(2);
});

test("guests are asked to sign in and come back to checkout", async ({ page }) => {
  await page.goto("/events/futsal-cup-final");
  await page.getByRole("button", { name: "Add one Upper tier ticket" }).click();
  await page.getByRole("button", { name: "Sign in to book" }).click();
  await expect(page).toHaveURL(/\/sign-in\?next=/);
  await page.getByLabel("Email").fill(accounts.visitor);
  await page.getByLabel("Password").fill(process.env.DEMO_PASSWORD ?? "eventhub-demo");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/checkout\/futsal-cup-final\?tickets=/);
  await expect(page.getByTestId("order-total")).toHaveText("3,120 ₸");
});

test("catalog filters are shareable via URL", async ({ page }) => {
  await page.goto("/events?city=astana&category=theatre");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Theatre");
  await expect(page.getByRole("article").filter({ hasText: "Swan Lake" })).toBeVisible();
  await expect(page.getByRole("article").filter({ hasText: "Hamlet" })).toHaveCount(0);
});
