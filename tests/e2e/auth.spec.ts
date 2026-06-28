import { test, expect } from "@playwright/test";
import { uniqueEmail, registerViaUI, loginViaUI, TEST_PASSWORD } from "./helpers";

test.describe("Authentication (UC_01, UC_02, UC_03)", () => {
  test("UC_01: a new user can register", async ({ page }) => {
    const email = uniqueEmail("reg");
    await registerViaUI(page, "Test User", email);

    // Navbar should now show the user's first name and a Log out button.
    await expect(page.getByRole("button", { name: "Log out" })).toBeVisible();
  });

  test("UC_01 negative: duplicate email is rejected", async ({ page }) => {
    const email = uniqueEmail("dup");
    await registerViaUI(page, "First User", email);

    // Log out, then try to register again with the same email.
    await page.getByRole("button", { name: "Log out" }).click();
    await page.goto("/register");
    await page.getByLabel("Full Name").fill("Second User");
    await page.getByLabel("Email Address").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(TEST_PASSWORD);
    await page.getByLabel("Confirm Password").fill(TEST_PASSWORD);
    await page.getByLabel(/I agree/).check();
    await page.getByRole("button", { name: "Create Account" }).click();

    await expect(page.getByText(/already registered/i)).toBeVisible();
  });

  test("UC_02: a registered user can log in", async ({ page }) => {
    const email = uniqueEmail("login");
    await registerViaUI(page, "Login User", email);
    await page.getByRole("button", { name: "Log out" }).click();

    await loginViaUI(page, email);
    await expect(page.getByRole("button", { name: "Log out" })).toBeVisible();
  });

  test("UC_02 negative: wrong password is rejected", async ({ page }) => {
    const email = uniqueEmail("wrongpw");
    await registerViaUI(page, "PW User", email);
    await page.getByRole("button", { name: "Log out" }).click();

    await page.goto("/login");
    await page.getByLabel("Email Address").fill(email);
    await page.getByLabel("Password", { exact: true }).fill("wrongpassword");
    await page.getByRole("button", { name: "Login" }).click();

    await expect(page.getByText(/invalid credentials/i)).toBeVisible();
  });

  test("UC_03: a user can log out", async ({ page }) => {
    const email = uniqueEmail("logout");
    await registerViaUI(page, "Logout User", email);

    await page.getByRole("button", { name: "Log out" }).click();
    // After logout, the navbar shows Login + Sign Up again.
    await expect(page.getByRole("link", { name: "Login" })).toBeVisible();
  });

  test("protected route redirects to login when logged out", async ({ page }) => {
    await page.goto("/profile");
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });
});
