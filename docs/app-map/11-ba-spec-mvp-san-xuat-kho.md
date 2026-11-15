# 11 — ba-spec: MVP Sản xuất giống + Kho (Đắc Lộc)

> Load khi: task chạm hành vi / nghiệp vụ / flow / acceptance của sản xuất giống (bố mẹ → PL), nhật ký bể, xét nghiệm, lô thành phẩm, truy xuất QR, kho vật tư.
covers: src/server, src/app/(office), src/app/hien-truong, src/app/api
last_verified: 2026-11-15
ttl_days: 90

> **Mục đích**: oracle HÀNH VI cho MVP — USER nào làm nghiệp vụ gì, flow vào/ra sao, đúng-sai đo bằng AC nào. KHÔNG mô tả giao diện (việc của design-spec). Nguồn bối cảnh: [docs/research/00-discovery-dac-loc.md](../research/00-discovery-dac-loc.md).

---

## 1. Vấn đề & JTBD
- **Job**: Khi vận hành 3 trại bố mẹ + 11 trại giống (~3,5 tỷ PL/năm), trưởng trại và BGĐ muốn biết **từng bể đang có lô nào, sống bao nhiêu, nước ra sao, đã tốn bao nhiêu vật tư**, để xuất ra lô giống sạch bệnh, truy được nguồn gốc và tính được giá thành.
- **Vì sao làm bây giờ**: đang quản lý bằng Excel/sổ tay → số liệu trễ, không truy được lô PL về đàn bố mẹ, tồn kho vật tư lệch, hồ sơ GlobalGAP/kiểm dịch làm thủ công.
- **Đo thành công bằng**: 100% lô PL xuất trại có chuỗi truy xuất đầy đủ (đàn bố mẹ → mẻ đẻ → bể ương → PCR) và chênh lệch kiểm kê vật tư ≤ 2% giá trị.

## 2. User registry
| User (role) | Là ai | Vòng đời | Thiết bị/bối cảnh |
|---|---|---|---|
| U1 Công nhân bể | ghi cho ăn, đo nước, hao hụt cho bể được giao | quen, thao tác lặp | điện thoại, tại bể, tay ướt, mạng chập chờn (offline) |
| U2 Trưởng trại | giao bể, mở/đóng lô, duyệt yêu cầu vật tư, quyết định xử lý | quen | điện thoại + máy tính tại trại |
| U3 Kỹ thuật viên lab | lấy mẫu, nhập kết quả PCR/vi sinh/chất lượng PL | quen | máy tính phòng lab |
| U4 Thủ kho | nhập kho từ NCC, cấp phát cho trại, kiểm kê | quen | máy tính + điện thoại tại kho |
| U5 Ban giám đốc | xem tình hình toàn khu, sản lượng, tồn, cảnh báo | quen, đọc là chính | máy tính, điện thoại |
| U6 Quản trị hệ thống | quản lý trại/bể/loài/giai đoạn, danh mục vật tư, người dùng & quyền | power | máy tính |
| U7 Trưởng phòng R&D | khai báo loài, giai đoạn, chỉ tiêu và tần suất đo, ngưỡng, lịch mẫu, quy trình sản xuất | quen | máy tính |
| U8 Trưởng phòng Kỹ thuật | khai báo khu–ao–bể, thiết bị | quen | máy tính + điện thoại tại khu |
| U9 Phụ trách an toàn sinh học | khai báo bệnh và xét nghiệm, khu sạch–bẩn, khử trùng; chủ các điểm kiểm soát trong quy trình | quen | máy tính |
| S1 Hệ thống (system-actor) | trừ kho theo nhật ký, sinh cảnh báo ngưỡng, đồng bộ dữ liệu offline | — | nền |

> Đại lý/hộ nuôi, sale, kế toán, nhân sự: ngoài MVP (§7).

## 3. User × Nghiệp vụ
| # | Nghiệp vụ | Owner-user | Cross | Phụ thuộc NV | Tần suất | Ưu tiên |
|---|---|---|---|---|---|---|
| NV0a | Khai báo tổ chức & vị trí (cơ sở, khu–ao–bể, kho, ca/tổ, người dùng & quyền) | U6 | U8 (khu–ao–bể), U4 (kho), U2 (ca/tổ) | — | thấp | Must |
| NV0b | Khai báo đối tượng nuôi & quy trình (loài, giai đoạn, chỉ tiêu và tần suất đo, ngưỡng, lịch mẫu, quy trình sản xuất) | U7 | U2, U9 (điểm kiểm soát) | NV0a | thấp | Must |
| NV0c | Khai báo vật tư & nguồn cung (vật tư, nhà cung cấp, định mức, đơn vị tính) | U4 | U2 (định mức), U9 (cờ cấm) | NV0a | thấp | Must |
| NV0d | Khai báo an toàn sinh học & thiết bị (bệnh và xét nghiệm, khu sạch–bẩn, khử trùng và vệ sinh bể, thiết bị) | U9 | U3 (bệnh/xét nghiệm), U8 (thiết bị) | NV0a | thấp | Must |
| NV0e | Duyệt khai báo cần phê duyệt (ngưỡng, quy trình, bệnh, khu sạch–bẩn, khử trùng, bỏ cờ cấm) | U5 (mặc định; người duyệt theo NV0f) | U7, U9, U4 (người soạn) | NV0b, NV0c, NV0d, NV0f | khi có thay đổi | Must |
| NV0f | Khai báo phòng ban & chức vụ, nhân viên, nghiệp vụ (cấp duyệt, điều kiện, đánh số chứng từ) | U6 | U5 (xác nhận người duyệt) | NV0a | thấp | Must |
| NV1 | Tiếp nhận & cách ly đàn bố mẹ | U2 | U3 (PCR đầu vào), U4 (nhập kho nếu mua) | NV0 | thấp | Must |
| NV2 | Cho đẻ & thu Nauplius (tạo mẻ) | U2 | U1 | NV1 | hằng ngày | Must |
| NV3 | Mở lô ương & giao bể | U2 | U1 | NV2 | hằng ngày | Must |
| NV4 | Ghi nhật ký bể (cho ăn, chỉ số nước, hao hụt, chuyển giai đoạn) | U1 | U2 (nhận cảnh báo), S1 (trừ kho) | NV3 | nhiều lần/ca | Must |
| NV5 | Xét nghiệm lô (PCR / vi sinh / chất lượng PL) | U3 | U2 | NV3 | hằng ngày | Must |
| NV6 | Thu hoạch lô → lô thành phẩm có QR (hoặc chuyển sang Green House) | U2 | U3 (điều kiện PCR), U4 (kho thành phẩm) | NV4, NV5 | hằng ngày | Must |
| NV7 | Xử lý sự cố bể (chỉ số vượt ngưỡng / PCR dương tính / hao hụt bất thường) | U2 | U1, U3, S1 | NV4 hoặc NV5 | khi phát sinh | Must |
| NV8 | Nhập kho vật tư từ nhà cung cấp | U4 | — | NV0 | hằng tuần | Must |
| NV9 | Yêu cầu & cấp phát vật tư cho trại | U2 (yêu cầu) | U4 (cấp phát) | NV8 | hằng ngày | Must |
| NV10 | Trừ kho tiêu hao theo nhật ký | S1 | U1 | NV4, NV9 | tự động | Must |
| NV11 | Kiểm kê kho (kho tổng & kho trại) | U4 | U2 | NV8 | hằng tháng | Must |
| NV12 | Theo dõi tổng quan & cảnh báo | U5 | S1 | NV4–NV11 | hằng ngày | Should |
| NV13 | Tra cứu truy xuất theo mã QR lô | U5 | — | NV6 | khi cần | Must |
| NV14 | Lập & duyệt kế hoạch sản xuất (lịch thả/thu lô theo tháng) | U2 | U5 (duyệt) | NV0 | hằng tháng | Must |
| NV15 | Sinh việc hằng ngày cho bể (lịch theo giai đoạn + việc đột xuất) | S1 | U2 (thêm việc), U1 (thực hiện) | NV3, NV0 | hằng ngày | Must |
| NV16 | Lệnh sản xuất (mỗi lệnh = một lô × một bước quy trình; tạo từ kế hoạch, duyệt theo NV0f, sinh việc + yêu cầu cấp vật tư) | U2 | người duyệt theo NV0f, U1 (việc), U4 (cấp vật tư) | NV14, NV0b, NV0c, NV0f | hằng ngày | Must |

