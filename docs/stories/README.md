# Stories — MVP Sản xuất + Kho

> Load khi: chọn việc tiếp theo, đánh dấu story xong. Nguồn: [ba-spec 11](../app-map/11-ba-spec-mvp-san-xuat-kho.md), [design-spec 12](../app-map/12-design-spec-mvp-san-xuat-kho.md), [ADR 0001](../decisions/0001-stack-va-kien-truc.md).

| ID | Epic / Story | NV · AC | Trạng thái |
|---|---|---|---|
| E0-01 | Nền: Next.js, Tailwind token, i18n, shell văn phòng + hiện trường | — · AC-20 | todo |
| E0-02 | Schema DB + migration + RLS + seed mẫu | NV0 | todo |
| E0-03 | Đăng nhập mã NV, phiên, phân quyền role × trại | NV0 · AC-8 | todo |
| E1-01 | Danh mục & import Excel/CSV (S15), người dùng & quyền (S16) | NV0 · AC-1 | todo |
| E1-02 | Đàn bố mẹ + xét nghiệm đầu vào (S4) | NV1 · AC-2, AC-3 | todo |
| E1-03 | Mẻ đẻ + mở lô ương (S5, S6) | NV2, NV3 · AC-4, AC-5 | todo |
| E1-04 | Nhật ký bể + ngưỡng + cảnh báo (M1–M3, API sync) | NV4 · AC-6, AC-8, AC-9 | todo |
| E1-05 | Xét nghiệm lô (S8, S9) + sự cố (S7) + leo thang | NV5, NV7 · AC-10, AC-11 | todo |
| E1-06 | Thu hoạch → lô thành phẩm QR, truy xuất (S3, S14, M5) | NV6, NV13 · AC-12..14 | todo |
| E2-01 | Phiếu nhập kho (S11), tồn kho (S10) | NV8 · AC-15 | todo |
| E2-02 | Yêu cầu & cấp phát FEFO (S12) | NV9 · AC-16 | todo |
| E2-03 | Trừ kho tiêu hao idempotent + âm kho | NV10 · AC-7, AC-17 | todo |
| E2-04 | Kiểm kê (S13) | NV11 · AC-18 | todo |
| E3-01 | Kế hoạch sản xuất (S17) | NV14 · AC-21 | todo |
| E3-02 | Việc hằng ngày tự sinh + đột xuất | NV15 · AC-23, AC-24 | todo |
| E3-03 | Tổng quan BGĐ (S1), Trại (S2) | NV12 · AC-19, AC-22 | todo |
| E3-04 | PWA offline outbox, cài đặt app | NV4 · AC-6 | todo |
| E4-01 | E2E, lint, doc sync, deploy Vercel | — | todo |
| E5-01 | Nền Khai báo: vai trò R&D/Kỹ thuật/ATSH, quyền theo nhóm, menu "Khai báo", trang Tổng quan (checklist) | NV0 · AC-28, AC-37 | todo |
| E5-02 | Cơ sở, Khu–ao–bể (loại, đo đạc, hệ thống nuôi, khu), Kho, Đơn vị tính + import bể/ao/khu | NV0a · AC-1, AC-25, AC-26, AC-27 | todo |
| E5-03 | Vật tư đầy đủ, Nhà cung cấp, Định mức + import vật tư/NCC/tồn đầu kỳ | NV0c · AC-26, AC-27 | todo |
| E5-04 | Loài & giai đoạn (sửa được, loài mẫu mới), Chỉ tiêu & tần suất đo, Ngưỡng | NV0b · AC-35, AC-36 | todo |
| E5-05 | Phiên bản + duyệt khai báo (khung) và Quy trình sản xuất có điểm kiểm soát | NV0e, NV0b · AC-29, AC-33, AC-34 | todo |
| E5-06 | ATSH: Bệnh & xét nghiệm, Khu sạch–bẩn, Khử trùng & vệ sinh bể + 3 ca chặn thật | NV0d · AC-30, AC-31, AC-32 | todo |
| E5-07 | Ca/tổ, Lịch mẫu, Thiết bị + import thiết bị | NV0a, NV0b, NV0d · AC-26 | todo |
| E5-08 | Phòng ban & chức vụ, Nhân viên (tài khoản gắn nhân viên), Khai báo nghiệp vụ: cấp duyệt, người thay, điều kiện, đánh số | NV0f · AC-41, AC-49..52 | todo |
| E6-01 | Lệnh sản xuất: tạo tự động từ kế hoạch, duyệt theo nghiệp vụ, yêu cầu cấp theo định mức, sinh việc, hoàn thành/huỷ/sửa | NV16 · AC-38..40, AC-42..48 | todo |

Thứ tự: E0 → E1-01..04 (tracer bullet: đăng nhập → mở lô → ghi nhật ký) → còn lại.

E5 (Khai báo, [research 03](../research/03-trang-khai-bao.md), [ADR 0002](../decisions/0002-khai-bao-quyen-phien-ban.md)): E5-01 → E5-08 → E5-02/03/04 → E5-05 → E6-01 → E5-06 → E5-07. Đợt 1 cho luồng demo = E5-01..05, E5-08, E6-01; đợt 2 = E5-06; đợt 3 = E5-07. E5-05 dùng cơ chế duyệt của E5-08.
