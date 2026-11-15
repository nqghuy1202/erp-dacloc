import { expect, test, type Page } from "@playwright/test";
import { login } from "./helpers";

// Giai đoạn 1 chuyển UI sang Astryx (design-spec 12 v5): khung AppShell, bảng Lô ương tìm/sắp xếp, M1 nút việc kế tiếp.
// Ảnh nghiệm thu lưu ở docs/app-map/_screens/astryx/ (design-spec 12 §Nghiệm thu).
const SHOT = "docs/app-map/_screens/astryx";
const shot = (page: Page, name: string, fullPage = true) => page.screenshot({ path: `${SHOT}/${name}.png`, fullPage });

async function setTheme(page: Page, mode: "light" | "dark") {
  await page.context().addCookies([{ name: "theme", value: mode, domain: new URL(page.url()).hostname, path: "/" }]);
  await page.goto(page.url(), { waitUntil: "domcontentloaded" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", mode);
}

test("S1 tổng quan: khung Astryx + nút chính 'Xem trại chậm nhất'", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await login(page, "GD01");
  await expect(page.getByRole("navigation", { name: "Điều hướng chính" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Xem trại chậm nhất/ })).toBeVisible();
  await setTheme(page, "light");
  await shot(page, "S1-1280-sang");
  await setTheme(page, "dark");
  await shot(page, "S1-1280-toi");
  await setTheme(page, "light");
  await page.setViewportSize({ width: 375, height: 812 });
  await page.reload();
  await shot(page, "S1-375-sang");
});

test("S6 lô ương: tìm không dấu lọc dòng, cột sắp xếp được", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await login(page, "GD01");
  await setTheme(page, "light");
  await page.goto("/san-xuat/lo?farm=all&status=all");
  const rows = page.locator("tbody tr");
  const before = await rows.count();
  test.skip(before === 0, "DB mẫu chưa có lô");
  await shot(page, "S6-1280-sang");
  const firstCode = (await rows.first().locator("td").first().innerText()).trim();
  await page.getByRole("searchbox", { name: "Tìm mã lô, bể, trại" }).fill(firstCode.toLowerCase());
  await expect(rows.first()).toContainText(firstCode);
  expect(await rows.count()).toBeLessThanOrEqual(before);
  await page.getByRole("searchbox", { name: "Tìm mã lô, bể, trại" }).fill("zzz-khong-co");
  await expect(page.getByRole("heading", { name: "Không có lô khớp từ khoá" })).toBeVisible();
  await page.getByRole("searchbox", { name: "Tìm mã lô, bể, trại" }).fill("");
  const est = page.getByRole("columnheader", { name: /Ước lượng/ });
  await est.getByRole("button").click();
  await expect(est).toHaveAttribute("aria-sort", /ascending|descending/);
  await setTheme(page, "dark");
  await shot(page, "S6-1280-toi");
});

test("khung: thu gọn thanh bên thành rail và nhớ lựa chọn sau khi tải lại", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await login(page, "GD01");
  await page.getByRole("button", { name: "Thu gọn thanh bên" }).click();
  await expect(page.getByRole("button", { name: "Mở rộng thanh bên" })).toBeVisible();
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByRole("button", { name: "Mở rộng thanh bên" })).toBeVisible();
  await shot(page, "khung-1280-rail");
  await page.getByRole("button", { name: "Mở rộng thanh bên" }).click();
  await expect(page.getByRole("button", { name: "Thu gọn thanh bên" })).toBeVisible();
});

test.describe("M1", () => {
// service worker PWA giữ điều hướng /hien-truong khi tải lại trong test → chặn để đo giao diện
test.use({ serviceWorkers: "block" });
test("M1 hôm nay (mobile): nút 'Ghi việc kế tiếp' ở vùng ngón cái", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await login(page, "CN001");
  await page.goto("/hien-truong", { waitUntil: "domcontentloaded" });
  await setTheme(page, "light");
  const next = page.getByRole("link", { name: /Ghi việc kế tiếp/ });
  if (await next.count()) {
    const box = await next.boundingBox();
    expect(box && box.y > 812 / 2).toBeTruthy();
    expect(box && box.height >= 48).toBeTruthy();
  }
  await shot(page, "M1-375-sang");
  await setTheme(page, "dark");
  await shot(page, "M1-375-toi");
});
});