## 4. Cross-user handoff map
| Chặng | Nghiệp vụ | Từ | → Nhận | Điều kiện chuyển | Điểm kết nếu không ai nhận |
|---|---|---|---|---|---|
| H1 | NV1 | U2 (tạo đàn "cách ly") | U3 | đàn ở trạng thái "chờ xét nghiệm đầu vào" | quá 48h chưa có kết quả → S1 cảnh báo U2; đàn KHÔNG thể dùng cho NV2 |
| H2 | NV1 | U3 (kết quả) | U2 | kết quả âm tính tất cả bệnh bắt buộc | dương tính → đàn "loại bỏ", kết thúc |
| H3 | NV3 | U2 (giao bể) | U1 | bể "đang ương" có ≥1 công nhân được giao | lô không có người giao → không được mở (chặn ở NV3) |
| H4 | NV4 | U1 (chỉ số vượt ngưỡng) | U2 | giá trị ngoài ngưỡng cấu hình | U2 chưa xác nhận sau 2h → cảnh báo leo lên U5 |
| H5 | NV4→NV10 | U1 (ghi cho ăn) | S1 | dòng nhật ký có vật tư + số lượng | không đủ tồn kho trại → ghi nhận "âm kho chờ xử lý", báo U2 + U4 |
| H6 | NV5 | U3 (kết quả PCR lô) | U2 | kết quả nhập xong | dương tính → mở NV7 tự động |
| H7 | NV6 | U2 (thu hoạch) | U4 | lô thành phẩm tạo xong | lô nằm kho thành phẩm; phase 2 sale nhận |
| H8 | NV9 | U2 (yêu cầu) | U4 | yêu cầu "chờ cấp" | quá 24h chưa xử lý → nhắc U4; U2 có thể huỷ |
| H10 | NV14 | U2 (gửi kế hoạch tháng) | U5 | kế hoạch "chờ duyệt" | quá 3 ngày chưa duyệt → nhắc U5; kế hoạch tháng trước vẫn là mốc so sánh |
| H11 | NV15 | S1 / U2 (tạo việc) | U1 | việc gắn bể mà U1 được giao | việc quá giờ 60 phút chưa làm → hiện "trễ" cho U2 |
| H9 | NV11 | U4 (biên bản lệch) | U2 | chênh lệch > 2% giá trị dòng | U2 xác nhận nguyên nhân; chưa xác nhận → biên bản "chờ duyệt", tồn chưa điều chỉnh |
| H12 | NV0b/c/d → NV0e | U7 / U9 / U4 (gửi bản nháp) | người duyệt cấp 1 theo NV0f (mặc định U5) | bản nháp thuộc nhóm cần duyệt, có lý do sửa | quá 3 ngày chưa duyệt → nhắc người duyệt; bản đang hiệu lực giữ nguyên, không có khoảng trống quy tắc |
| H13 | NV16 | U2 (gửi lệnh) | người duyệt chính hoặc thay của cấp đang chờ (NV0f) | lệnh "chờ duyệt"; điều kiện bỏ qua cấp đã xét | quá 24h chưa duyệt → nhắc người chính + người thay; trả lại → lệnh về "đang lập" cho U2 |
| H14 | NV16 → NV9, NV15 | S1 (lệnh "đã duyệt") | U4 (yêu cầu cấp theo định mức), U1 (việc của bước) | lệnh đã duyệt; việc chỉ sinh khi lệnh bước trước của lô đã hoàn thành | yêu cầu cấp theo H8; việc trễ theo H11; lệnh quá ngày dự kiến chưa hoàn thành → "trễ" cho U2 |

## 5. Flows

### Flow NV0 (NV0a–NV0d) — Khai báo danh mục · owner: theo nhóm (bảng dưới)
> Ký hiệu "NV0" ở các dòng khác = NV0a–NV0e. Danh sách trang và lý do: [research 03](../research/03-trang-khai-bao.md).

| Nhóm | Trang khai báo | Người soạn/sửa | Cần duyệt (NV0e) |
|---|---|---|---|
| A | Cơ sở / địa điểm | U6 | không |
| A | Khu – ao – bể | U8 | không |
| A | Kho | U4 | không |
| A | Ca / tổ sản xuất | U2 | không |
| A | Phòng ban & chức vụ | U6 | không |
| A | Nhân viên (hồ sơ gốc: mã, họ tên, phòng ban, chức vụ, cơ sở/trại, ca/tổ) | U6 | không |
| A | Người dùng & quyền (tài khoản gắn vào nhân viên; thêm vai trò U7–U9) | U6 | không |
| A | Khai báo nghiệp vụ (cấp duyệt, người duyệt chính + thay, điều kiện bỏ qua/thêm cấp, quy tắc đánh số) | U6 | không (ghi nhật ký; R21 chặn bỏ hết cấp của nhóm ATSH) |
| B | Loài & giai đoạn | U7 | không |
| B | Chỉ tiêu theo dõi & tần suất đo | U7 | không |
| B | Ngưỡng cảnh báo (loài × giai đoạn) | U7 | **có** |
| B | Lịch mẫu theo giai đoạn | U7 | không |
| B | Quy trình sản xuất | U7 (điểm kiểm soát ATSH: U9) | **có** |
| C | Vật tư (nhóm, đơn vị, cờ cấm) | U4 (cờ cấm: U9) | bỏ cờ cấm: **có** |
| C | Nhà cung cấp | U4 | không |
| C | Định mức vật tư theo giai đoạn | U2 | không |
| C | Đơn vị tính & quy đổi | U4 | không |
| D | Bệnh & chỉ tiêu xét nghiệm | U9 | **có** |
| D | Khu sạch–bẩn & điểm kiểm soát ra vào | U9 | **có** |
| D | Hoá chất khử trùng & quy trình vệ sinh bể | U9 | **có** |
| D | Thiết bị | U8 | không |
| — | Tổng quan Khai báo (checklist mục còn thiếu) | mọi vai trò có quyền khai báo | — |

- **Start**: hệ thống mới / có cơ sở, bể, vật tư, loài, quy trình mới / Đắc Lộc đổi quy định
- **Input**: dữ liệu của trang tương ứng. Khu–ao–bể: loại đơn vị nuôi (bể ấu trùng, bể nuôi vỗ, ao thương phẩm, bể tôm hùm, bể ốc, bể cá…), diện tích m² hoặc thể tích m³ và độ sâu theo loại, hệ thống nuôi (RAS, biofloc/Green House, ao đất, lót bạt), khu sạch–bẩn, nguồn nước cấp/thải, vị trí trên sơ đồ khu. Loài + chuỗi giai đoạn (tôm thẻ: N→Z1-3→M1-3→PL1…PLn; cá, ốc, tôm hùm khai riêng). Chỉ tiêu + tần suất đo theo loại đơn vị nuôi. Quy trình: chuỗi bước, đầu vào → đầu ra từng bước, điểm kiểm soát và bằng chứng yêu cầu. Hoặc file Excel/CSV import cho: bể/ao/khu, vật tư + nhà cung cấp + tồn đầu kỳ, thiết bị
- **Steps**: nhập/import → hệ thống kiểm trùng mã + bắt buộc + định dạng + quyền theo nhóm (R15) → nhóm không cần duyệt: lưu hiệu lực ngay; nhóm cần duyệt: lưu bản nháp và gửi duyệt (H12 → NV0e). Mọi thay đổi ghi nhật ký (ai, gì, lúc nào)
- **Output**: danh mục hiệu lực; dòng import lỗi trả về kèm lý do, dòng hợp lệ vẫn lưu; trang Tổng quan Khai báo liệt kê mục chưa có bản ghi hiệu lực nào
- **End**: danh mục dùng được cho NV1–NV11, NV14, NV15

### Flow NV0e — Duyệt khai báo cần phê duyệt · owner: U5
- **Start**: U7 / U9 / U4 gửi bản nháp của một mục thuộc nhóm cần duyệt (H12)
- **Input**: bản nháp (giá trị cũ → mới), lý do sửa, bản đang hiệu lực
- **Steps**: người duyệt từng cấp theo nghiệp vụ "Khai báo cần duyệt" ở NV0f (mặc định 1 cấp: U5) xem khác biệt → duyệt (hiệu lực khi cấp cuối duyệt) hoặc trả lại kèm lý do → bản đã duyệt có phiên bản mới, bản cũ được giữ
- **Output**: bản "đã duyệt" hiệu lực; lô đang chạy xử lý theo R13 (chặt hơn: áp dụng ngay; nới lỏng: chỉ lô mở sau); trả lại → người soạn sửa và gửi lại
- **End**: bản "đã duyệt" hoặc "trả lại"; chưa duyệt thì bản cũ vẫn là quy tắc hiệu lực

### Flow NV1 — Tiếp nhận & cách ly bố mẹ · owner: U2
- **Start**: đàn bố mẹ về trại (nhập khẩu / mua / tự tuyển)
- **Input**: nguồn gốc (NCC, quốc gia, dòng SPF), số con đực/cái, giấy kiểm dịch nhập, bể cách ly
- **Steps**: tạo đàn → trạng thái "cách ly – chờ xét nghiệm" (H1) → U3 nhập kết quả (H2) → âm tính: "sẵn sàng" / dương tính: "loại bỏ"
- **Output**: 1 đàn bố mẹ có mã, trạng thái, kết quả đầu vào đính kèm
- **End**: đàn "sẵn sàng" hoặc "loại bỏ"

### Flow NV2 — Cho đẻ & thu Nauplius · owner: U2
- **Start**: có đàn "sẵn sàng"
- **Input**: đàn bố mẹ, số cái cho đẻ, ngày, số Nauplius ước lượng
- **Steps**: tạo mẻ đẻ gắn đàn → ghi số Nauplius thu
- **Output**: mẻ Nauplius có mã, số lượng, liên kết đàn
- **End**: mẻ chờ phân vào bể (NV3); mẻ không phân trong 24h → "huỷ" kèm lý do

### Flow NV3 — Mở lô ương & giao bể · owner: U2
- **Start**: có mẻ Nauplius chưa phân hết
- **Input**: mẻ, bể trống, số lượng thả, công nhân được giao
- **Steps**: chọn bể trống → thả số lượng (≤ còn lại của mẻ) → giao công nhân (H3)
- **Output**: lô ương "đang ương" ở giai đoạn đầu, gắn mẻ + bể; số còn lại của mẻ giảm tương ứng
- **End**: lô hiện trong danh sách việc của công nhân được giao

### Flow NV4 — Ghi nhật ký bể · owner: U1
- **Start**: công nhân có bể được giao, đến giờ cho ăn / đo
- **Input**: bể (tự nhận lô đang ương), loại ghi: cho ăn (vật tư + lượng), chỉ số nước (nhiệt độ, pH, độ mặn, DO, kiềm, NH3/NO2 tuỳ chọn), hao hụt ước lượng, đề xuất chuyển giai đoạn, thời điểm; hoạt động khi offline
- **Steps**: chọn bể → nhập → lưu cục bộ nếu mất mạng → đồng bộ khi có mạng (S1)
- **Output**: dòng nhật ký gắn lô + người + thời điểm thực; nếu ngoài ngưỡng → cảnh báo (H4); nếu cho ăn → NV10 (H5)
- **End**: dòng nhật ký có trạng thái "đã đồng bộ"

