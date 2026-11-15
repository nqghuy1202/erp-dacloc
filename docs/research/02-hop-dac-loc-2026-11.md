---
title: Họp Đắc Lộc — ghi nhận, đối chiếu với spec, việc tiếp theo
status: draft (chờ Đắc Lộc xác nhận 10 câu hỏi ở §5)
last_verified: 2026-11-13
ttl_days: 30
---

> Nguồn: ghi chú cuộc họp giữa nhóm dự án và Đắc Lộc (bản gốc nguyên văn ở Phụ lục). Ngày họp chưa được ghi; tài liệu này được nhập vào dự án ngày 2026-11-13. Đối chiếu với [ba-spec 11](../app-map/11-ba-spec-mvp-san-xuat-kho.md) và [discovery 00](00-discovery-dac-loc.md). Phần kiến thức ngành ở §4 chỉ là tra cứu công khai, chưa phải xác nhận của Đắc Lộc.

# 1. Tóm tắt 6 điều quan trọng nhất

1. **An toàn dịch bệnh / an toàn sinh học là ưu tiên số 1**, trước cả quản trị ("cái đó mới quan trọng"). Spec hiện chặn đúng ở đàn bố mẹ, PCR trước thu hoạch và vật tư cấm, nhưng chưa có vệ sinh bể, kiểm soát ra vào và truy vết khi dương tính (§3, T1).
2. **Đắc Lộc đang dùng kế toán Vietsun + Excel.** Quyết định cũ "kế toán đầy đủ trong ERP" (discovery §5) cần xem lại: nhiều khả năng ERP phải trao đổi dữ liệu với Vietsun chứ không thay thế (§3, L1).
3. **Ghi nhật ký hằng ngày, riêng độ mặn và thay nước hằng tuần.** Spec chưa có sự kiện "thay nước" và đang giả định đo nước 2 lần/ngày cho mọi chỉ tiêu (§3, L3).
4. **Phạm vi rộng hơn spec đang có:** ngoài tôm giống còn cá giống, **ốc giống**, nuôi tôm thương phẩm, tôm hùm; cửa hàng thức ăn, trạm thu mua ở Phú Lạc, vận tải (§3, L2, T5).
5. **Cần tự động hoá và quan trắc môi trường**, thiết bị phải bền trong môi trường biển mặn. Hiện IoT đang ở "phase sau" (§3, L4, T3).
6. **Khách muốn một hệ thống/quy trình chuẩn để định hình tổ chức** ("hệ thống hỏng là không quản trị được") — đầu ra gồm cả quy trình chuẩn (SOP), không chỉ phần mềm (§3, T6, T7).

# 2. Ghi nhận chuẩn hoá theo chủ đề

