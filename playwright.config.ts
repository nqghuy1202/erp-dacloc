import { defineConfig, devices } from "@playwright/test";

/** E2E chạy trên DB demo (dữ liệu mẫu từ db:seed) — không chạy trên DB đang phục vụ người dùng thật (CLAUDE.md L2). */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  retries: 0,
  workers: 1,
  use: { baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3100", trace: "retain-on-failure", locale: "vi-VN", timezoneId: "Asia/Ho_Chi_Minh" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } } },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /field\.spec\.ts/ },
  ],
  webServer: process.env.E2E_BASE_URL ? undefined : {
    command: "npx next start -p 3100", url: "http://localhost:3100/dang-nhap", reuseExistingServer: true, timeout: 120_000,
  },
});