### Flow NV5 — Xét nghiệm lô · owner: U3
- **Start**: có lô/đàn cần xét nghiệm (định kỳ, trước thu hoạch, hoặc NV7 yêu cầu)
- **Input**: lô/đàn, loại xét nghiệm, chỉ tiêu (WSSV, IHHNV, AHPND, EHP, TSV, YHV… cấu hình), ngày lấy mẫu, kết quả âm/dương, file đính kèm, nơi xét nghiệm (nội bộ / viện)
- **Steps**: tạo phiếu mẫu → nhập kết quả từng chỉ tiêu → chốt phiếu
- **Output**: phiếu kết quả chốt gắn lô; dương tính → NV7 (H6)
- **End**: phiếu "đã chốt" (không sửa, chỉ huỷ có lý do + lập phiếu mới)

### Flow NV6 — Thu hoạch lô · owner: U2
- **Start**: lô đạt giai đoạn xuất (vd PL10–12, hoặc PL40 Green House)
- **Input**: lô, số lượng thực đếm, giai đoạn, phiếu PCR âm tính ≤ 3 ngày (cấu hình), đích: kho thành phẩm hoặc lô Green House
- **Steps**: kiểm điều kiện PCR → ghi số thu → tạo lô thành phẩm có mã + QR (hoặc lô Green House kế thừa nguồn gốc) → đóng lô ương, giải phóng bể
- **Output**: lô thành phẩm có QR, tỷ lệ sống = số thu / số thả; bể về "trống – chờ vệ sinh"
- **End**: lô nằm kho thành phẩm (H7)

### Flow NV7 — Xử lý sự cố bể · owner: U2
- **Start**: cảnh báo từ H4, H6, hoặc hao hụt ngày > ngưỡng
- **Input**: sự cố, lô/bể liên quan
- **Steps**: xác nhận → chọn xử lý: theo dõi thêm / xử lý nước-thuốc (tạo yêu cầu vật tư NV9) / huỷ lô (ghi số tiêu huỷ + lý do)
- **Output**: sự cố "đã xử lý" với hành động ghi lại; huỷ lô → lô "huỷ", bể "trống – chờ vệ sinh"
- **End**: sự cố đóng

### Flow NV8 — Nhập kho vật tư · owner: U4
- **Start**: hàng NCC về kho tổng
- **Input**: NCC, vật tư, số lượng, đơn giá, số lô NCC, hạn dùng, chứng từ
- **Steps**: tạo phiếu nhập → kiểm vật tư không thuộc danh mục "cấm dùng" → chốt
- **Output**: tồn kho tổng tăng theo từng lô hạn dùng; giá vốn bình quân cập nhật
- **End**: phiếu nhập "đã chốt"

### Flow NV9 — Yêu cầu & cấp phát · owner: U2 (yêu cầu), cấp phát bởi U4
- **Start**: kho trại sắp hết hoặc NV7 cần thuốc/hoá chất
- **Input**: trại, vật tư, số lượng
- **Steps**: U2 tạo yêu cầu (H8) → U4 cấp đủ/ một phần/ từ chối có lý do, xuất theo hạn dùng gần nhất trước (FEFO)
- **Output**: kho tổng giảm, kho trại tăng đúng số cấp; yêu cầu "đã cấp" / "cấp một phần" / "từ chối"
- **End**: yêu cầu đóng hoặc phần còn lại vẫn "chờ cấp"

### Flow NV10 — Trừ kho tiêu hao · owner: S1
- **Start**: dòng nhật ký cho ăn/xử lý được đồng bộ
- **Input**: vật tư, lượng, trại, lô
- **Steps**: trừ kho trại → ghi chi phí vào lô
- **Output**: tồn kho trại giảm; chi phí vật tư cộng dồn của lô tăng
- **End**: giao dịch kho ghi nhận; thiếu tồn → "âm kho chờ xử lý" (H5)

### Flow NV11 — Kiểm kê · owner: U4
- **Start**: kỳ kiểm kê hoặc đột xuất
- **Input**: kho, số đếm thực từng vật tư
- **Steps**: chốt số sổ tại thời điểm bắt đầu → nhập số thực → tính chênh lệch → lệch > 2% gửi U2 xác nhận (H9)
- **Output**: biên bản kiểm kê; sau duyệt, tồn sổ = tồn thực
- **End**: biên bản "đã duyệt"

### Flow NV12 — Tổng quan & cảnh báo · owner: U5
- **Start**: BGĐ cần nắm tình hình
- **Input**: phạm vi (toàn khu / trại), khoảng thời gian
- **Steps**: xem chỉ số → mở chi tiết trại → bể → lô
- **Output**: sản lượng thu thực / kế hoạch tháng (toàn khu và từng trại, xếp hạng % đạt so với mốc kế hoạch tới hôm nay), số lô đang ương, tổng số PL ước lượng, tỷ lệ sống trung bình, sản lượng thu theo kỳ, cảnh báo mở, tồn kho dưới mức tối thiểu, chi phí vật tư/triệu PL
- **End**: thông tin đọc được; không phát sinh ghi

### Flow NV14 — Lập & duyệt kế hoạch sản xuất · owner: U2
- **Start**: trước tháng mới (hoặc điều chỉnh giữa tháng)
- **Input**: trại, danh sách lô dự kiến: bể, ngày thả, số thả, ngày thu dự kiến, số thu dự kiến (= số thả × tỷ lệ sống chuẩn cấu hình)
- **Steps**: U2 lập/sao chép từ tháng trước → gửi duyệt (H10) → U5 duyệt hoặc trả lại kèm lý do
- **Output**: kế hoạch tháng "đã duyệt" cho trại: tổng PL thu dự kiến theo ngày; mốc "kế hoạch tới hôm nay" dùng cho NV12
- **End**: kế hoạch "đã duyệt" hoặc "trả lại" (U2 sửa và gửi lại)

### Flow NV15 — Sinh việc hằng ngày · owner: S1
- **Start**: 00:00 mỗi ngày, hoặc khi lô mở/chuyển giai đoạn
- **Input**: lô đang ương, giai đoạn, lịch mẫu theo loài×giai đoạn (giờ cho ăn, giờ đo nước); việc đột xuất U2 thêm
- **Steps**: S1 sinh việc theo lịch mẫu → U2 thêm/huỷ việc đột xuất → U1 thực hiện qua NV4 (dòng nhật ký đánh dấu việc "xong")
- **Output**: danh sách việc theo bể × giờ của từng công nhân; trạng thái chờ / xong / trễ
- **End**: hết ngày: việc chưa làm giữ trạng thái "trễ" trong báo cáo, không chuyển sang ngày sau

### Flow NV16 — Lệnh sản xuất · owner: U2
- **Start**: kế hoạch tháng "đã duyệt" (NV14), hoặc U2 cần lệnh ngoài kế hoạch
- **Input**: kế hoạch đã duyệt (lô dự kiến: bể, ngày thả, số thả, ngày thu); quy trình sản xuất đã duyệt của loài (các bước, điểm kiểm soát); định mức vật tư theo giai đoạn; quy trình duyệt của nghiệp vụ "Lệnh sản xuất" (NV0f)
- **Steps**:
  1. U2 dùng "Tạo lệnh sản xuất tự động" trên kế hoạch → mỗi lô dự kiến sinh chuỗi lệnh theo mọi bước của quy trình (thả → chuyển giai đoạn → thu hoạch), ngày dự kiến tính từ kế hoạch, trạng thái **"đang lập"**; bấm lại không tạo trùng (R24). Lệnh ngoài kế hoạch: U2 tạo tay, đánh dấu "ngoài kế hoạch"
  2. U2 chỉnh ngày/số lượng → gửi duyệt (H13); mã lệnh tự sinh theo quy tắc đánh số (R23)
  3. Duyệt tuần tự theo các cấp đã khai (người chính hoặc người thay); điều kiện bỏ qua/thêm cấp áp lúc gửi; trả lại → "đang lập"
  4. Lệnh "đã duyệt" → S1 tạo yêu cầu cấp vật tư = định mức × số lượng × số ngày của bước (H14 → NV9); khi lệnh bước trước của lô hoàn thành, lệnh chuyển "đang thực hiện" và sinh việc cho công nhân của bể (H14 → NV15, R25)
  5. U2 xác nhận kết quả: số thực, ngày thực; điểm kiểm soát của bước phải đạt (R18); lệch số lượng vượt ngưỡng cần lý do (R26)
- **Output**: lệnh "hoàn thành" gắn lô + bước + số thực; yêu cầu cấp và việc truy được về lệnh; nhật ký của bể trong thời gian lệnh gắn với lệnh
- **End**: "hoàn thành", "huỷ" (chưa thực hiện, có lý do; yêu cầu cấp chưa cấp bị huỷ) hoặc "đóng" (đã thực hiện dở, có lý do) — R27

### Flow NV13 — Truy xuất theo QR · owner: U5
- **Start**: có mã QR/mã lô thành phẩm
- **Input**: mã lô
- **Steps**: quét/nhập mã → trả chuỗi nguồn gốc
- **Output**: lô thành phẩm → lô ương (bể, ngày thả, ngày thu, tỷ lệ sống) → mẻ Nauplius → đàn bố mẹ (nguồn, kết quả đầu vào) → các phiếu PCR → vật tư/thuốc đã dùng
- **End**: chuỗi đầy đủ hoặc báo rõ mắt xích thiếu

## 6. Flow optimization log
> Đánh giá do BA-Orchestrator chạy tuần tự với vai Domain-Specialist (trại giống tôm / kho) — chưa spawn team-agent; cần chuyên gia Đắc Lộc xác nhận khi có SOP thật.