| Chủ đề | Điều đã nói | Tác động lên dự án |
|---|---|---|
| Hiện trạng công cụ | Dùng Excel; kế toán Vietsun | Import Excel đã có (NV0); cần định dạng xuất/nhập của Vietsun (Q2) |
| Môi trường | Vùng biển, độ mặn cao; thiết bị phải bền, nhắc 3 lần | Ràng buộc phần cứng cho điện thoại hiện trường và cảm biến (T3) |
| Mục tiêu hệ thống | Hệ thống quản trị doanh nghiệp giống và nuôi trồng thuỷ sản; cuối cùng các bên đều hiệu quả về tài chính | Chỉ số tài chính theo mảng cần chốt với BGĐ (Q9) |
| Ghi chép | Ghi nhật ký hằng ngày. Độ mặn + thay nước hằng tuần, thông tin khác hằng ngày | NV4 và lịch mẫu NV15 theo từng chỉ tiêu (L3) |
| Quy trình | Muốn quy trình công nghệ dễ làm, chuẩn, để định hình tổ chức; hệ thống hỏng là không quản trị được | SOP chuẩn hoá + độ tin cậy hệ thống (T6, T7) |
| An toàn | An toàn dịch bệnh, an toàn sinh học là quan trọng nhất; đặt lên hàng đầu khi ứng dụng vào tổ chức | Nâng ưu tiên cụm biosecurity (T1) |
| Kiểm soát | Cần đảm bảo, quản lý hệ thống sản xuất; "nhập vào cái gì, ra cái gì" | Cân bằng vật chất (mass balance) theo lô, đã có NV13 + chi phí lô |
| Tổ chức | Trụ sở chính 35 Nguyễn Đình Chiểu; chi nhánh đa phần là kỹ thuật; 3 khu văn phòng, sản xuất | Người dùng văn phòng ở trụ sở, kỹ thuật ở khu sản xuất (T4); nội dung "3 khu" cần hỏi lại (Q7) |
| Quy mô | 50 ha: tôm giống, cá giống, ốc giống, nuôi tôm thương phẩm, tôm hùm | Thêm ốc giống (L2) |
| Kinh doanh | Cửa hàng thức ăn…; trạm thu mua ở Phú Lạc; vận tải | Ngoài MVP; cập nhật discovery (T5) |
| Chứng nhận | GlobalGAP từ 2013 | Hồ sơ nhật ký/truy xuất là bằng chứng đánh giá (§4) |
| Tự động hoá | Cần quan trắc môi trường, phần mềm quản lý tự động hoá | Mở lại quyết định IoT (L4, Q5) |
| Việc của nhóm dự án | Tìm hiểu lại chuyên môn, hỏi người trong ngành, chuẩn bị kiến thức, chuẩn bị dữ liệu input / output / tăng trưởng | Xem §6 |

# 3. Đối chiếu với spec hiện có

**Khớp (không cần đổi):** nhật ký hằng ngày (NV4) · truy xuất và chi phí theo lô (NV6, NV10, NV13) · hồ sơ GlobalGAP làm tay → số hoá · nhập tay trước, chừa cổng cảm biến · Excel là hiện trạng (import ở NV0).

**Lệch — cần xác nhận rồi mới đổi spec:**

| ID | Spec đang nói | Họp nói | Đề xuất mặc định (an toàn) |
|---|---|---|---|
| L1 | Discovery §5: "Kế toán: đầy đủ trong ERP (sổ cái, BCTC, hoá đơn điện tử)" | Đang dùng kế toán Vietsun | MVP không đụng kế toán. Phase sau: ERP **xuất** dữ liệu (nhập kho, giá vốn, xuất bán, công nợ) để Vietsun nhập, không thay thế. Chờ Q2 |
| L2 | IN: tôm thẻ đầy đủ; cá chẽm, tôm hùm qua cấu hình giai đoạn | Thêm **ốc giống**; "cá giống" chưa rõ loài | Chuỗi giai đoạn cấu hình được nên có thể chứa, nhưng NV2 (Nauplius, cho đẻ) là của tôm. Chờ Q4 |
| L3 | NV15 / AC-23: đo nước 2 lần/ngày cho lô Mysis; NV4 không có sự kiện thay nước | Độ mặn + thay nước hằng tuần; còn lại hằng ngày | Lịch đo theo **từng chỉ tiêu** (cấu hình ở NV0); thêm loại ghi "thay nước" ở NV4. Giá trị mặc định chờ Q3 |
| L4 | OUT: kết nối IoT, chỉ chừa điểm nhận dữ liệu | Cần tự động hoá, quan trắc môi trường | Giữ nhập tay cho phase 1, nhưng thiết kế điểm nhận dữ liệu cảm biến sẵn sàng; chờ Q5 để quyết có đưa vào phase 1 không |

**Thiếu — chưa có trong spec:**

