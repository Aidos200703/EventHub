import { expect, test } from "@playwright/test";
import { accounts, signIn } from "./helpers";

test("an organizer can't open or change another organizer's event", async ({ browser }) => {
  // Find an event id that belongs to Steppe Sound Agency
  const ownerCtx = await browser.newContext();
  const owner = await ownerCtx.newPage();
  await signIn(owner, accounts.organizer);
  await owner.goto("/organizer/events");
  const editHref = await owner.getByRole("link", { name: "Edit" }).first().getAttribute("href");
  expect(editHref).toMatch(/^\/organizer\/events\/[a-z0-9]+\/edit$/);
  const eventId = editHref!.split("/")[3]!;
  await ownerCtx.close();

  // Sign in as a different organizer
  const otherCtx = await browser.newContext();
  const other = await otherCtx.newPage();
  await signIn(other, accounts.otherOrganizer);

  await other.goto(editHref!);
  await expect(other.getByRole("heading", { name: "Not found" })).toBeVisible();

  const put = await other.request.put(`/api/organizer/events/${eventId}`, {
    data: { title: "Hijacked" },
  });
  expect([404, 422]).toContain(put.status());
  const status = await other.request.patch(`/api/organizer/events/${eventId}/status`, {
    data: { status: "DRAFT" },
  });
  expect(status.status()).toBe(404);
  const del = await other.request.delete(`/api/organizer/events/${eventId}`);
  expect(del.status()).toBe(404);
  await otherCtx.close();
});

test("visitors can't use organizer pages or APIs", async ({ page }) => {
  await signIn(page, accounts.visitor);
  await page.goto("/organizer");
  await expect(page).toHaveURL(/\/account\?notice=organizer-only/);
  const res = await page.request.get("/api/organizer/stats");
  expect(res.status()).toBe(403);
});

test("signed-out users are redirected to sign in", async ({ page }) => {
  await page.goto("/account");
  await expect(page).toHaveURL(/\/sign-in\?next=%2Faccount/);
  const res = await page.request.post("/api/orders", { data: {} });
  expect(res.status()).toBe(401);
});
