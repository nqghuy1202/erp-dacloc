import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("đăng nhập sai báo lỗi, không vào được", async ({ page }) => {
  await page.goto("/dang-nhap");
  await page.locator("#empCode").fill("GD01");
  await page.locator("#password").fill("sai-mat-khau");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page.getByRole("alert")).toContainText("không đúng");
});

test("chưa đăng nhập → về trang đăng nhập", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/dang-nhap/);
});

test("AC-19/AC-22 BGĐ xem tổng quan: khối kế hoạch, xếp hạng 11 trại giống", async ({ page }) => {
  await login(page, "GD01");
  await expect(page.getByRole("heading", { name: "Tổng quan khu sản xuất" })).toBeVisible();
  await expect(page.getByText("Sản lượng PL thu hoạch · thực / kế hoạch tháng")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Tiến độ theo trại" })).toBeVisible();
  const rows = page.locator('a[href^="/san-xuat/trai/"]');
  await expect(rows).toHaveCount(11);
});

test("AC-20 chuyển VI → EN: nhãn đổi, số liệu giữ nguyên", async ({ page }) => {
  await login(page, "GD01");
  const kpi = page.locator("text=Lô đang ương").locator("..").locator(".num").first();
  const before = (await kpi.innerText()).replace(/\D/g, "");
  await page.getByRole("button", { name: "en", exact: true }).first().click();
  await expect(page.getByRole("heading", { name: "Hatchery overview" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  const after = (await page.locator("text=Active lots").locator("..").locator(".num").first().innerText()).replace(/\D/g, "");
  expect(after).toBe(before);
  await page.getByRole("button", { name: "vi", exact: true }).first().click();
  await expect(page.getByRole("heading", { name: "Tổng quan khu sản xuất" })).toBeVisible();
});

test("trưởng trại vào lưới bể trại mình", async ({ page }) => {
  await login(page, "TT01");
  await expect(page).toHaveURL(/san-xuat\/trai/);
  await expect(page.getByText("TG1-B01").first()).toBeVisible();
});

test("truy xuất mã không tồn tại báo rõ", async ({ page }) => {
  await login(page, "GD01");
  await page.goto("/truy-xuat/khong-co-ma-nay");
  await expect(page.getByText(/Không tìm thấy lô/)).toBeVisible();
});