| Flow | Candidate | Chọn / Loại | Lý do (rubric) | Đánh giá bởi | Conflict |
|---|---|---|---|---|---|
| NV4 | A: công nhân ghi rồi trưởng trại duyệt từng dòng · B: ghi là có hiệu lực, chỉ dòng ngoài ngưỡng mới cần trưởng trại | Chọn B | A tạo hàng chục nghìn lượt duyệt/ngày (rubric #5 ít bước); B vẫn giữ kiểm soát ở chỗ rủi ro | Optimizer | — |
| NV10 | A: cấp phát = tiêu hao (trừ hết khi cấp) · B: kho trại riêng, trừ theo nhật ký | Chọn B | A không tính được giá thành theo lô và không phát hiện thất thoát (rubric #2 output rõ) | Domain-Specialist (kho) | — |
| NV6 | A: thu hoạch bất kể PCR · B: chặn thu hoạch nếu không có PCR âm tính gần nhất | Chọn B | Chuẩn an toàn dịch bệnh / GlobalGAP; Specialist veto A | Domain-Specialist (thú y TS) | veto A |
| NV1 | A: dùng đàn ngay khi về · B: cách ly đến khi có kết quả | Chọn B | Điều kiện cơ sở theo NĐ 26/2019 (có nơi cách ly giống mới nhập) | Domain-Specialist | veto A |
| NV14 | A: chỉ tiêu tháng/trại do BGĐ giao · B: kế hoạch = tổng các lô dự kiến do trưởng trại lập, BGĐ duyệt | Chọn B (user chốt) | B cho mốc theo ngày và gắn với bể thật; A không biết lệch ở lô nào | Optimizer + user | — |
| NV15 | A: trưởng trại giao việc thủ công · B: lịch tự sinh · C: tự sinh + việc đột xuất | Chọn C (user chốt) | A tạo việc lặp cho trưởng trại (rubric #5); B thiếu xử lý sự cố | Optimizer + user | — |
| NV11 | A: điều chỉnh tồn ngay khi nhập số thực · B: lệch > 2% cần duyệt | Chọn B | Chống che thất thoát; lệch nhỏ không tạo việc thừa (rubric #4 cross tối thiểu) | Optimizer | — |
| NV9 | A: trưởng trại tự xuất kho tổng · B: thủ kho cấp phát | Chọn B | Tách người yêu cầu / người xuất (kiểm soát nội bộ) | Domain-Specialist (kho) | — |
| NV0 | A: chỉ admin sửa mọi khai báo · B: sửa theo phòng ban · C: admin + trưởng phòng kỹ thuật | Chọn B (user chốt) | Chuyên môn nằm ở R&D, Kỹ thuật, ATSH; admin không phải người chịu trách nhiệm ngưỡng hay quy trình (rubric #1 định hướng owner) | Optimizer + user | — |
| NV16 | Đối tượng: A lô × bước quy trình · B bể theo khoảng thời gian · C đợt nhiều bể. Nguồn: A nút tạo tự động từ kế hoạch · B tạo tay. Kho: A tạo yêu cầu cấp theo định mức · B chỉ hiển thị · C xuất kho ngay | Chọn lô × bước, nút tạo tự động ("đang lập"), tạo yêu cầu cấp (user chốt) | Lô × bước để điểm kiểm soát ATSH chặn ngay ở lệnh; yêu cầu cấp giữ tách người yêu cầu / người xuất (NV9); xuất ngay bỏ qua kiểm soát kho | Optimizer + Domain-Specialist (kho) + user | — |
| NV0f | Người duyệt theo: A chức vụ · B nhân viên cụ thể · C vai trò hệ thống | Chọn B + người thay mỗi cấp (user chốt) | B rõ trách nhiệm; người thay tránh chứng từ kẹt khi nghỉ (rubric #3 không dead-end) | Optimizer + user | — |
| NV0e | A: sửa có hiệu lực ngay, chỉ ghi nhật ký · B: bản nháp + duyệt cho nhóm ATSH, ngưỡng, quy trình · C: không cần cho demo | Chọn B (user chốt) | Ưu tiên 1 là an toàn sinh học và cần hồ sơ GlobalGAP; A để một lần sửa nới ngưỡng có hiệu lực không dấu vết duyệt (rubric #3 không dead-end ở người nhận, #6 đo được) | Domain-Specialist (ATSH) + user | veto A cho nhóm ATSH |

## 7. Scope & Priority
- **IN (MVP)**: NV0a–NV0f (khai báo đủ cho 4 mảng: tôm giống, cá + ốc giống, tôm thương phẩm, tôm hùm; nhân viên, phòng ban, quy trình duyệt theo nghiệp vụ), NV1–NV16; vận hành đầy đủ cho tôm thẻ chân trắng; cá chẽm, tôm hùm, ốc hương, tôm sú qua cấu hình giai đoạn (cùng flow lô); song ngữ Việt/Anh; offline cho NV4; phân quyền theo trại + vai trò; cảnh báo trong app; import Excel danh mục + tồn đầu kỳ.
- **OUT (phase sau)**: bán hàng/đặt giống, cổng đại lý-hộ nuôi, công nợ, kế toán (Đắc Lộc đang dùng Vietsun: hướng mặc định là xuất dữ liệu sang Vietsun, không thay thế — chờ xác nhận), nhân sự-lương, vận hành nuôi thương phẩm/tôm hùm/ốc giống (khai báo đã IN; chạy vận hành ở P2–P3), thu mua, cửa hàng thức ăn, vận tải, khách hàng/đại lý, mã kế toán Vietsun, kết nối IoT (chỉ chừa điểm nhận dữ liệu; họp nêu nhu cầu tự động hoá, chờ xác nhận có đưa vào phase 1), Zalo/SMS, đơn mua hàng NCC (MVP chỉ ghi phiếu nhập).

## 8. Success metric
| Nghiệp vụ | Metric | Ngưỡng đạt |
|---|---|---|
| NV4 | thời gian ghi 1 lần cho ăn | ≤ 15 giây/bể |
| NV4 | nhật ký offline mất khi đồng bộ | 0 dòng |
| NV4/NV7 | cảnh báo ngoài ngưỡng chưa xác nhận > 2h | 0 / tuần sau tháng thứ 2 |
| NV6/NV13 | lô thành phẩm có chuỗi truy xuất đủ 5 mắt xích | 100% |
| NV6 | lô thu hoạch không có PCR âm tính hợp lệ | 0 |
| NV10/NV11 | chênh lệch kiểm kê | ≤ 2% giá trị kho |
| NV9 | yêu cầu vật tư chờ > 24h | ≤ 5% |
| NV12 | dữ liệu tổng quan trễ so với nhật ký | ≤ 5 phút |
| NV14 | trại có kế hoạch tháng đã duyệt trước ngày 1 | 14/14 trại |
| NV15 | việc hằng ngày hoàn thành đúng giờ (±60 phút) | ≥ 90% |
| NV0 | mục bắt buộc còn thiếu ở trang Tổng quan Khai báo trước buổi demo | 0 |
| NV0e | thay đổi ngưỡng/quy trình/ATSH có hiệu lực mà chưa qua duyệt | 0 |
| NV0e | bản nháp chờ duyệt > 3 ngày | ≤ 5% |
| NV16 | lệnh hoàn thành đúng ngày dự kiến (±1 ngày) | ≥ 90% |
| NV16 | lệnh đã duyệt có yêu cầu cấp được cấp trước ngày bắt đầu bước | ≥ 95% |

## 9. Rules & Invariants
| # | Rule | Edge case |
|---|---|---|
| R1 | Người dùng chỉ đọc/ghi dữ liệu của trại được phân quyền; U5, U6 thấy mọi trại | công nhân chuyển trại → mất quyền trại cũ ngay, nhật ký cũ giữ nguyên tác giả |
| R2 | Đàn bố mẹ chỉ cho đẻ khi trạng thái "sẵn sàng" | kết quả bị huỷ sau khi đã "sẵn sàng" → đàn quay về "chờ xét nghiệm" |
| R3 | Tổng số thả từ một mẻ ≤ số Nauplius của mẻ | hai trưởng trại phân cùng lúc → bản ghi thứ hai bị từ chối |
| R4 | Một bể chỉ có tối đa 1 lô "đang ương" | ghép lô: phải đóng lô cũ (chuyển) trước |
| R5 | Không thu hoạch khi không có phiếu PCR âm tính, chốt, trong N ngày (mặc định 3) | phiếu có 1 chỉ tiêu dương tính → chặn dù các chỉ tiêu khác âm |
| R6 | Lô thành phẩm kế thừa bất biến chuỗi nguồn gốc; mã QR duy nhất, không tái sử dụng | lô Green House tách từ nhiều lô ương → giữ tất cả nguồn |
| R7 | Vật tư cờ "cấm dùng" (kháng sinh cấm…) không thể nhập kho, cấp phát hay ghi nhật ký | vật tư bị gắn cờ sau khi đã có tồn → tồn bị phong toả |
| R8 | Mọi thay đổi kho đi qua giao dịch (nhập, cấp, tiêu hao, điều chỉnh kiểm kê); tồn = tổng giao dịch | đồng bộ offline trùng → idempotent theo mã dòng nhật ký |
| R9 | Nhật ký offline giữ thời điểm thực tại bể, không phải thời điểm đồng bộ | đồng hồ máy sai > 10 phút → đánh dấu "nghi ngờ thời gian" |
| R11 | Chỉ kế hoạch "đã duyệt" mới là mốc so sánh; sửa kế hoạch đã duyệt tạo phiên bản mới cần duyệt lại | chưa có kế hoạch tháng → tổng quan hiện "Chưa có kế hoạch", không tính % |
| R12 | Việc tự sinh không trùng: mỗi (lô, loại việc, khung giờ) tối đa 1 việc | lô chuyển giai đoạn giữa ngày → việc còn lại theo lịch giai đoạn mới |
| R10 | Phiếu đã chốt (xét nghiệm, nhập, kiểm kê) không sửa; chỉ huỷ có lý do + người huỷ | huỷ phiếu nhập đã cấp phát một phần → chặn, phải điều chỉnh bằng giao dịch ngược |
| R13 | Khai báo thuộc nhóm cần duyệt (ngưỡng, quy trình, bệnh và xét nghiệm, khu sạch–bẩn, khử trùng, bỏ cờ cấm) chỉ có hiệu lực sau khi cấp duyệt cuối (NV0f; mặc định U5) duyệt; sửa bản đã duyệt tạo phiên bản mới, bản cũ giữ để truy xuất | thay đổi chặt hơn (thêm bệnh bắt buộc, thêm điểm kiểm soát, nâng mức khu, thu hẹp ngưỡng) áp dụng ngay cho mọi lô sau khi duyệt; nới lỏng chỉ áp cho lô mở sau ngày hiệu lực; **đặt** cờ cấm có hiệu lực ngay (R7) |
| R14 | Mục danh mục đã được tham chiếu (bể có lô, vật tư có giao dịch, nhà cung cấp có phiếu, loài có lô) không xoá; chỉ "ngừng sử dụng": không hiện ở lựa chọn mới, vẫn hiện ở lịch sử và truy xuất | ngừng bể đang có lô đang ương → chặn |
| R15 | Mỗi trang khai báo chỉ vai trò được giao (bảng ở Flow NV0) mới sửa được; vai trò khác chỉ xem | phòng chưa có người phụ trách → U6 gán vai trò đó cho một người; không có vai trò "sửa tất cả" |
| R16 | Bể ở trạng thái chờ vệ sinh không nhận lô mới | bể về chờ vệ sinh sau thu hoạch hoặc huỷ lô (AC-13) |
| R17 | Không chuyển lô từ bể ở khu có mức an toàn thấp sang bể ở khu mức cao hơn | khu chưa khai mức → coi là thấp nhất (chặn chuyển lên) |
| R18 | Bước quy trình có điểm kiểm soát không hoàn tất được khi thiếu bằng chứng yêu cầu (vd phiếu PCR âm còn hiệu lực) | bằng chứng bị huỷ sau khi bước đã qua → không hồi tố, cảnh báo U2 và U9 |
| R19 | Loài chỉ dùng được khi có ≥ 1 giai đoạn có ngưỡng đã duyệt | bỏ hết giai đoạn của loài đang có lô → chặn |
| R20 | Tần suất đo khai báo theo chỉ tiêu × loại đơn vị nuôi; S1 sinh việc theo đó (R12 giữ) | chỉ tiêu chưa khai tần suất → dùng lịch mẫu của giai đoạn (AC-23) |
| R21 | Mỗi nghiệp vụ có quy trình duyệt khai ở NV0f: 0..n cấp tuần tự; mỗi cấp một người duyệt chính + một người thay (nhân viên cụ thể), ai trong hai người duyệt cũng được; người tạo chứng từ không tự duyệt chứng từ của mình | ngừng nhân viên đang là người duyệt mà cấp đó không còn người hoạt động nào → chặn tới khi thay người; nghiệp vụ "Khai báo cần duyệt" (NV0e) phải có ≥ 1 cấp |
| R22 | Sửa quy trình duyệt chỉ áp cho chứng từ gửi duyệt sau đó | chứng từ đang chờ giữ quy trình lúc gửi, kể cả người duyệt cũ (người thay của cấp đó vẫn duyệt được) |
| R23 | Mã chứng từ tự sinh theo quy tắc đánh số của nghiệp vụ, duy nhất, không tái sử dụng kể cả khi huỷ | đổi quy tắc giữa kỳ → mã đã cấp giữ nguyên |
| R24 | "Tạo lệnh sản xuất tự động" chỉ chạy với kế hoạch "đã duyệt"; mỗi (lô dự kiến, bước) tối đa 1 lệnh chưa huỷ | kế hoạch có phiên bản mới (R11) bỏ một lô → lệnh "đang lập" của lô đó đánh dấu "lệch kế hoạch", không tự huỷ |
| R25 | Lệnh chỉ sinh việc và tạo yêu cầu cấp khi "đã duyệt"; lệnh bước n chỉ "đang thực hiện" khi lệnh bước n−1 của cùng lô "hoàn thành" | lệnh bước trước bị "đóng" → bước sau chờ U2 quyết định huỷ hoặc thực hiện |
| R26 | Hoàn thành lệnh cần số thực + ngày thực; điểm kiểm soát của bước đạt (R18); lệch số lượng so với lệnh > ngưỡng (mặc định 10%) bắt buộc lý do | lệnh quá ngày dự kiến chưa hoàn thành → trạng thái "trễ" cho U2 |
| R27 | Sửa lệnh đã duyệt → về "chờ duyệt" từ cấp 1, yêu cầu cấp chưa cấp của lệnh huỷ và tạo lại khi duyệt xong; huỷ chỉ khi lệnh chưa "đang thực hiện", có lý do, huỷ phần chưa cấp của yêu cầu cấp | vật tư đã cấp giữ ở kho trại; lệnh đang thực hiện chỉ "đóng" kèm lý do |

## 10. Acceptance Criteria — ORACLE

### AC-1 — Import danh mục bể có dòng lỗi · Maps to: NV0 · Test: integration
- **Given** file import 10 dòng bể, trong đó 2 dòng trùng mã bể đã có
- **When** U6 thực hiện import
- **Then** 8 bể hợp lệ được lưu và 2 dòng lỗi được trả về kèm lý do trùng mã
- **Assert** count(tanks mới) == 8 · count(import_errors) == 2 · mỗi lỗi có reason == "duplicate_code"

### AC-2 — Đàn bố mẹ không dùng được khi chưa có kết quả · Maps to: NV1 · Test: integration
- **Given** đàn bố mẹ trạng thái "cách ly – chờ xét nghiệm"
- **When** U2 tạo mẻ đẻ từ đàn này
- **Then** thao tác bị từ chối và không có mẻ nào được tạo
- **Assert** response == lỗi "broodstock_not_ready" · count(spawn_batches của đàn) == 0

### AC-3 — Kết quả đầu vào dương tính loại đàn · Maps to: NV1 · Test: integration
- **Given** đàn "cách ly – chờ xét nghiệm"
- **When** U3 chốt phiếu có WSSV dương tính
- **Then** đàn chuyển "loại bỏ" và U2 nhận thông báo
- **Assert** broodstock.status == "culled" · count(notifications cho U2, loại "test_positive") == 1

### AC-4 — Không thả vượt số Nauplius của mẻ · Maps to: NV3 · Test: unit
- **Given** mẻ có 2.000.000 Nauplius, đã thả 1.500.000
- **When** U2 mở lô mới thả 600.000 từ mẻ này
- **Then** thao tác bị từ chối, số còn lại của mẻ không đổi
- **Assert** error == "exceeds_batch_remaining" · batch.remaining == 500000

### AC-5 — Một bể một lô đang ương · Maps to: NV3 · Test: integration
- **Given** bể B-03 đang có lô "đang ương"
- **When** U2 mở lô mới vào B-03
- **Then** thao tác bị từ chối
- **Assert** count(lots status="rearing" và tank="B-03") == 1

### AC-6 — Công nhân ghi cho ăn offline rồi đồng bộ · Maps to: NV4 · Test: e2e
- **Given** U1 được giao bể B-03, thiết bị mất mạng
- **When** U1 ghi 3 lần cho ăn rồi thiết bị có mạng trở lại
- **Then** cả 3 dòng được đồng bộ với thời điểm thực lúc ghi, không trùng
- **Assert** count(feed_logs của lô B-03) == 3 · mỗi dòng recorded_at == thời điểm ghi trên thiết bị (±1s) · sync_status == "synced"

### AC-7 — Đồng bộ lặp không trừ kho hai lần · Maps to: NV10 · Test: integration
- **Given** dòng nhật ký cho ăn 2 kg thức ăn X, kho trại có 50 kg
- **When** cùng dòng đó được gửi đồng bộ 2 lần
- **Then** kho trại chỉ giảm 2 kg và chi phí lô chỉ cộng 1 lần
- **Assert** stock(trại, X) == 48 · count(stock_transactions của dòng) == 1

### AC-8 — Công nhân không ghi được bể không được giao · Maps to: NV4 · Test: e2e
- **Given** U1 thuộc trại T1, bể C-01 thuộc trại T2
- **When** U1 ghi nhật ký vào C-01
- **Then** thao tác bị từ chối do không có quyền
- **Assert** response status == 403 · count(logs mới của C-01) == 0

### AC-9 — Chỉ số nước ngoài ngưỡng tạo cảnh báo · Maps to: NV4 · Test: integration
- **Given** ngưỡng pH cho tôm thẻ giai đoạn Mysis là 7,5–8,5
- **When** U1 ghi pH = 9,1 cho bể đang ở Mysis
- **Then** một cảnh báo mở được tạo cho trưởng trại của trại đó
- **Assert** count(alerts status="open", type="water_out_of_range", assignee=U2 trại) == 1

### AC-10 — Cảnh báo không xác nhận sau 2h leo thang · Maps to: NV7 · Test: integration
- **Given** cảnh báo mở 2 giờ 1 phút, chưa được U2 xác nhận
- **When** S1 chạy kiểm tra leo thang
- **Then** BGĐ nhận cảnh báo leo thang
- **Assert** alert.escalated == true · count(notifications cho U5, loại "escalation") == 1

### AC-11 — PCR dương tính mở sự cố · Maps to: NV5 · Test: integration
- **Given** lô đang ương L-100
- **When** U3 chốt phiếu PCR có AHPND dương tính cho L-100
- **Then** một sự cố được mở cho trưởng trại của L-100
- **Assert** count(incidents status="open", lot="L-100", cause="pcr_positive") == 1

### AC-12 — Chặn thu hoạch khi không có PCR âm tính hợp lệ · Maps to: NV6 · Test: e2e
- **Given** lô L-100 có phiếu PCR âm tính chốt cách đây 5 ngày (giới hạn 3 ngày)
- **When** U2 thu hoạch L-100
- **Then** thao tác bị từ chối, không có lô thành phẩm nào được tạo
- **Assert** error == "pcr_expired" · count(finished_lots từ L-100) == 0

### AC-13 — Thu hoạch tạo lô thành phẩm có QR và giải phóng bể · Maps to: NV6 · Test: e2e
- **Given** lô L-101 thả 1.000.000, có PCR âm tính chốt hôm qua
- **When** U2 thu hoạch với số đếm 650.000
- **Then** một lô thành phẩm có mã QR duy nhất được tạo, tỷ lệ sống ghi 65%, bể về trạng thái chờ vệ sinh
- **Assert** count(finished_lots từ L-101) == 1 · qr_code duy nhất · survival_rate == 0.65 · tank.status == "empty_cleaning" · lot.status == "harvested"

### AC-14 — Truy xuất QR đủ chuỗi · Maps to: NV13 · Test: e2e
- **Given** lô thành phẩm từ AC-13
- **When** U5 tra mã QR của lô
- **Then** kết quả trả về đủ 5 mắt xích: lô thành phẩm, lô ương, mẻ Nauplius, đàn bố mẹ, phiếu PCR, kèm danh sách vật tư đã dùng
- **Assert** count(trace.links) == 5 · trace.materials không rỗng (count >= 1)

### AC-15 — Vật tư cấm không thể nhập kho · Maps to: NV8 · Test: integration
- **Given** vật tư "Kháng sinh K" gắn cờ cấm dùng
- **When** U4 tạo phiếu nhập có vật tư này
- **Then** phiếu bị từ chối, tồn kho không đổi
- **Assert** error == "banned_material" · stock(kho tổng, K) == 0

### AC-16 — Cấp phát theo hạn dùng gần nhất · Maps to: NV9 · Test: unit
- **Given** kho tổng có thức ăn X: lô A 20 kg hạn 01/12, lô B 30 kg hạn 15/12; yêu cầu 25 kg
- **When** U4 cấp phát đủ yêu cầu
- **Then** xuất hết lô A và 5 kg lô B, kho trại tăng 25 kg
- **Assert** issued(A) == 20 · issued(B) == 5 · stock(trại, X) tăng == 25 · request.status == "fulfilled"

### AC-17 — Tiêu hao vượt tồn trại ghi âm kho chờ xử lý · Maps to: NV10 · Test: integration
- **Given** kho trại có 1 kg thức ăn X
- **When** nhật ký cho ăn 3 kg X được đồng bộ
- **Then** nhật ký vẫn được lưu, phát sinh bản ghi âm kho và thông báo cho trưởng trại và thủ kho
- **Assert** count(feed_logs mới) == 1 · stock(trại, X) == -2 · count(alerts type="negative_stock") == 1 với 2 người nhận

### AC-18 — Kiểm kê lệch lớn cần duyệt mới điều chỉnh · Maps to: NV11 · Test: integration
- **Given** sổ ghi 100 kg thức ăn X tại trại T1
- **When** U4 nhập số đếm thực 95 kg (lệch 5%)
- **Then** biên bản ở trạng thái chờ duyệt, tồn sổ chưa thay đổi; sau khi U2 duyệt thì tồn sổ = 95
- **Assert** trước duyệt: count.status == "pending_approval" và stock == 100 · sau duyệt: stock == 95 và count(stock_transactions type="adjustment") == 1

### AC-19 — Tổng quan BGĐ khớp dữ liệu nguồn · Maps to: NV12 · Test: integration
- **Given** 3 lô đang ương với số ước lượng 1.000.000, 2.000.000, 500.000 ở 2 trại
- **When** U5 xem tổng quan toàn khu
- **Then** tổng PL ước lượng và số lô đang ương đúng với dữ liệu nguồn
- **Assert** summary.active_lots == 3 · summary.estimated_pl == 3500000

### AC-20 — Giao diện chuyển ngôn ngữ giữ nguyên dữ liệu · Maps to: NV12 · Test: e2e
- **Given** U5 đang xem tổng quan ở tiếng Việt
- **When** chuyển sang tiếng Anh
- **Then** nhãn hiển thị bằng tiếng Anh, số liệu không đổi
- **Assert** locale == "en" · summary.estimated_pl không đổi (== giá trị trước khi chuyển)

### AC-21 — Kế hoạch chỉ thành mốc sau khi BGĐ duyệt · Maps to: NV14 · Test: integration
- **Given** U2 trại T4 gửi kế hoạch tháng 12 gồm 10 lô, tổng thu dự kiến 120.000.000 PL
- **When** U5 duyệt kế hoạch
- **Then** kế hoạch chuyển "đã duyệt" và mốc kế hoạch tháng của T4 bằng tổng dự kiến
- **Assert** plan.status == "approved" · plan_target(T4, 2026-12) == 120000000 · trước khi duyệt plan_target == null

### AC-22 — Tổng quan xếp hạng trại theo % đạt kế hoạch · Maps to: NV12 · Test: integration
- **Given** ngày 10/11, mốc kế hoạch tới hôm nay: T2 = 40 tr, T7 = 50 tr; thu thực: T2 = 30 tr, T7 = 10 tr
- **When** U5 xem tổng quan
- **Then** T7 đứng trước T2 trong xếp hạng tăng dần % đạt, với % đạt đúng
- **Assert** ranking[0].farm == "T7" và pct == 20 · ranking[1].farm == "T2" và pct == 75

### AC-23 — Sinh việc hằng ngày theo lịch giai đoạn, không trùng · Maps to: NV15 · Test: unit
- **Given** lịch mẫu Mysis: cho ăn 6 lần/ngày, đo nước 2 lần/ngày; lô L-100 ở Mysis
- **When** S1 chạy sinh việc 2 lần trong cùng ngày
- **Then** L-100 có đúng 8 việc trong ngày
- **Assert** count(tasks lô L-100, ngày) == 8

### AC-24 — Việc đột xuất đến đúng công nhân · Maps to: NV15 · Test: e2e
- **Given** bể G04-B12 giao cho U1 "Trần Thị B"
- **When** U2 thêm việc "Đo lại pH" cho G04-B12 lúc 08:30
- **Then** việc xuất hiện trong danh sách hôm nay của Trần Thị B và không xuất hiện cho công nhân khác
- **Assert** count(tasks hôm nay của Trần Thị B, title="Đo lại pH") == 1 · count(cho công nhân khác) == 0

### AC-25 — Khu–ao–bể khai đúng đo đạc theo loại · Maps to: NV0a · Test: integration
- **Given** loại đơn vị "ao thương phẩm" yêu cầu diện tích m²; loại "bể ấu trùng" yêu cầu thể tích m³
- **When** U8 tạo ao AO-01 không có diện tích, rồi tạo lại AO-01 với 5.000 m²
- **Then** lần đầu bị từ chối, lần hai được lưu
- **Assert** lần 1: error == "invalid_input" · sau lần 2: count(đơn vị code="AO-01") == 1 · area_m2 == 5000

### AC-26 — Mã trùng bị từ chối ở mọi trang khai báo · Maps to: NV0a, NV0c, NV0d · Test: integration
- **Given** nhà cung cấp mã "NCC-01" đã có
- **When** U4 thêm nhà cung cấp khác với mã "ncc-01"
- **Then** thao tác bị từ chối, không tạo bản ghi
- **Assert** error == "duplicate_code" · count(nhà cung cấp, mã không phân biệt hoa thường = "NCC-01") == 1

### AC-27 — Mục đang được dùng chỉ ngừng sử dụng, không xoá · Maps to: NV0c · Test: integration
- **Given** vật tư X có 1 phiếu nhập đã chốt
- **When** U4 xoá X, rồi ngừng sử dụng X
- **Then** xoá bị từ chối; sau khi ngừng, X không có trong lựa chọn của phiếu nhập mới nhưng phiếu cũ và truy xuất vẫn thấy X
- **Assert** xoá: error == "in_use" · material.active == false · count(X trong lựa chọn phiếu nhập mới) == 0 · count(phiếu nhập cũ tham chiếu X) == 1

### AC-28 — Quyền khai báo theo phòng ban · Maps to: NV0 · Test: e2e (role matrix)
- **Given** U8 (Kỹ thuật) và U7 (R&D) đã đăng nhập; bể B-03 thể tích 20 m³
- **When** U8 sửa ngưỡng pH (thuộc R&D); U8 sửa thể tích B-03 thành 25 m³ (thuộc Kỹ thuật); U7 sửa thể tích B-03 thành 30 m³
- **Then** chỉ thao tác đúng nhóm được chấp nhận
- **Assert** U8 sửa ngưỡng: status == 403 · U8 sửa B-03: status == 200 · U7 sửa B-03: status == 403 · B-03.volume_m3 == 25 · count(nhật ký thay đổi của B-03) == 1

### AC-29 — Sửa ngưỡng tạo bản nháp, chỉ hiệu lực sau duyệt · Maps to: NV0e · Test: integration
- **Given** ngưỡng pH tôm thẻ Mysis đã duyệt 7,5–8,5
- **When** U7 sửa thành 7,8–8,3 và gửi duyệt; U1 ghi pH 7,6 vào bể Mysis; sau đó U5 duyệt và U1 ghi pH 7,6 vào lô mở sau ngày hiệu lực
- **Then** trước duyệt không có cảnh báo; sau duyệt có đúng 1 cảnh báo
- **Assert** trước duyệt: ngưỡng hiệu lực == [7,5; 8,5] · count(alerts "water_out_of_range") == 0 · sau duyệt: ngưỡng hiệu lực == [7,8; 8,3] · count(alerts "water_out_of_range") == 1

### AC-30 — Thêm bệnh bắt buộc áp dụng ngay cho lô đang chạy · Maps to: NV0d · Test: integration
- **Given** loài tôm thẻ bắt buộc 5 bệnh; lô L-100 có phiếu PCR âm tính chốt hôm qua cho đủ 5 bệnh
- **When** U9 thêm bệnh "NHPV" vào danh sách bắt buộc, U5 duyệt, rồi U2 thu hoạch L-100
- **Then** thu hoạch bị từ chối vì thiếu kết quả NHPV
- **Assert** error == "pcr_missing_disease" · detail.disease == "NHPV" · count(finished_lots từ L-100) == 0

### AC-31 — Bể chờ vệ sinh không nhận lô mới · Maps to: NV3 · Test: integration
- **Given** bể B-05 ở trạng thái "chờ vệ sinh"
- **When** U2 mở lô mới vào B-05
- **Then** thao tác bị từ chối
- **Assert** error == "tank_not_ready" · count(lots status="rearing" và tank="B-05") == 0

### AC-32 — Không chuyển lô từ khu bẩn sang khu sạch · Maps to: NV0d · Test: integration
- **Given** khu K-BAN mức an toàn 1 và K-SACH mức 3 (đã duyệt); lô L-200 ở bể thuộc K-BAN
- **When** U2 chuyển L-200 sang bể thuộc K-SACH
- **Then** thao tác bị từ chối, lô vẫn ở bể cũ
- **Assert** error == "zone_level_blocked" · lot(L-200).tank == bể cũ · count(chuyển bể mới của L-200) == 0

### AC-33 — Bước quy trình có điểm kiểm soát thiếu bằng chứng bị chặn · Maps to: NV0b · Test: integration
- **Given** quy trình tôm thẻ có bước "Chuyển sang ương PL" yêu cầu phiếu PCR âm tính chốt trong 3 ngày; lô L-300 chưa có phiếu nào
- **When** U2 hoàn tất bước này cho L-300
- **Then** thao tác bị từ chối, bước giữ trạng thái chưa hoàn tất
- **Assert** error == "control_point_unmet" · detail.evidence == "pcr_negative" · step.status == "pending"

### AC-34 — Nới lỏng quy trình chỉ áp cho lô mở sau · Maps to: NV0e · Test: integration
- **Given** quy trình P phiên bản 1 đã duyệt; lô L-400 đã mở theo phiên bản 1
- **When** U7 bỏ một bước kiểm trong P thành phiên bản 2, U5 duyệt, rồi U2 mở lô L-401
- **Then** L-400 vẫn theo phiên bản 1, L-401 theo phiên bản 2, phiên bản 1 được giữ
- **Assert** lot(L-400).process_version == 1 · lot(L-401).process_version == 2 · count(phiên bản của P) == 2

### AC-35 — Tần suất đo theo từng chỉ tiêu · Maps to: NV0b, NV15 · Test: unit
- **Given** chỉ tiêu độ mặn khai "1 lần/tuần" và pH khai "1 lần/ngày" cho loại đơn vị nuôi của lô L-100
- **When** S1 sinh việc cho 7 ngày liên tiếp
- **Then** L-100 có đúng 1 việc đo độ mặn và 7 việc đo pH
- **Assert** count(tasks L-100, param="salinity", 7 ngày) == 1 · count(tasks L-100, param="ph", 7 ngày) == 7

### AC-36 — Loài chưa cấu hình không mở được lô · Maps to: NV0b, NV3 · Test: integration
- **Given** loài "Ốc hương" mới thêm, chưa có giai đoạn nào
- **When** U2 mở lô cho loài này
- **Then** thao tác bị từ chối
- **Assert** error == "species_not_configured" · count(lots của loài này) == 0

### AC-37 — Tổng quan Khai báo chỉ ra mục còn thiếu · Maps to: NV0 · Test: e2e
- **Given** hệ thống đã có 2 cơ sở và chưa có kho nào
- **When** U6 mở trang Tổng quan Khai báo
- **Then** mục Cơ sở báo đủ, mục Kho báo thiếu
- **Assert** completeness.sites: count == 2 và status == "ok" · completeness.warehouses: count == 0 và status == "missing"

### AC-38 — Tạo lệnh tự động từ kế hoạch không trùng · Maps to: NV16 · Test: integration
- **Given** kế hoạch tháng 12 trại T4 "đã duyệt" có 2 lô dự kiến; quy trình tôm thẻ đã duyệt có 3 bước (thả, chuyển PL, thu hoạch)
- **When** U2 dùng "Tạo lệnh sản xuất tự động" 2 lần liên tiếp
- **Then** có đúng 6 lệnh, tất cả ở trạng thái đang lập
- **Assert** sau lần 1: count(lệnh của kế hoạch) == 6 và mọi status == "drafting" · sau lần 2: count == 6

### AC-39 — Kế hoạch chưa duyệt không tạo được lệnh · Maps to: NV16 · Test: integration
- **Given** kế hoạch tháng 12 trại T4 đang "chờ duyệt"
- **When** U2 dùng "Tạo lệnh sản xuất tự động"
- **Then** thao tác bị từ chối
- **Assert** error == "plan_not_approved" · count(lệnh của kế hoạch) == 0

### AC-40 — Duyệt nhiều cấp với điều kiện bỏ qua · Maps to: NV16, NV0f · Test: integration
- **Given** nghiệp vụ "Lệnh sản xuất": cấp 1 Nguyễn Văn A, cấp 2 Trần Văn B; điều kiện: lệnh trong kế hoạch đã duyệt bỏ qua cấp 2
- **When** U2 gửi lệnh L1 (trong kế hoạch) và L2 (ngoài kế hoạch); A duyệt cả hai
- **Then** L1 đã duyệt; L2 chờ cấp 2
- **Assert** L1.status == "approved" · L2.status == "pending_approval" và L2.current_level == 2

### AC-41 — Chỉ người chính hoặc người thay của cấp mới duyệt được · Maps to: NV0f · Test: e2e
- **Given** cấp 1 của "Lệnh sản xuất": chính Nguyễn Văn A, thay Lê Thị C; lệnh L3 chờ cấp 1, do Phạm Văn D tạo
- **When** D duyệt L3; rồi C duyệt L3
- **Then** D bị từ chối; C duyệt thành công
- **Assert** lần D: status == 403 · lần C: status == 200 · count(lượt duyệt của L3) == 1 và approver == C

### AC-42 — Duyệt lệnh tạo yêu cầu cấp theo định mức · Maps to: NV16 · Test: integration
- **Given** định mức giai đoạn Zoea: thức ăn X 0,2 kg / triệu con / ngày; lệnh bước Zoea của L-100: 2.000.000 con, 3 ngày, trại T4
- **When** lệnh được duyệt ở cấp cuối
- **Then** một yêu cầu cấp chờ cấp được tạo cho kho trại T4, gắn lệnh
- **Assert** count(requests status="pending", order=lệnh) == 1 · qty(X) == 1,2

### AC-43 — Lệnh đã duyệt sinh việc cho công nhân của bể · Maps to: NV16 · Test: integration
- **Given** lệnh "Chuyển L-100 sang PL" ngày 20/12 đã duyệt; lệnh bước trước của L-100 đã hoàn thành; bể B-03 giao cho Trần Thị B
- **When** S1 sinh việc ngày 20/12
- **Then** Trần Thị B có 1 việc gắn lệnh; công nhân khác không có
- **Assert** count(tasks order=lệnh, assignee="Trần Thị B") == 1 · count(tasks order=lệnh, assignee khác) == 0

### AC-44 — Lệnh bước sau chưa thực hiện khi bước trước chưa xong · Maps to: NV16 · Test: integration
- **Given** lệnh bước "thả" của L-100 ở trạng thái đang thực hiện; lệnh bước "chuyển PL" đã duyệt
- **When** S1 sinh việc ngày dự kiến của bước "chuyển PL"
- **Then** không có việc nào của bước "chuyển PL"
- **Assert** lệnh chuyển PL status == "approved" (không phải "in_progress") · count(tasks order=lệnh chuyển PL) == 0

### AC-45 — Hoàn thành lệnh lệch lớn cần lý do · Maps to: NV16 · Test: integration
- **Given** lệnh thu hoạch L-101 dự kiến 700.000 con; ngưỡng lệch 10%; PCR âm còn hiệu lực
- **When** U2 xác nhận số thực 600.000 không ghi lý do; rồi xác nhận lại kèm lý do
- **Then** lần đầu bị từ chối; lần hai lệnh hoàn thành
- **Assert** lần 1: error == "deviation_reason_required" và status != "done" · lần 2: status == "done" · actual_qty == 600000

### AC-46 — Huỷ lệnh huỷ phần chưa cấp của yêu cầu cấp · Maps to: NV16 · Test: integration
- **Given** lệnh đã duyệt, chưa thực hiện; yêu cầu cấp 1,2 kg X đã cấp 0,5 kg
- **When** U2 huỷ lệnh kèm lý do
- **Then** lệnh huỷ; phần 0,7 kg còn lại không còn chờ cấp; 0,5 kg đã cấp vẫn ở kho trại
- **Assert** order.status == "cancelled" · count(requests pending của lệnh) == 0 · stock(trại, X) tăng == 0,5 (không đổi)

### AC-47 — Lệnh đang thực hiện không huỷ được · Maps to: NV16 · Test: integration
- **Given** lệnh "đang thực hiện"
- **When** U2 huỷ lệnh
- **Then** thao tác bị từ chối; lệnh chỉ "đóng" được kèm lý do
- **Assert** error == "order_in_progress" · order.status == "in_progress"

### AC-48 — Sửa lệnh đã duyệt quay lại duyệt · Maps to: NV16 · Test: integration
- **Given** lệnh đã duyệt có yêu cầu cấp 1,2 kg X chưa cấp
- **When** U2 sửa số lượng của lệnh
- **Then** lệnh về chờ duyệt từ cấp 1; yêu cầu cấp cũ bị huỷ
- **Assert** order.status == "pending_approval" và current_level == 1 · count(requests pending của lệnh) == 0

### AC-49 — Mã chứng từ theo quy tắc, không tái sử dụng · Maps to: NV0f · Test: unit
- **Given** quy tắc đánh số lệnh "LSX-{YYMM}-{####}"; mã lớn nhất tháng 12/2026 là LSX-2612-0007
- **When** tạo một lệnh, huỷ nó, rồi tạo thêm một lệnh
- **Then** hai lệnh nhận hai mã liên tiếp, mã đã huỷ không dùng lại
- **Assert** mã 1 == "LSX-2612-0008" · mã 2 == "LSX-2612-0009"

### AC-50 — Không ngừng được người duyệt duy nhất còn hoạt động · Maps to: NV0f · Test: integration
- **Given** cấp 1 của "Khai báo cần duyệt": chính Nguyễn Văn A, chưa có người thay
- **When** U6 ngừng nhân viên A
- **Then** thao tác bị từ chối cho tới khi cấp 1 có người hoạt động khác
- **Assert** error == "sole_approver" · employee(A).active == true

### AC-51 — Sửa quy trình duyệt chỉ áp chứng từ gửi sau · Maps to: NV0f · Test: integration
- **Given** lệnh L4 đang chờ cấp 1 (1 cấp); nghiệp vụ "Lệnh sản xuất" được sửa thành 2 cấp
- **When** người duyệt cấp 1 duyệt L4; U2 gửi lệnh L5 mới, cấp 1 duyệt L5
- **Then** L4 đã duyệt sau 1 cấp; L5 chờ cấp 2
- **Assert** L4.status == "approved" · L5.status == "pending_approval" và L5.current_level == 2

### AC-52 — Mỗi nhân viên tối đa một tài khoản · Maps to: NV0f · Test: integration
- **Given** nhân viên NV-120 đã có tài khoản đăng nhập
- **When** U6 tạo thêm một tài khoản cho NV-120
- **Then** thao tác bị từ chối
- **Assert** error == "account_exists" · count(tài khoản của NV-120) == 1

## 11. Assumptions / Open questions
- **Assumptions**:
  - Quy trình theo chuẩn ngành trại giống tôm thẻ (chưa có SOP Đắc Lộc); chuỗi giai đoạn, ngưỡng nước, danh sách bệnh PCR là cấu hình, giá trị mặc định do chuyên gia trại điền lúc NV0.
  - Hiệu lực PCR trước thu hoạch mặc định 3 ngày; ngưỡng leo thang 2h; lệch kiểm kê 2% — đều cấu hình được.
  - Số PL trong bể là ước lượng (lấy mẫu đếm); số thu hoạch là số đếm thực.
  - Giá vốn kho: bình quân gia quyền; xuất FEFO theo hạn dùng.
  - Đơn mua hàng NCC chưa có trong MVP; phiếu nhập là chứng từ gốc.
  - Số thu dự kiến trong kế hoạch = số thả × tỷ lệ sống chuẩn (cấu hình theo loài, mặc định 60% cho tôm thẻ tới PL12).
  - Lịch mẫu cho ăn / đo nước theo loài×giai đoạn do chuyên gia trại điền ở NV0.
  - Lô Green House được xử lý như một lô ương ở giai đoạn PL tiếp theo, kế thừa nguồn gốc.
  - (v4, 2026-11-13) Phân quyền khai báo theo phòng ban: user chốt nguyên tắc "theo phòng ban"; việc gán từng trang cho từng vai trò (bảng ở Flow NV0) là đề xuất mặc định, chưa được xác nhận từng dòng. Chỉ tiêu/tần suất và lịch mẫu giao U7; đơn vị tính giao U4.
  - Người duyệt khai báo là U5 (BGĐ); nhóm cần duyệt gồm ngưỡng, quy trình, bệnh và xét nghiệm, khu sạch–bẩn, khử trùng, bỏ cờ cấm. Chưa xác nhận ai duyệt; thiên về chặn: chưa duyệt thì bản cũ vẫn hiệu lực.
  - Thay đổi chặt hơn áp dụng ngay cho mọi lô sau khi duyệt, nới lỏng chỉ áp cho lô mở sau (R13); đặt cờ cấm có hiệu lực ngay. Đây là mặc định an toàn theo ưu tiên ATSH, chờ Đắc Lộc xác nhận.
  - Ba ca chặn thật cho ATSH ở demo: bể chờ vệ sinh không nhận lô (R16), không chuyển lô từ khu mức thấp lên mức cao (R17), điểm kiểm soát trong quy trình (R18). Do dự án chọn, chưa qua SOP Đắc Lộc. Mức an toàn của khu là thang thứ tự 1 (thấp) → n (cao).
  - Mọi khai báo ghi nhật ký thay đổi (ai, gì, lúc nào) — mặc định an toàn, cũng là hồ sơ GlobalGAP.
  - Loài mẫu thêm vào dữ liệu khai báo: ốc hương (giả định, chưa xác nhận), tôm sú, tôm hùm bông, tôm hùm xanh; loài "Tôm hùm" cũ giữ nếu còn lô tham chiếu (R14). Chuỗi giai đoạn, ngưỡng, lịch của loài mới là dữ liệu mẫu giả định, không dùng làm AC.
  - Trạng thái "chờ vệ sinh" ở AC-31 và R16 chính là `cleaning` trong schema (AC-13 viết `empty_cleaning`); luồng đưa bể về trống sau vệ sinh viết ở NV17 khi có SOP.
  - Hệ thống nuôi, nguồn nước và vị trí trên sơ đồ khu chỉ là thuộc tính khai báo; cách hiển thị sơ đồ thuộc design-spec.
  - Định mức vật tư theo giai đoạn: dùng để tính yêu cầu cấp của lệnh (NV16, AC-42); cảnh báo tiêu hao thực vượt định mức chưa có hành vi.
  - (v5) Ba trang Phòng ban & chức vụ, Nhân viên, Khai báo nghiệp vụ do U6 soạn. Thời hạn nhắc duyệt giữ cố định (24h lệnh, 3 ngày kế hoạch/khai báo) vì user không chọn cấu hình thời hạn.
  - (v5) Người tạo không tự duyệt chứng từ của mình (R21) và ngưỡng lệch hoàn thành lệnh mặc định 10% (R26): mặc định an toàn, chưa được xác nhận.
  - (v5) Các duyệt cố định hiện có (kế hoạch NV14 → U5, kiểm kê lệch NV11 → U2) trở thành nghiệp vụ trong Khai báo nghiệp vụ với cấu hình mặc định bằng hành vi hiện tại, nên AC-18, AC-21 không đổi.
  - (v5) Lệnh "đang lập" là trạng thái đầu (user chọn tên này thay cho "nháp").
  - Chưa có trường mã kế toán Vietsun (user chọn "chưa làm").
- **Open (RED — chờ user)**: không có.
- **Open (chờ Đắc Lộc xác nhận, không chặn MVP)** — theo họp 2026-11, chi tiết [research 02](../research/02-hop-dac-loc-2026-11.md):
  - An toàn sinh học là ưu tiên 1: đề xuất NV17 vệ sinh–khử trùng bể (đóng vòng "chờ vệ sinh" → trống), NV18 truy vết và phong toả khi dương tính, NV19 ra vào khu an toàn sinh học; chưa viết AC vì cần SOP thật (Q1). (Đánh số lại so với research 02 vì NV16 dành cho lệnh sản xuất.) Phần khai báo của chúng (khu sạch–bẩn, khử trùng) đã nằm ở NV0d.
  - Handoff cho design-spec: 21 màn khai báo + màn Lệnh sản xuất (danh sách ở [research 03](../research/03-trang-khai-bao.md)); chưa thêm vào design-spec 12.
  - Tần suất ghi theo từng chỉ tiêu: độ mặn + thay nước hằng tuần, còn lại hằng ngày; cần loại ghi "thay nước" ở NV4 và sửa lịch mẫu AC-23 (Q3).
  - Kế toán Vietsun: phạm vi trao đổi dữ liệu (Q2). Ốc giống và cá giống: loài, giai đoạn (Q4). Tăng trưởng/FCR (Q8). Quản lý thiết bị/bảo trì (Q6).

## History
- v1 (2026-11-07): khởi tạo — MVP Sản xuất giống + Kho, 14 nghiệp vụ, 20 AC.
- v2 (2026-11-07): thêm NV14 kế hoạch sản xuất (trưởng trại lập, BGĐ duyệt) và NV15 việc hằng ngày (tự sinh + đột xuất) theo quyết định UI vòng 2 (docs/research/01); AC-21..24.
- v3 (2026-11-13): ghi nhận họp Đắc Lộc — cập nhật phạm vi OUT (Vietsun, ốc giống, IoT) và danh sách Open; chưa đổi NV/AC.
- v4 (2026-11-13): tách NV0 thành NV0a–NV0e (18 trang khai báo cho 4 mảng, quyền theo phòng ban, bản nháp + duyệt cho nhóm ATSH); thêm U7–U9, H12, R13–R20, AC-25..37; NV16 Lệnh sản xuất ghi ở Open. AC-1..24 và AC-23 không đổi.
- v5 (2026-11-13): viết NV16 Lệnh sản xuất (lô × bước quy trình, tạo tự động từ kế hoạch ở trạng thái "đang lập", duyệt theo nghiệp vụ, sinh việc + yêu cầu cấp theo định mức); thêm NV0f (phòng ban & chức vụ, nhân viên, khai báo nghiệp vụ với cấp duyệt theo nhân viên cụ thể + người thay, điều kiện, đánh số); H13–H14, R21–R27, AC-38..52. Trang khai báo: 21.

**Last Updated**: 2026-11-13

<!-- re-verified: 2026-11-13 18:10 - v5 thêm NV16, NV0f, AC-38..52 theo trả lời của user; chưa có code, AC-1..24 không đổi -->
<!-- re-verified: 2026-11-15 20:00 - chỉ đổi giao diện (ADR 0003): không đổi server, server action, quy tắc nghiệp vụ hay AC; S6 tìm/sắp xếp phía trình duyệt không đổi dữ liệu trả về -->
<!-- re-verified: 2026-11-15 20:15 - giai đoạn 2 Astryx chỉ đổi giao diện form/bảng; server action, quy tắc nghiệp vụ, AC không đổi; ô tìm bảng lọc phía trình duyệt, không đổi dữ liệu trả về -->
