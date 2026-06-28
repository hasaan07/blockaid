import { test, expect } from "@playwright/test";
import {
  uniqueEmail,
  registerViaUI,
  loginViaUI,
  createAuthedContext,
  createAuthedContextWithEmail,
  seedCampaign,
} from "./helpers";

test("UC_11: campaign owner can post an update", async ({ page }) => {
  // Register a user via an authed API context, and seed a campaign they own.
  const ctx = await createAuthedContextWithEmail();
  const campaign = await seedCampaign(ctx.request, { title: "Owner Update Campaign" });
  await ctx.request.dispose();

  // Log into the browser UI as that SAME user, so they're the owner.
  await loginViaUI(page, ctx.email);

  await page.goto(`/campaigns/${campaign.id}`);

  const updateBox = page.getByPlaceholder("Share progress with your backers…");
  await expect(updateBox).toBeVisible({ timeout: 10000 });
  await updateBox.fill("We bought the first 50 books today!");
  await page.getByRole("button", { name: "Publish Update" }).click();

  await expect(page.getByText("We bought the first 50 books today!")).toBeVisible({
    timeout: 10000,
  });
});

test("UC_12: a logged-in user can post a comment", async ({ page }) => {
  // Seed a campaign owned by someone else (authed context).
  const ctx = await createAuthedContext();
  const campaign = await seedCampaign(ctx, { title: "Comment Target Campaign" });
  await ctx.dispose();

  // Register a different user via UI and comment.
  const email = uniqueEmail("commenter");
  await registerViaUI(page, "Commenter", email);

  await page.goto(`/campaigns/${campaign.id}`);
  const commentBox = page.getByPlaceholder("Add a comment…");
  await expect(commentBox).toBeVisible({ timeout: 10000 });
  await commentBox.fill("This is a great cause!");
  await page.getByRole("button", { name: "Post Comment" }).click();

  await expect(page.getByText("This is a great cause!")).toBeVisible({ timeout: 10000 });
});

test("UC_11 guard: non-owner does not see the update form", async ({ page }) => {
  const ctx = await createAuthedContext();
  const campaign = await seedCampaign(ctx, { title: "Guard Test Campaign" });
  await ctx.dispose();

  const email = uniqueEmail("nonowner");
  await registerViaUI(page, "Non Owner", email);

  await page.goto(`/campaigns/${campaign.id}`);
  await expect(page.getByPlaceholder("Share progress with your backers…")).toHaveCount(0);
});
