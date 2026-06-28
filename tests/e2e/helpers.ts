import {
  type Page,
  type APIRequestContext,
  request as playwrightRequest,
  expect,
} from "@playwright/test";

/** Generate a unique email so repeated test runs never collide. */
export function uniqueEmail(prefix = "e2e"): string {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}@test.com`;
}

export const TEST_PASSWORD = "Passw0rd!";

/** Register a new user through the UI and end up logged in. */
export async function registerViaUI(
  page: Page,
  name: string,
  email: string,
  password = TEST_PASSWORD
) {
  await page.goto("/register");
  await page.getByLabel("Full Name").fill(name);
  await page.getByLabel("Email Address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm Password").fill(password);
  await page.getByLabel(/I agree/).check();
  await page.getByRole("button", { name: "Create Account" }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
}

/** Log in an existing user through the UI. */
export async function loginViaUI(page: Page, email: string, password = TEST_PASSWORD) {
  await page.goto("/login");
  await page.getByLabel("Email Address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
}

/** Register a user via the API on the given (cookie-bearing) context. */
export async function registerViaAPI(
  request: APIRequestContext,
  name: string,
  email: string,
  password = TEST_PASSWORD
) {
  const res = await request.post("/api/auth/register", {
    data: { name, email, password },
  });
  expect(res.ok()).toBeTruthy();
  return res;
}

/**
 * Create a fresh authenticated API context (its own cookie jar), register a
 * user on it, and return it. Use this for seeding so the POST /api/campaigns
 * call is authenticated.
 */
export async function createAuthedContext(): Promise<APIRequestContext> {
  const ctx = await playwrightRequest.newContext({ baseURL: "http://localhost:3000" });
  await registerViaAPI(ctx, "Seeder", uniqueEmail("seeder"));
  return ctx;
}

/**
 * Like createAuthedContext, but returns BOTH the context and the email used,
 * so a test can subsequently log into the UI as that same user (e.g. to be the
 * owner of a seeded campaign).
 */
export async function createAuthedContextWithEmail(): Promise<{
  request: APIRequestContext;
  email: string;
}> {
  const email = uniqueEmail("owner");
  const ctx = await playwrightRequest.newContext({ baseURL: "http://localhost:3000" });
  await registerViaAPI(ctx, "Owner User", email);
  return { request: ctx, email };
}

/**
 * Seed a campaign via an AUTHENTICATED context. Pass the context returned by
 * createAuthedContext(). Uses a unique title suffix so repeated runs don't
 * create ambiguous duplicate text matches.
 */
export async function seedCampaign(
  request: APIRequestContext,
  overrides: Partial<{
    title: string;
    description: string;
    story: string;
    category: string;
    goalWei: string;
    deadline: string;
    contractAddress: string;
  }> = {}
) {
  const rand = Math.floor(Math.random() * 1e10)
    .toString(16)
    .padStart(40, "0")
    .slice(0, 40);

  const data = {
    title: overrides.title || "E2E Test Campaign",
    description:
      overrides.description || "A campaign created by the E2E test suite for browsing tests.",
    story: overrides.story || "Detailed story for the E2E test campaign.",
    category: overrides.category || "Education",
    goalWei: overrides.goalWei || "5000000000000000000",
    deadline: overrides.deadline || new Date(Date.now() + 30 * 86400000).toISOString(),
    contractAddress: overrides.contractAddress || `0x${rand}`,
    imageCid: "",
  };

  const res = await request.post("/api/campaigns", { data });
  expect(res.ok()).toBeTruthy();
  return res.json();
}
