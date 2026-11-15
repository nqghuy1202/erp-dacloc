---
title: Trang khai báo cho ERP Đắc Lộc — danh sách, quyết định, thứ tự
status: draft (danh sách do user chốt 2026-11-13; giả định chờ Đắc Lộc xác nhận)
last_verified: 2026-11-13
ttl_days: 60
---

> Load khi: thiết kế hoặc build các trang khai báo (Cài đặt → Khai báo), chia story E5, hoặc cần biết vì sao trang nào có mặt. Nguồn: [biên bản họp 2026-11-10](02-hop-dac-loc-2026-11.md), [ba-spec 11](../app-map/11-ba-spec-mvp-san-xuat-kho.md) (NV0a–NV0e, AC-25..37), [ADR 0002](../decisions/0002-khai-bao-quyen-phien-ban.md). Tài liệu này không định nghĩa hành vi (ba-spec) hay giao diện (design-spec).

# 1. Bối cảnh

Biên bản họp kết luận "làm lại demo", luồng demo đi theo nhập kho → kế hoạch → lệnh sản xuất → nhật ký → xuất kho, và phần khai báo phải đủ cho 4 mảng sản xuất (tôm giống, cá + ốc giống, tôm thương phẩm, tôm hùm). Trước đợt này erp-dacloc chỉ có `/cai-dat/danh-muc` (thêm trại, import bể và vật tư, bật/tắt cấm vật tư; loài, giai đoạn, ngưỡng chỉ xem) và `/cai-dat/nguoi-dung`.

Khoảng trống so với yêu cầu (đối chiếu `src/lib/db/schema.ts`):

| Thiếu | Hiện trạng |
|---|---|
| Cơ sở / địa điểm | `farms.kind` chỉ `broodstock` hoặc `hatchery`; không có cấp cơ sở |
| Loại đơn vị nuôi, diện tích, hệ thống nuôi, khu sạch–bẩn | `tanks` chỉ có mã, thể tích, trạng thái |
| Kho khai báo riêng | `warehouses` tự sinh khi tạo trại |
| Nhà cung cấp | `receipts.supplier` là chữ gõ tay |
| Bệnh và chỉ tiêu xét nghiệm | `species.requiredDiseases` là mảng chữ |
| Tần suất đo theo chỉ tiêu | lịch cố định theo giai đoạn (`stages.waterTimes`) |
| Quy trình, định mức, thiết bị, ca/tổ, đơn vị quy đổi | chưa có |

# 2. Quyết định của user (2026-11-13)

| Chủ đề | Chốt |
|---|---|
| Nơi build | erp-dacloc (ngược với ghi chú "xây tiếp trên SDAqua" của biên bản và kế hoạch SDAqua — xem ADR 0002) |
| Mục tiêu trước mắt | demo lại cho Đắc Lộc, luồng chính như trên, nhưng khai báo vẫn đủ |
| Phạm vi mảng | khai báo đủ 4 mảng |
| Nhóm trang | chọn gần như toàn bộ 4 nhóm A–D; thêm "Quy trình sản xuất" |
| "Quy trình sản xuất" | chuỗi bước có điểm kiểm soát (đầu vào → đầu ra, bằng chứng yêu cầu), khác "Lịch mẫu" |
| "Lệnh" | lệnh sản xuất = một lô × một bước quy trình; nút "Tạo lệnh sản xuất tự động" ở trang Kế hoạch sinh chuỗi lệnh "đang lập"; duyệt theo nghiệp vụ; duyệt xong tạo yêu cầu cấp theo định mức và sinh việc cho công nhân bể; hoàn thành khi trưởng trại xác nhận số thực + điểm kiểm soát đạt (NV16, AC-38..48) |
| Quy trình duyệt | cấu hình theo nghiệp vụ ở trang "Khai báo nghiệp vụ": số cấp, người duyệt chính + người thay (nhân viên cụ thể) mỗi cấp, điều kiện bỏ qua/thêm cấp, quy tắc đánh số chứng từ (NV0f) |
| Nhân viên | nhân viên là hồ sơ gốc, tài khoản đăng nhập gắn vào nhân viên; thêm trang Phòng ban & chức vụ |
| Quyền sửa | theo phòng ban (R&D, Kỹ thuật, Sản xuất, Thủ kho, Phụ trách ATSH, Admin) |
| Phiên bản và duyệt | bản nháp + duyệt, lưu phiên bản, cho nhóm ATSH, ngưỡng, quy trình |
| Dữ liệu demo | dữ liệu mẫu theo chuẩn ngành, ghi rõ giả định |
| Loài mẫu | thêm ốc hương (giả định), tôm sú, tôm hùm bông, tôm hùm xanh; admin tự thêm được |
| Thuộc tính khu–ao–bể | loại + m²/m³/độ sâu · hệ thống nuôi · khu sạch–bẩn + nguồn nước · vị trí trên sơ đồ khu |
| Chặn ATSH | khai báo kèm chặn thật ở vài ca chính |
| Điều hướng | nhóm menu "Khai báo" có trang tổng quan + 4 nhóm con |
| Import | bể/ao/khu · vật tư + nhà cung cấp + tồn đầu kỳ · thiết bị; còn lại nhập bằng form |
| Mã Vietsun | chưa làm |
| Ngoài phạm vi | khách hàng/đại lý, cửa hàng thức ăn, trạm thu mua, vận tải, nhân sự/lương |

# 3. Danh sách 21 trang

