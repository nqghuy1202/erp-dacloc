# 11 — ba-spec: MVP Sản xuất giống + Kho (Đắc Lộc)

> Load khi: task chạm hành vi / nghiệp vụ / flow / acceptance của sản xuất giống (bố mẹ → PL), nhật ký bể, xét nghiệm, lô thành phẩm, truy xuất QR, kho vật tư.
covers: src/server, src/app/(office), src/app/hien-truong, src/app/api
last_verified: 2026-11-07
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
| S1 Hệ thống (system-actor) | trừ kho theo nhật ký, sinh cảnh báo ngưỡng, đồng bộ dữ liệu offline | — | nền |

> Đại lý/hộ nuôi, sale, kế toán, nhân sự: ngoài MVP (§7).

## 3. User × Nghiệp vụ
| # | Nghiệp vụ | Owner-user | Cross | Phụ thuộc NV | Tần suất | Ưu tiên |
|---|---|---|---|---|---|---|
| NV0 | Thiết lập danh mục (trại, bể, loài, giai đoạn, ngưỡng nước, vật tư, quyền theo trại) | U6 | U2 | — | thấp | Must |
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

## 5. Flows

### Flow NV0 — Thiết lập danh mục · owner: U6
- **Start**: hệ thống mới / có trại, bể, vật tư mới
- **Input**: danh sách trại, bể (mã, thể tích, loại bể), loài + chuỗi giai đoạn (tôm thẻ: N→Z1-3→M1-3→PL1…PLn; cá chẽm, tôm hùm cấu hình riêng), ngưỡng chỉ số nước theo loài×giai đoạn, danh mục vật tư (đơn vị, nhóm, cờ "cấm dùng"), người dùng + vai trò + trại được phép; hoặc file Excel import
- **Steps**: nhập/import → hệ thống kiểm trùng mã + bắt buộc → lưu
- **Output**: danh mục hiệu lực; dòng import lỗi trả về kèm lý do, dòng hợp lệ vẫn lưu
- **End**: danh mục dùng được cho NV1–NV11

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

## 7. Scope & Priority
- **IN (MVP)**: NV0–NV15; loài: tôm thẻ chân trắng đầy đủ; cá chẽm, tôm hùm qua cấu hình giai đoạn (cùng flow); song ngữ Việt/Anh; offline cho NV4; phân quyền theo trại + vai trò; cảnh báo trong app; import Excel danh mục + tồn đầu kỳ.
- **OUT (phase sau)**: bán hàng/đặt giống, cổng đại lý-hộ nuôi, công nợ, kế toán đầy đủ, nhân sự-lương, nuôi thương phẩm/thu mua, kết nối IoT (chỉ chừa điểm nhận dữ liệu), Zalo/SMS, đơn mua hàng NCC (MVP chỉ ghi phiếu nhập).

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
- **Open (RED — chờ user)**: không có.

## History
- v1 (2026-11-07): khởi tạo — MVP Sản xuất giống + Kho, 14 nghiệp vụ, 20 AC.
- v2 (2026-11-07): thêm NV14 kế hoạch sản xuất (trưởng trại lập, BGĐ duyệt) và NV15 việc hằng ngày (tự sinh + đột xuất) theo quyết định UI vòng 2 (docs/research/01); AC-21..24.

**Last Updated**: 2026-11-07
