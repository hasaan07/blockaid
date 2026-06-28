import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for BlockAid E2E tests.
 *
 * - Tests live in tests/e2e.
 * - The webServer block auto-starts `npm run dev` before tests and reuses an
 *   already-running dev server locally (so you don't have to start it manually).
 * - In CI we run against the same dev server, started fresh.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false, // tests share a DB; run serially to avoid data races
  forbidOnly: !!process.env.CI, // fail CI if someone left test.only in
  retries: process.env.CI ? 2 : 0,
  workers: 1, // single worker — shared DB state
  reporter: process.env.CI ? [["html", { open: "never" }], ["list"]] : "list",

  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry", // capture a trace when a test retries (for debugging)
    screenshot: "only-on-failure",
    // launchOptions: {
    //   slowMo: 700, // milliseconds between each action — REMOVE before committing
    // },
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000, // give Next.js up to 2 min to start
  },
});