> Bản đầu có 18 trang; ngày 2026-11-13 user thêm Phòng ban & chức vụ, Nhân viên, Khai báo nghiệp vụ (18a–18c) khi làm rõ lệnh sản xuất.

| # | Nhóm | Trang | Soạn/sửa | Cần duyệt | Đợt |
|---|---|---|---|---|---|
| 0 | — | Tổng quan Khai báo (checklist mục còn thiếu) | mọi vai trò khai báo | — | 1 |
| 1 | A | Cơ sở / địa điểm | Admin | không | 1 |
| 2 | A | Khu – ao – bể | Kỹ thuật | không | 1 |
| 3 | A | Kho | Thủ kho | không | 1 |
| 4 | A | Ca / tổ sản xuất | Sản xuất | không | 3 |
| 5 | B | Loài & giai đoạn | R&D | không | 1 |
| 6 | B | Chỉ tiêu theo dõi & tần suất đo | R&D | không | 1 |
| 7 | B | Ngưỡng cảnh báo | R&D | có | 1 |
| 8 | B | Lịch mẫu theo giai đoạn | R&D | không | 3 |
| 9 | B | Quy trình sản xuất | R&D, điểm kiểm soát: ATSH | có | 1 |
| 10 | C | Vật tư | Thủ kho, cờ cấm: ATSH | bỏ cấm: có | 1 |
| 11 | C | Nhà cung cấp | Thủ kho | không | 1 |
| 12 | C | Định mức vật tư theo giai đoạn | Sản xuất | không | 1 |
| 13 | C | Đơn vị tính & quy đổi | Thủ kho | không | 1 |
| 14 | D | Bệnh & chỉ tiêu xét nghiệm | ATSH | có | 2 |
| 15 | D | Khu sạch–bẩn & điểm kiểm soát ra vào | ATSH | có | 2 |
| 16 | D | Hoá chất khử trùng & quy trình vệ sinh bể | ATSH | có | 2 |
| 17 | D | Thiết bị | Kỹ thuật | không | 3 |
| 18a | A | Phòng ban & chức vụ | Admin | không | 1 |
| 18b | A | Nhân viên | Admin | không | 1 |
| 18c | A | Khai báo nghiệp vụ (cấp duyệt, người duyệt + người thay, điều kiện, đánh số) | Admin | không (ghi nhật ký) | 1 |

Trang Người dùng & quyền (đã có) vẫn giữ: tài khoản gắn vào nhân viên, thêm ba vai trò R&D, Kỹ thuật, Phụ trách ATSH.

## Vì sao đợt 1 đủ cho luồng demo

| Chặng demo | Cần khai báo |
|---|---|
| Nhập kho | Cơ sở, Kho, Vật tư, Nhà cung cấp, Đơn vị tính |
| Kế hoạch | Khu–ao–bể, Loài & giai đoạn |
| Lệnh sản xuất | Quy trình sản xuất, Định mức, Nhân viên, Khai báo nghiệp vụ (duyệt + đánh số) |
| Nhật ký | Chỉ tiêu & tần suất, Ngưỡng |
| Xuất kho | Kho, Định mức |

Đợt 2 là an toàn sinh học và ba ca chặn thật; đợt 3 là phần hỗ trợ (ca/tổ, lịch mẫu, thiết bị).

# 4. Ba ca chặn thật cho ATSH (ở demo)

| Ca | Rule trong ba-spec | AC |
|---|---|---|
| Bể chờ vệ sinh không nhận lô mới | R16 | AC-31 |
| Không chuyển lô từ khu mức an toàn thấp sang cao | R17 | AC-32 |
| Bước quy trình có điểm kiểm soát bị chặn khi thiếu bằng chứng | R18 | AC-33 |

Ba ca này do dự án chọn, chưa qua SOP của Đắc Lộc. Các chặn có sẵn (đàn bố mẹ chưa PCR, thu hoạch chưa PCR âm, vật tư cấm) giữ nguyên.

# 5. Giả định chờ xác nhận

1. Gán trang cho từng phòng ban (bảng §3) là đề xuất mặc định; chưa xác nhận từng dòng.
2. Người duyệt là Ban giám đốc.
3. Thay đổi chặt hơn áp dụng ngay cho mọi lô, nới lỏng chỉ áp cho lô mở sau; đặt cờ cấm có hiệu lực ngay.
4. Ốc hương là loài ốc giống (chưa được Đắc Lộc nói); chuỗi giai đoạn và ngưỡng của loài mới là dữ liệu giả định.
5. Tách "Tôm hùm" thành bông và xanh động tới dữ liệu mẫu: giữ loài cũ nếu còn lô tham chiếu.
6. "Chỉ tiêu theo dõi" mặc định hằng ngày; độ mặn và thay nước hằng tuần cho ao thương phẩm. Tần suất của bể ấu trùng chưa biết (câu hỏi Q3 của research 02), AC-23 giữ nguyên.

# 6. Việc còn mở

| Việc | Ai | Ghi chú |
|---|---|---|
| Đưa 21 màn khai báo + màn Lệnh sản xuất vào design-spec 12 | design | Chưa làm |
| Hỏi Đắc Lộc Q1 (SOP ATSH) để viết NV17–NV19 | BA | Đánh số lại so với research 02: NV16 dành cho lệnh sản xuất |
| Cập nhật kế hoạch SDAqua (`docs/app-map/14`, dòng Q5) | user | Ở repo SDAqua, tôi không sửa |
| Chia story E5-01..08, E6-01 và migration | planner | [stories](../stories/README.md) |

**Last Updated**: 2026-11-13