// Giai đoạn 2 (design-spec 12 v5): form trên Astryx — chỉ mở/đóng, KHÔNG gửi (DB mẫu chỉ đọc).
test("S16 thêm người dùng: Sheet là Drawer Astryx, ô chọn vai trò mở được, đóng không gửi", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await login(page, "AD01");
  await page.goto("/cai-dat/nguoi-dung", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Thêm người dùng" }).first().click();
  const drawer = page.getByRole("dialog", { name: "Thêm người dùng" });
  await expect(drawer).toBeVisible();
  await expect(drawer.getByRole("textbox", { name: "Mã nhân viên" })).toBeVisible();
  await drawer.getByRole("combobox", { name: "Vai trò" }).click();
  await expect(page.getByRole("option").first()).toBeVisible();
  await shot(page, "S16-1280-sheet-sang", false);
  await page.keyboard.press("Escape");
  await drawer.getByRole("button", { name: /Đóng|Close/ }).first().click();
  await expect(drawer).toBeHidden();
});

test("S7 huỷ lô: hỏi xác nhận nêu số con, Quay lại thì không gửi", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await login(page, "TT01");
  await page.goto("/san-xuat/su-co", { waitUntil: "domcontentloaded" });
  const open = page.getByRole("button", { name: "Xử lý sự cố" }).first();
  test.skip((await open.count()) === 0, "Không có sự cố mở");
  await open.click();
  const drawer = page.getByRole("dialog", { name: "Xử lý sự cố" });
  await drawer.getByText("Huỷ lô", { exact: true }).first().click();
  await drawer.getByRole("textbox", { name: "Lý do huỷ" }).fill("kiểm thử giao diện — không gửi");
  await drawer.getByRole("button", { name: "Huỷ lô" }).click();
  const dlg = page.getByRole("alertdialog");
  await expect(dlg).toContainText(/con của lô/);
  await shot(page, "S7-1280-xac-nhan", false);
  await dlg.getByRole("button", { name: "Quay lại" }).click();
  await expect(dlg).toBeHidden();
  await expect(drawer).toBeVisible();
});

test("S4 danh sách: ô tìm lọc dòng bảng tĩnh", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await login(page, "GD01");
  await page.goto("/san-xuat/bo-me", { waitUntil: "domcontentloaded" });
  const box = page.getByRole("searchbox", { name: "Tìm mã đàn, trại, nguồn" });
  test.skip((await box.count()) === 0, "DB mẫu chưa có đàn");
  await box.fill("zzz-khong-co");
  await expect(page.getByText(/Không có dòng khớp/)).toBeVisible();
});

test("S9 chốt phiếu: hỏi xác nhận nêu hậu quả, Quay lại thì không gửi", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await login(page, "XN01");
  await page.goto("/xet-nghiem", { waitUntil: "domcontentloaded" });
  const first = page.locator('a[href^="/xet-nghiem/"]').first();
  test.skip((await first.count()) === 0, "Không có mẫu chờ");
  await page.goto((await first.getAttribute("href"))!, { waitUntil: "domcontentloaded" });
  await page.locator("h1").first().waitFor();
  const confirm = page.getByRole("main").getByRole("button", { name: "Chốt phiếu" });
  test.skip((await confirm.count()) === 0, "Phiếu đã chốt");
  await confirm.click();
  const dlg = page.getByRole("alertdialog");
  await expect(dlg).toContainText("không sửa được");
  await shot(page, "S9-1280-xac-nhan", false);
  await dlg.getByRole("button", { name: "Quay lại" }).click();
  await expect(dlg).toBeHidden();
  await expect(page).toHaveURL(/xet-nghiem\/\d+/);
});
