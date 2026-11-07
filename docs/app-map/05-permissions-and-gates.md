# 05 — Phân quyền

> Load khi: đổi vai trò, phạm vi trại, cổng truy cập màn.
covers: src/server/access.ts, src/lib/session.ts, src/components/shell/nav.ts
last_verified: 2026-11-07
ttl_days: 90

Đăng nhập mã NV + mật khẩu (bcrypt), phiên JWT 12h cookie httpOnly. Sai 5 lần → khoá 5 phút (theo mã NV, bộ nhớ tiến trình — `// nợ: khoá chỉ trong 1 tiến trình, chuyển sang bảng DB khi chạy nhiều instance`).

| Vai trò | Trang chính | Phạm vi trại | Ghi |
|---|---|---|---|
| worker | /hien-truong | trại được gán; chỉ bể được giao (assertCanLogTank) | nhật ký |
| farm_lead | /san-xuat/trai | trại được gán | bố mẹ, mẻ, lô, thu hoạch, sự cố, yêu cầu vật tư, kế hoạch, duyệt kiểm kê |
| lab | /xet-nghiem | trại được gán | chốt/huỷ phiếu |
| storekeeper | /kho | trại được gán + kho tổng | nhập, cấp phát, kiểm kê |
| director | / | mọi trại | duyệt kế hoạch, duyệt kiểm kê, nhận leo thang |
| admin | / | mọi trại | danh mục, người dùng; qua mọi assertRole |

Cổng: `requireActor(roles)` ở page (sai vai trò → về trang chính); `assertRole/assertFarm` trong service (chặn thật, kể cả gọi action trực tiếp). Test: AC-8 (integration + e2e).
