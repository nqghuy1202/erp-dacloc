import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("đăng nhập sai báo lỗi, không vào được", async ({ page }) => {
  await page.goto("/dang-nhap");
  await page.locator("#empCode").fill("GD01");
  await page.locator("#password").fill("sai-mat-khau");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "không đúng" })).toBeVisible();
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
  // bỏ nút chính "Xem trại chậm nhất" (cũng trỏ /san-xuat/trai/…) — chỉ đếm dòng xếp hạng
  const rows = page.locator('a[href^="/san-xuat/trai/"]').filter({ hasNotText: "Xem trại chậm nhất" });
  await expect(rows).toHaveCount(11);
});

test("AC-20 chuyển VI → EN: nhãn đổi, số liệu giữ nguyên", async ({ page }) => {
  await login(page, "GD01");
  const kpi = page.locator("text=Lô đang ương").locator("..").locator(".num").first();
  const before = (await kpi.innerText()).replace(/\D/g, "");
  await page.getByRole("banner").getByRole("button", { name: "Tài khoản" }).click();
  await page.getByRole("button", { name: "en", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Hatchery overview" })).toBeVisible({ timeout: 15000 });
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  const after = (await page.locator("text=Active lots").locator("..").locator(".num").first().innerText()).replace(/\D/g, "");
  expect(after).toBe(before);
  await page.getByRole("banner").getByRole("button", { name: "Account" }).click();
  await page.getByRole("button", { name: "vi", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Tổng quan khu sản xuất" })).toBeVisible({ timeout: 15000 });
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

test.describe("thanh header văn phòng", () => {
  test("có chuông, đổi sáng/tối, menu tài khoản; Esc đóng menu", async ({ page }) => {
    await login(page, "GD01");
    const header = page.getByRole("banner");
    await expect(header.getByRole("link", { name: /thông báo/i })).toBeVisible();
    const html = page.locator("html");
    await header.getByRole("button", { name: "Chuyển sang giao diện tối" }).click();
    await expect(html).toHaveAttribute("data-theme", "dark");
    await header.getByRole("button", { name: "Chuyển sang giao diện sáng" }).click();
    await expect(html).toHaveAttribute("data-theme", "light");
    const account = header.getByRole("button", { name: "Tài khoản" });
    await account.click();
    await expect(account).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByRole("button", { name: "Đăng xuất" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(account).toHaveAttribute("aria-expanded", "false");
  });

  // Ẩn/hiện thanh bên trên desktop: xem e2e/ui-astryx.spec.ts (thu gọn thành rail, nhớ lựa chọn).

  test("mobile: nút menu mở ngăn điều hướng, Esc đóng", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await login(page, "GD01");
    await page.getByRole("button", { name: "Mở điều hướng" }).click();
    const drawer = page.getByRole("dialog");
    await expect(drawer).toBeVisible();
    await expect(drawer.getByRole("link", { name: "Tổng quan" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();
  });

  test("đăng xuất từ menu tài khoản về trang đăng nhập", async ({ page }) => {
    await login(page, "GD01");
    await page.getByRole("banner").getByRole("button", { name: "Tài khoản" }).click();
    await page.getByRole("button", { name: "Đăng xuất" }).click();
    await expect(page).toHaveURL(/dang-nhap/);
  });
});
