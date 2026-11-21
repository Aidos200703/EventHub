import { expect, type Page } from "@playwright/test";

export const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? "eventhub-demo";

export const accounts = {
  visitor: "visitor@eventhub.kz",
  organizer: "organizer@eventhub.kz",
  otherOrganizer: "stage@eventhub.kz",
} as const;

export async function signIn(page: Page, email: string, next?: string) {
  await page.goto(`/sign-in${next ? `?next=${encodeURIComponent(next)}` : ""}`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(DEMO_PASSWORD);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).not.toHaveURL(/\/sign-in/);
}
