import { test, expect } from "@playwright/test";
import { uniqueEmail, registerViaUI } from "./helpers";

test.describe("Profile (UC_04)", () => {
  test("UC_04: a user can update their profile", async ({ page }) => {
    const email = uniqueEmail("profile");
    await registerViaUI(page, "Profile User", email);

    await page.goto("/profile");
    const nameField = page.getByLabel("Full Name");
    await expect(nameField).toHaveValue("Profile User");

    await nameField.fill("Updated Name");
    await page.getByLabel("Bio").fill("This is my E2E test bio.");
    await page.getByRole("button", { name: "Save Changes" }).click();

    await expect(page.getByText("Profile saved.")).toBeVisible();

    // Reload and confirm persistence.
    await page.reload();
    await expect(page.getByLabel("Full Name")).toHaveValue("Updated Name");
    await expect(page.getByLabel("Bio")).toHaveValue("This is my E2E test bio.");
  });

  test("UC_04 negative: empty name is rejected", async ({ page }) => {
    const email = uniqueEmail("profileneg");
    await registerViaUI(page, "Neg User", email);

    await page.goto("/profile");
    await page.getByLabel("Full Name").fill("");
    await page.getByRole("button", { name: "Save Changes" }).click();

    await expect(page.getByText(/name is required/i)).toBeVisible();
  });
});
