# src/server — nghiệp vụ

> Load khi: sửa/thêm quy tắc nghiệp vụ, phân quyền, kho, kế hoạch, cảnh báo.

Hàm thuần nhận `db: DB` (postgres-js ở prod, PGlite ở test) + `actor: Actor`. Không import `next/*`. Ném `AppError(code)`; route bọc bằng `run()` (src/lib/action.ts) để ra thông báo tiếng Việt.

| File | Việc | NV / AC |
|---|---|---|
| access.ts | loadActor, assertRole, assertFarm, assertCanLogTank (R1) | AC-8 |
| auth.ts | bcrypt, phiên JWT HS256 cookie | — |
| alerts.ts | raiseAlert (dedupe + thông báo theo role×trại), ackAlert, runEscalation 2h | AC-9, AC-10 |
| production.ts | bố mẹ, xét nghiệm, mẻ đẻ, mở lô, giai đoạn, thu hoạch QR, sự cố, truy xuất | NV1–NV7, NV13 · AC-2..5, 11..14 |
| logs.ts | syncLogs idempotent theo UUID, ngưỡng nước, hao hụt, trừ kho | NV4 · AC-6..9 |
| inventory.ts | phiếu nhập, yêu cầu/cấp phát FEFO, tiêu hao (ref_key), kiểm kê 2% | NV8–NV11 · AC-7, 15..18 |
| planning.ts | kế hoạch + duyệt, tổng quan/xếp hạng, sinh việc hằng ngày, việc đột xuất | NV12, NV14, NV15 · AC-19, 21..24 |
| catalog.ts | import CSV bể/vật tư, trại, người dùng & quyền | NV0 · AC-1 |
| catalog-seed.ts | loài, giai đoạn, ngưỡng, vật tư chuẩn ngành (test + seed) | — |
| queries.ts | truy vấn đọc cho tổng quan (cảnh báo, sản lượng tuần, tồn thấp) | NV12 |
| queries-*.ts | truy vấn đọc theo vùng màn hình | — |
| errors.ts · types.ts · util.ts | mã lỗi, Actor/Role, mã chứng từ & ngày | — |

Quy tắc: thao tác ghi nhiều bảng → `db.transaction`; kho chỉ thay đổi qua `stock_tx` (R8).
