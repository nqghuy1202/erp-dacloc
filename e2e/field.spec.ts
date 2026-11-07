import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("AC-6 công nhân ghi cho ăn → lưu, đồng bộ, sang bể kế tiếp", async ({ page }) => {
  await login(page, "CN001");
  await expect(page).toHaveURL(/hien-truong/);
  await page.goto("/hien-truong/be");
  await page.locator('a[href^="/hien-truong/be/"]').first().click();
  await expect(page.getByRole("button", { name: "Cho ăn" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: /^Lưu/ }).click();
  await expect(page.getByText(/Đã lưu/)).toBeVisible();
  await expect(page.getByRole("button", { name: /Đã đồng bộ/ })).toBeVisible({ timeout: 15000 });
});

test("AC-9 nhập pH ngoài ngưỡng → báo ngay tại trường", async ({ page }) => {
  await login(page, "CN001");
  await page.goto("/hien-truong/be");
  await page.locator('a[href^="/hien-truong/be/"]').first().click();
  await page.getByRole("button", { name: "Nước" }).click();
  await page.locator("#w-ph").fill("9,3");
  await expect(page.getByText(/Ngoài ngưỡng/)).toBeVisible();
});

test("AC-8 công nhân mở bể trại khác → chặn", async ({ page }) => {
  await login(page, "CN001");
  const res = await page.request.get("/api/resolve?code=TG11-B01");
  const { href } = await res.json();
  await page.goto(href);
  await expect(page.getByRole("alert")).toContainText("không được giao");
});