| ID | Thiếu gì | Ghi chú |
|---|---|---|
| T1 | **Cụm an toàn sinh học.** Đã có: cách ly + PCR đầu vào (NV1, R2), chặn thu hoạch khi không có PCR âm (NV6, R5), cấm vật tư (R7), leo thang cảnh báo (H4). Chưa có: (a) vệ sinh–khử trùng bể sau thu (trạng thái "trống – chờ vệ sinh" không có luồng đóng); (b) kiểm soát ra vào, khu sạch–bẩn (người, xe, dụng cụ); (c) truy vết ngược/xuôi và phong toả khi dương tính (lô cùng mẻ/đàn, lô thành phẩm đã xuất); (d) giám sát định kỳ ngoài đầu vào và trước thu | Đề xuất 3 nghiệp vụ nháp, **chưa viết AC** vì cần SOP thật (Q1): NV17 Vệ sinh–khử trùng bể · NV18 Truy vết và phong toả · NV19 Ra vào khu an toàn sinh học. *(Cập nhật 2026-11-13: đánh số lại từ NV16–NV18 vì NV16 dành cho Lệnh sản xuất; phần khai báo của chúng đã vào NV0d, xem [research 03](03-trang-khai-bao.md).)* |
| T2 | Đo **tăng trưởng** (cỡ/trọng lượng mẫu, FCR) | Spec có tỷ lệ sống và chi phí/triệu PL, chưa có tăng trưởng (Q8) |
| T3 | **Thiết bị**: quản lý tài sản/bảo trì và ràng buộc độ bền | Spec chưa có; hiện chỉ ghi nhận là ràng buộc phần cứng (Q6) |
| T4 | **Đa địa điểm:** trụ sở và khu sản xuất | R1 (quyền theo trại) vẫn đúng; cần biết kế toán/sale ngồi đâu (Q7) |
| T5 | Mảng ngoài MVP: cửa hàng thức ăn, trạm thu mua Phú Lạc, vận tải | Đã OUT; chỉ cập nhật discovery |
| T6 | **Độ tin cậy hệ thống:** sao lưu/khôi phục, quy trình khi hệ thống ngừng | Spec chưa có mục phi chức năng về sẵn sàng; offline NV4 mới là một phần |
| T7 | **SOP chuẩn hoá** là đầu ra mong muốn | Giả định G9 "chưa có SOP" → đề xuất dựng bản nháp SOP từ các flow NV1–NV13 để Đắc Lộc duyệt |

**Nguyên tắc thiết kế đề xuất cho "an toàn dịch bệnh hàng đầu"** (chờ xác nhận): (1) mặc định chặn khi thiếu bằng chứng an toàn (đã đúng ở R2, R5, R7); (2) mọi lô truy ngược/xuôi được trong một thao tác (NV13 + NV17); (3) cảnh báo dịch bệnh đứng trên mọi cảnh báo khác ở chuông thông báo.

# 4. Kiến thức ngành đã tra (công khai, chưa kiểm với Đắc Lộc)

