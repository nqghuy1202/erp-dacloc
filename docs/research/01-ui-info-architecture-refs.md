---
title: Tham chiếu tổ chức thông tin — vòng 2
status: draft (chờ trả lời câu hỏi)
last_verified: 2026-11-07
ttl_days: 30
---

# 1. Mẫu đã xem và bài học (đọc theo luật ui-design-logic)

| Mẫu | Điều làm tốt | Áp vào Đắc Lộc |
|---|---|---|
| [Batch Detail Page with Production Timeline](https://dribbble.com/shots/27859346-Batch-Detail-Page-with-Production-Timeline) | Trang trả lời đúng 1 câu: "lô này đang ở đâu, đang chờ gì". Timeline dọc: đã xong / đang làm / còn lại; cột phải là checklist QC Pass/Pending | **S3 Chi tiết lô**: timeline giai đoạn N→Z→M→PL→thu hoạch; khối "Điều kiện thu hoạch" dạng checklist (PCR, giai đoạn, kích cỡ) |
| [Horizon — Warehouse Operations](https://dribbble.com/shots/26956265-Horizon-Warehouse-Operations-Dashboard) | Dải 4 số ngắn → lưới thẻ đối tượng, mỗi thẻ: trạng thái chữ + thanh tiến độ + 1 số chính | **S2 Trại**: thẻ bể có thanh tiến độ "ngày 21/25 tới thu", nhãn trạng thái chữ |
| [Laborax — Tests Orders](https://dribbble.com/shots/27270041-Laborax-Tests-Orders-Page) | Hàng đợi sắp theo hạn: cột Ưu tiên + "còn 2 giờ / quá 10 phút"; trạng thái có icon + màu | **S8 Lab, S12 Yêu cầu cấp**: cột "Hạn" đếm ngược, quá hạn đứng đầu |
| [HydraFlow — Water Utility Monitoring](https://dribbble.com/shots/27580808-HydraFlow-Water-Utility-Monitoring-Dashboard-SaaS-UI-UX-Design) | Chỉ số cảm biến theo điểm đo + xu hướng | **Tab Chỉ số nước**: mini-chart từng chỉ tiêu cạnh nhau, dải ngưỡng |
| [Construction Progress Tracker (mobile)](https://dribbble.com/shots/27605685-Construction-Progress-Tracker-Site-Management-Mobile-App-UI) | Mobile hiện trường: 1 con số tiến độ lớn đầu màn, nav đáy | **M1 Hôm nay**: "Còn 4/12 việc" đầu màn |
| [Gummi — Shrimp Farm](https://dribbble.com/shots/27596909-Gummi-Shrimp-Farm-Monitoring-Dashboard) (vòng 1) | Ảnh ao thật + chỉ số nước lớn | Ảnh trại chỉ ở S1 (tuỳ chọn) |
| [AI Factory Monitoring](https://dribbble.com/shots/27393933-AI-Factory-Monitoring-Dashboard-Smart-Manufacturing-SaaS-UI) | — | **Anti-reference**: tối, neon, mô hình 3D — đẹp ảnh chụp, khó đọc khi vận hành |

Mẫu khác đáng xem: [ERP Inventory Variance Review](https://dribbble.com/shots/27810782-ERP-Frontend-Modernization-for-Inventory-Variance-Review) (S13 kiểm kê) · [Diagnostic Lab Management](https://dribbble.com/shots/27262139-Diagnostic-Lab-Management-Dashboard) · [Linde — Field traceability app](https://dribbble.com/shots/27843637-Linde-Field-traceability-app-for-fruit-exporters) (S14) · [WMS Dashboard](https://dribbble.com/shots/27333090-WMS-Dashboard-Warehouse-Management-System-Web-App) · [Yuke Logistics Overview](https://dribbble.com/shots/27718165-Yuke-inc-Logistics-Overview-Dashboard).

# 2. Nguyên tắc rút ra (đề xuất, chờ duyệt)

1. **Mỗi màn trả lời 1 câu hỏi** viết ra được, đặt ngay dưới tiêu đề trong spec (không hiện trên UI).
2. **Ngoại lệ trước, bình thường sau**: đầu màn là dải "Cần xử lý" (số việc lệch); cái ổn định thu nhỏ.
3. **Trạng thái = chữ + icon + màu**, một bộ từ vựng chung toàn hệ thống.
4. **Thời gian là thông tin**: mọi hàng đợi có "còn / quá X giờ".
5. **Tiến trình của lô hiển thị dạng timeline** (giai đoạn), không chỉ một badge.
6. **Tóm tắt → chi tiết**: KPI → đối tượng (trại/bể) → lô → nhật ký; mỗi bậc 1 chạm.

# 3. Quyết định đã chốt (2026-11-07, 3 vòng)

| Chủ đề | Quyết định |
|---|---|
| S1 câu hỏi 5 giây | "Sản xuất có đạt kế hoạch?" → mở đầu bằng sản lượng thực / kế hoạch, rồi tiến độ theo trại |
| Tiến độ theo trại | Thanh ngang xếp hạng thấp → cao, vạch "kế hoạch tới hôm nay" |
| Cảnh báo trên S1 | Tất cả cảnh báo mở, sắp theo mức độ |
| Ô bể (S2) | Giai đoạn + thanh tiến độ ngày tuổi / ngày dự kiến thu |
| Mật độ | Vừa phải: 6–8 khối/màn, chi tiết mở khi bấm |
| S3 mở đầu | Timeline giai đoạn N→Z→M→PL→Thu hoạch + điều kiện đang chờ |
| Việc hằng ngày (M1) | Kết hợp: lịch tự sinh theo giai đoạn + trưởng trại thêm việc đột xuất |
| Kế hoạch | Theo lịch thả lô; trưởng trại lập, BGĐ duyệt; **đưa vào MVP** (nghiệp vụ mới → ba-spec) |
| Cảnh báo khẩn | Số trên chuông + thông báo đẩy, không chiếm chỗ màn hình |
| Đầu ra | Sửa ba-spec + design-spec + bản thử v2 |
