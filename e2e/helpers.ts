import { expect, type Page } from "@playwright/test";

export const PASSWORD = process.env.SEED_PASSWORD ?? "";

export async function login(page: Page, empCode: string) {
  if (!PASSWORD) throw new Error("Cần SEED_PASSWORD (mật khẩu tài khoản mẫu)");
  await page.goto("/dang-nhap");
  await page.locator("#empCode").fill(empCode);
  await page.locator("#password").fill(PASSWORD);
  await page.getByRole("button", { name: /Đăng nhập|Sign in/ }).click();
  await expect(page).not.toHaveURL(/dang-nhap/);
}
