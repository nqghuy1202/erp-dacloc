import { expect, test } from "@playwright/test";
import { login } from "./helpers";

// Hồi quy: phản hồi M1 /hien-truong kéo ~68s (DOMContentLoaded không đến trong 40s) vì generateDailyTasks
// chèn mỗi lô một lệnh tới Supabase. Trang phải trả xong HTML trong ngưỡng như các màn hiện trường khác.
test.use({ serviceWorkers: "block" });

test("M1 /hien-truong trả xong HTML (domcontentloaded) trong 15s", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await login(page, "CN001");
  const t0 = Date.now();
  await page.goto("/hien-truong", { waitUntil: "domcontentloaded", timeout: 15_000 });
  expect(Date.now() - t0).toBeLessThan(15_000);
  await expect(page.getByText(/việc hôm nay/)).toBeVisible();

  const res = await page.request.get("/hien-truong", { timeout: 15_000 });
  expect(res.status()).toBe(200);
  expect(await res.text()).toContain("</html>");
});