| Chủ đề | Điều tra được | Mức tin cậy |
|---|---|---|
| Cách ly bố mẹ | Đàn mới nhập phải nuôi tách riêng và không trộn với đàn cũ cho tới khi biết tình trạng bệnh (bài trình bày [FAO](https://www.fao.org/fi/static-media/MeetingDocuments/WorkshopAMR17/presentations/20.pdf)) | Trung bình — tài liệu hướng dẫn |
| Kiểm tra PL | Xác nhận PL bằng PCR cho WSSV, EHP, AHPND, kèm thử sốc độ mặn và vi sinh ([FAO](https://www.fao.org/fi/static-media/MeetingDocuments/WorkshopAMR17/presentations/20.pdf)) | Trung bình |
| Giám sát | Chương trình "sentinel": nuôi cách ly một số cá thể trong điều kiện gây sốc rồi xét nghiệm; dương tính thì tiêu huỷ và khử trùng cơ sở ([JIFSAN HACCP](https://www.jifsan.umd.edu/files/pdf/GAqP%20Manuals/04%20GAqPs%20Manual%20HACCP%20Application.pdf)) | Trung bình |
| Lây dọc | WSSV, IHHNV, EHP có thể truyền qua giao tử hoặc vỏ trứng → cần xét nghiệm mức cá thể ([World Aquaculture 2025](https://was.org/Magazine/2025/03/79/)) | Trung bình |
| Phương pháp PCR | PCR là phương pháp ưu tiên ở mọi giai đoạn, ngoại lệ WSSV ở giai đoạn ấu trùng chưa có phương pháp khuyến nghị ([Global Seafood](https://www.globalseafood.org/advocate/proficiency-test-farmed-shrimp/)) | Trung bình; kiểm lại WOAH trước khi viết AC |
| GlobalGAP | IFA Aquaculture phủ toàn chuỗi từ trại giống, truy xuất bố mẹ, giống, thức ăn; đánh giá hằng năm bởi bên thứ ba; bản v6 thêm kế hoạch cải tiến liên tục ([GLOBALG.A.P.](https://www.globalgap.org/what-we-offer/solutions/ifa-aquaculture)) | Cao về phạm vi; chưa đọc điều khoản chi tiết |
| Quan trắc tự động | Thiết bị đo pH, nhiệt độ, độ mặn trên phao, truyền LoRa/di động; bám bẩn làm sai số nên cần vệ sinh định kỳ ([bản tin thiết bị giám sát](https://bavutex.baria-vungtau.gov.vn/tin-tuc/vien-nghien-cuu-sang-che-va-khai-thac-cong-nghe-nghien-cuu-phat-trien-thiet-bi-tu-dong-giam-sat-moi-truong-nuoi-trong-thuy-san.html)) → dữ liệu cảm biến cần cờ chất lượng/hiệu chuẩn | Thấp — một nguồn |
| Pháp lý | Số hiệu quy chuẩn chưa xác định: một nguồn gắn QCVN 02-22:2015 với nuôi cá lồng bè nước ngọt, và Thông tư 16/2015 có thể đã được thay thế từ 01/11/2023 ([caselaw.vn](https://caselaw.vn/van-ban-phap-luat/263890-thong-tu-16-2015-tt-bnnptnt-quy-chuan-ky-thuat-quoc-gia-ve-dieu-kien-nuoi-thuy-san-do-bo-truong-bo-nong-nghiep-va-phat-trien-nong-thon-ban-hanh)) | **Chưa dùng được** — kiểm vbpl.vn hoặc Chi cục Thuỷ sản trước khi viết AC tuân thủ |
| Vietsun | **Không tìm thấy tài liệu công khai** về phần mềm này (kết quả chỉ ra phần mềm khác) | Không có — phải hỏi trực tiếp (Q2) |
| Thiết bị chịu mặn | **Không tìm thấy** thông số vật liệu cảm biến chịu ăn mòn nước biển; hướng hỏi nhà cung cấp: điện cực, vỏ chống nước, hiệu chuẩn độ mặn | Không có |

Khoảng trống chưa tra được: phân khu sạch–bẩn, quy trình all-in/all-out cụ thể, quy trình ốc giống. Các mục này cần người trong ngành hoặc SOP của Đắc Lộc.

# 5. Mười câu hỏi gộp gửi Đắc Lộc (ưu tiên từ trên xuống)

1. **An toàn sinh học:** đã có quy định/SOP về ra vào, thay đồ, khử trùng bể và dụng cụ chưa; ghi vào sổ nào, ai chịu trách nhiệm? Khi một lô dương tính thì xử lý ra sao, có thu hồi lô đã xuất không? *(T1)*
2. **Vietsun:** phiên bản nào, ai dùng, ngồi ở đâu; nhập/xuất Excel được không, danh mục mã vật tư/khách hàng đang đặt thế nào; ERP cần đẩy gì sang (nhập kho, giá vốn, xuất bán, công nợ)? *(L1)*
3. **Độ mặn và thay nước hằng tuần** áp dụng cho khu nào (trại giống, nuôi thương phẩm, tôm hùm)? "Thông tin khác hằng ngày" gồm những chỉ tiêu nào, mỗi ngày mấy lần? *(L3)*
4. **Ốc giống** là loài nào, quy trình có chung chuỗi giai đoạn không? "Cá giống" có phải cá chẽm? *(L2)*
5. **Tự động hoá:** hiện có cảm biến, máy cho ăn, giám sát điện của hãng nào, dữ liệu đang lưu ở đâu; có muốn phase 1 nhận dữ liệu tự động không? *(L4)*
6. **Thiết bị bền:** thiết bị nào đã hỏng vì mặn, hỏng sau bao lâu; có cần quản lý bảo trì/thay thế trong ERP không? *(T3)*
7. **Tổ chức:** "3 khu văn phòng, sản xuất" cụ thể là những khu nào; kế toán, sale, kho ngồi ở trụ sở hay tại khu? *(T4)*
8. **Tăng trưởng:** có đo cỡ/trọng lượng mẫu không, tần suất, có tính FCR không? *(T2)*
9. **Hiệu quả tài chính:** BGĐ muốn xem chỉ số nào (giá thành/triệu PL, lãi lỗ theo mảng, công nợ…)? *(Mục 2)*
10. **GlobalGAP:** đang theo phiên bản nào, lần đánh giá gần nhất khi nào, hồ sơ nào khó chuẩn bị nhất? *(§4)*

# 6. Việc tiếp theo

| # | Việc | Ai | Trạng thái |
|---|---|---|---|
| 1 | Tìm hiểu lại chuyên môn, hỏi người trong ngành | Nhóm dự án | Đã tra công khai (§4); còn khoảng trống cần người ngành |
| 2 | Chuẩn bị kiến thức: biosecurity trại giống, GlobalGAP IFA, Vietsun | Nhóm dự án | Biosecurity và GlobalGAP: một phần; Vietsun: chờ Q2 |
| 3 | Chuẩn bị dữ liệu input / output / tăng trưởng (mẫu Excel nhập: bể, vật tư, tồn, sản lượng, nhật ký) | Nhóm dự án + Đắc Lộc | Chưa bắt đầu; phụ thuộc Q8 |
| 4 | Bổ sung 10 câu hỏi ở §5 vào bộ câu hỏi khảo sát ([kế hoạch khảo sát](Ke-hoach-khao-sat-Dac-Loc.docx), mục 6) | Nhóm dự án | Chưa làm (file .docx) |
| 5 | Sau khi có trả lời Q1: viết NV16–NV18 và AC; Q2: chốt phạm vi kế toán; Q3/Q4: sửa NV0, NV2, NV4, AC-23 | BA | Chờ trả lời |

# Phụ lục — Ghi chú gốc (nguyên văn)

Họp ERP Đắc Lộc: sử dụng Excel · kế toán Vietsun · vùng biển: độ mặn cao, thiết bị bền · thiết bị phải bền hơn, khiếm khuyết nhất là đồ phải bền · cần thiết bị bền · khả năng tạo hệ thống quản trị doanh nghiệp giống và nuôi trồng thuỷ sản; xem thử có ý tưởng gì, quản lý phần mềm đó như thế nào, cuối cùng tất cả các bên hiệu quả và tài chính · ghi nhật ký hằng ngày · độ mặn thay nước hàng tuần, các thông tin khác ghi nhận hằng ngày · mong muốn tìm giải pháp bằng quy trình công nghệ quản lý hệ thống sao cho tốt, dễ làm, chuẩn để định hình cho tổ chức sản xuất; tổ chức là phải có hệ thống, hệ thống hỏng là không quản trị được · ngoài quản trị cần an toàn dịch bệnh, an toàn sinh học, cái đó mới quan trọng · làm sao ứng dụng vào tổ chức mà đặt an toàn dịch bệnh lên hàng đầu · có các đảm bảo, quản lý hệ thống sản xuất · nhập vào cái gì, ra cái gì · trụ sở chính ở 35 Nguyễn Đình Chiểu · chi nhánh ở đây đa phần là kỹ thuật · 50ha, bao gồm các hoạt động sản xuất tôm giống, cá giống, ốc giống, nuôi tôm thương phẩm, có tôm hùm · có cửa hàng kinh doanh thức ăn… · trạm thu mua ở Phú Lạc · mảng kinh doanh vận tải · đạt chứng nhận GlobalGAP từ 2013 · có 3 khu văn phòng, sản xuất · tìm hiểu lại về chuyên môn, tìm hiểu dân trong ngành · chuẩn bị kiến thức · chuẩn bị dữ liệu input, output, tăng trưởng · cần tự động hoá, quan trắc môi trường; phần mềm quản lý tự động hoá.

**Last Updated**: 2026-11-13
