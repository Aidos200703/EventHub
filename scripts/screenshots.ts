/**
 * Captures the README screenshots into docs/screenshots.
 * Needs a running app with fresh demo data:
 *   npm run db:seed && npm run build
 *   E2E=1 npm run start -- --port 3100
 *   npx tsx scripts/screenshots.ts   (BASE_URL defaults to http://localhost:3100)
 */
import { mkdirSync } from "node:fs";
import { chromium, devices, type Locator, type Page } from "@playwright/test";

const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const PASSWORD = process.env.DEMO_PASSWORD ?? "eventhub-demo";
const OUT = "docs/screenshots";
mkdirSync(OUT, { recursive: true });

async function shot(page: Page, name: string, fullPage = false) {
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage });
  console.log("✓", name);
}

async function scrollTo(page: Page, target: Locator, offset: number) {
  const box = await target.boundingBox();
  if (box) await page.evaluate((y) => window.scrollBy(0, y), box.y - offset);
}

async function signIn(page: Page, email: string) {
  await page.goto(`${BASE}/sign-in`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/sign-in"));
}

const browser = await chromium.launch();
const desktop = {
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
  colorScheme: "light" as const,
};

// Public pages (guest)
{
  const ctx = await browser.newContext(desktop);
  const page = await ctx.newPage();
  await page.goto(BASE);
  await shot(page, "home");
  await page.goto(`${BASE}/events?city=almaty&sort=popular`);
  await shot(page, "catalog");
  await page.goto(`${BASE}/events/steppe-echoes-festival`);
  await shot(page, "event");
  await ctx.close();
}

// Visitor: booking flow and account
let ticketCode = "";
{
  const ctx = await browser.newContext(desktop);
  const page = await ctx.newPage();
  await signIn(page, "visitor@eventhub.kz");
  await page.goto(`${BASE}/events/almaty-winter-run`);
  const add = page.getByRole("button", { name: "Add one 10 km ticket" });
  await add.click();
  await add.click();
  await scrollTo(page, page.getByRole("heading", { name: "Tickets", exact: true }), 120);
  await shot(page, "event-booking");
  await page.getByRole("button", { name: "Continue to checkout" }).click();
  await page.waitForURL(/\/checkout\//);
  await page.getByRole("button", { name: "Fill in the test card" }).click();
  await page.evaluate(() => window.scrollTo(0, 0));
  await shot(page, "checkout");
  await page.getByRole("button", { name: /^Pay / }).click();
  await page.getByRole("heading", { name: "You're going!" }).waitFor();
  await shot(page, "order-tickets");
  ticketCode = (await page
    .getByTestId("ticket")
    .first()
    .locator("p.select-all")
    .textContent())!.trim();
  await page.goto(`${BASE}/account`);
  await shot(page, "account");
  await ctx.close();
}

// Organizer dashboard
{
  const ctx = await browser.newContext(desktop);
  const page = await ctx.newPage();
  await signIn(page, "organizer@eventhub.kz");
  await page.goto(`${BASE}/organizer`);
  await shot(page, "organizer-overview");
  await page.goto(`${BASE}/organizer/events`);
  await shot(page, "organizer-events");
  await page
    .getByRole("listitem")
    .filter({ hasText: "Aidyn Quartet" })
    .getByRole("link", { name: /Edit/ })
    .click();
  await page.waitForURL((u) => u.pathname.endsWith("/edit"));
  await scrollTo(page, page.getByRole("heading", { name: "Tickets", exact: true }), 40);
  await shot(page, "organizer-event-form");
  await page.goto(`${BASE}/organizer/orders`);
  await shot(page, "organizer-orders");
  await page.goto(`${BASE}/organizer/check-in?code=${encodeURIComponent(ticketCode)}`);
  await page.getByText("Holder").waitFor();
  await shot(page, "organizer-check-in");
  await ctx.close();
}

// Mobile
{
  const ctx = await browser.newContext({
    ...devices["Pixel 7"],
    colorScheme: "light",
  });
  const page = await ctx.newPage();
  await page.goto(BASE);
  await shot(page, "mobile-home");
  await page.goto(`${BASE}/events`);
  await shot(page, "mobile-catalog");
  await page.goto(`${BASE}/events/aidyn-quartet-midnight-jazz`);
  await page.getByRole("button", { name: "Add one Table seat ticket" }).click();
  await page.getByRole("button", { name: "Add one Table seat ticket" }).click();
  await scrollTo(page, page.getByRole("heading", { name: "Tickets", exact: true }), 90);
  await shot(page, "mobile-tickets");
  await ctx.close();
}

await browser.close();
