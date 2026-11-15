# src/app — routes

> Load khi: thêm/sửa màn, server action, API route. Đối chiếu design-spec 12 (Screen map) và 01-pages-and-navigation.

Quy ước: page là Server Component (`export const dynamic = "force-dynamic"`), gọi `requireActor(roles)`; ghi qua server action trong `actions.ts` cùng thư mục, luôn `return run(...)` + `revalidatePath`. Form dùng `ActionForm`/`Sheet` (src/components/ui/client.tsx); vùng `hien-truong/` chỉ import `@/components/field/*` + `ui/form` (không kéo JS Astryx — ADR 0003).

| Thư mục | Màn |
|---|---|
| layout.tsx · layers.css · globals.css | Gốc: `layers.css` import ĐẦU TIÊN (thứ tự cascade layer), `globals.css` = Tailwind 4 + CSS Astryx + ánh xạ token app → Astryx; `Providers` + `data-theme` từ cookie |
| dang-nhap/ | Đăng nhập mã NV (nút nhẹ, không JS Astryx) |
| actions.ts | login, logout, setLocale |
| (office)/layout.tsx | Shell văn phòng (Astryx AppShell): SideNav theo vai trò + TopNav (chuông, sáng/tối, tài khoản có VI/EN và đăng xuất) |
| (office)/page.tsx | S1 Tổng quan |
| (office)/san-xuat/{trai,lo,bo-me,me-de,su-co,ke-hoach} | S2, S6/S3, S4, S5, S7, S17 |
| (office)/xet-nghiem | S8, S9 |
| (office)/kho/{,nhap,yeu-cau,kiem-ke} | S10–S13 |
| (office)/truy-xuat | S14 (+ /tem in tem) |
| (office)/thong-bao | Thông báo & cảnh báo |
| (office)/cai-dat/{danh-muc,nguoi-dung} | S15, S16 |
| hien-truong/ | M1 Hôm nay, be/ M3, be/[tankId] M2, canh-bao M4, quet M5, toi |
| api/ | logs/sync, cron/daily, resolve, qr/[token] — xem app-map 04 |
