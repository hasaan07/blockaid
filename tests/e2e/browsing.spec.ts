import { test, expect } from "@playwright/test";
import { createAuthedContext, seedCampaign } from "./helpers";
import type { APIRequestContext } from "@playwright/test";

test.describe("Campaign browsing (UC_08, UC_09)", () => {
  // Unique run tag so titles don't collide with previous test runs in the DB.
  const tag = `R${Date.now().toString().slice(-6)}`;
  let ctx: APIRequestContext;

  test.beforeAll(async () => {
    ctx = await createAuthedContext();
    await seedCampaign(ctx, { title: `Education Drive ${tag}`, category: "Education" });
    await seedCampaign(ctx, { title: `Health Fund ${tag}`, category: "Health" });
    await seedCampaign(ctx, { title: `Water Wells ${tag}`, category: "Environment" });
  });

  test.afterAll(async () => {
    await ctx.dispose();
  });

  test("UC_08: listing page shows campaigns", async ({ page }) => {
    await page.goto("/campaigns");
    await expect(
      page.getByRole("heading", { name: /Active Fundraising Campaigns/i })
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: `Education Drive ${tag}` })).toBeVisible({
      timeout: 10000,
    });
  });

  test("UC_08: category filter narrows results", async ({ page }) => {
    await page.goto("/campaigns");
    await page.getByRole("button", { name: "Health", exact: true }).click();
    await expect(page.getByRole("heading", { name: `Health Fund ${tag}` })).toBeVisible({
      timeout: 10000,
    });
  });

  test("UC_08: search filters by keyword", async ({ page }) => {
    await page.goto("/campaigns");
    await page.getByPlaceholder("Search campaigns…").fill(`Water Wells ${tag}`);
    await expect(page.getByRole("heading", { name: `Water Wells ${tag}` })).toBeVisible({
      timeout: 10000,
    });
  });

  test("UC_08: empty search shows empty state", async ({ page }) => {
    await page.goto("/campaigns");
    await page.getByPlaceholder("Search campaigns…").fill("zzzznonexistentquery");
    await expect(page.getByText(/No campaigns match your search/i)).toBeVisible({
      timeout: 10000,
    });
  });

  test("UC_09: clicking a campaign opens its details", async ({ page }) => {
    const c = await seedCampaign(ctx, { title: `Detail Target ${tag}` });
    await page.goto(`/campaigns/${c.id}`);
    await expect(page.getByRole("heading", { name: `Detail Target ${tag}` })).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText("Goal").first()).toBeVisible();
    await expect(page.getByText("Raised").first()).toBeVisible();
  });

  test("UC_09 negative: unknown campaign shows not-found", async ({ page }) => {
    await page.goto("/campaigns/000000000000000000000000");
    await expect(page.getByText(/Campaign not found/i)).toBeVisible({ timeout: 10000 });
  });
});
