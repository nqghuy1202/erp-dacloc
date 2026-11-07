# 12 — Design-spec: MVP Sản xuất giống + Kho (Đắc Lộc)
> Load khi: task chạm UI của sản xuất (trại/bể/lô/nhật ký), xét nghiệm, kho, tổng quan BGĐ, truy xuất QR, cài đặt danh mục.
covers: src/app/(office), src/app/hien-truong, src/components, src/app/globals.css
last_verified: 2026-11-07
ttl_days: 90

> Oracle GIAO DIỆN. Oracle HÀNH VI là [11-ba-spec-mvp-san-xuat-kho.md](11-ba-spec-mvp-san-xuat-kho.md) — mọi màn dưới đây phục vụ một nghiệp vụ NV0–NV13 và phải làm được các AC tương ứng. Tham chiếu hình: [docs/research/00-discovery-dac-loc.md](../research/00-discovery-dac-loc.md) §4.

## 0. Quyết định nền
- **Stack [STACK]**: Next.js (App Router) + React + Tailwind + shadcn/ui + lucide-react; chart: Recharts (qua shadcn chart). PWA offline cho vùng `(field)`.
- **Hai không gian**: `Văn phòng` (web, desktop-first, dạng bảng gọn — tinh thần VANTUS) và `Hiện trường` (PWA mobile-first cho công nhân/trưởng trại tại bể — tinh thần Gummi app). Dashboard dùng thẻ số liệu lớn + ảnh/biểu đồ; màn nghiệp vụ dùng bảng.
- **IA theo bộ phận** [DEF]: Tổng quan · Sản xuất · Xét nghiệm · Kho · Cài đặt. Mỗi bộ phận có dashboard KPI riêng + thao tác vào/ra của nó; BGĐ có tổng quan rollup.
- **Phạm vi trại**: bộ chọn trại toàn cục ở đầu vùng làm việc; người chỉ có 1 trại không thấy bộ chọn (R1).

## 0b. Nguyên tắc tổ chức thông tin (vòng 2 — [docs/research/01-ui-info-architecture-refs.md](../research/01-ui-info-architecture-refs.md))
1. Mỗi màn trả lời đúng 1 câu hỏi (cột "User đến để làm gì" của Screen map); khối đầu màn là câu trả lời.
2. Tóm tắt → đối tượng → chi tiết: KPI → trại → bể → lô → nhật ký, mỗi bậc 1 chạm.
3. Trạng thái = chữ + icon + màu, một bộ từ vựng chung (§3 Badge).
4. Thời gian là thông tin: hàng đợi và việc luôn có "còn / quá X giờ".
5. Tiến trình lô là timeline giai đoạn, không chỉ một badge.
6. Cảnh báo khẩn không chiếm chỗ màn: số trên chuông ở đầu vùng làm việc + thông báo đẩy; danh sách đầy đủ trong khối cảnh báo của S1 và M4.
7. Mật độ vừa phải: 6–8 khối/màn văn phòng; chi tiết mở khi bấm.

## Thang người dùng
| Loại user | Muốn thấy gì | Truyền tải | Action tiếp |
|---|---|---|---|
| U1 Công nhân bể (quen, mobile, tay ướt, ngoài trời) | Bể nào của tôi cần làm gì ngay bây giờ | Danh sách việc theo giờ, mã bể chữ to, trạng thái đồng bộ luôn hiện | Ghi cho ăn / đo nước trong ≤ 15 giây |
| U2 Trưởng trại (quen, mobile + desktop) | Trại tôi có gì bất thường, lô nào sắp thu, vật tư còn đủ không | Cảnh báo mở đứng đầu, lưới bể theo trạng thái, lô theo giai đoạn | Xử lý cảnh báo → mở lô / thu hoạch / yêu cầu vật tư |
| U3 Kỹ thuật viên lab (quen, desktop) | Mẫu nào đang chờ kết quả, lô nào cần xét nghiệm trước thu | Hàng đợi mẫu sắp theo hạn, kết quả từng chỉ tiêu âm/dương rõ | Nhập và chốt phiếu kết quả |
| U4 Thủ kho (quen, desktop + mobile) | Yêu cầu nào chờ cấp, vật tư nào dưới mức tối thiểu / sắp hết hạn | Hàng đợi yêu cầu, tồn theo lô hạn dùng | Cấp phát / tạo phiếu nhập |
| U5 Ban giám đốc (đọc là chính, desktop + mobile) | Toàn khu đang có bao nhiêu PL, tỷ lệ sống, sản lượng, rủi ro | 4 KPI lớn + xu hướng, bản đồ trại tô theo cảnh báo | Mở trại có vấn đề / tra QR |
| U6 Quản trị (power, desktop) | Danh mục đủ chưa, ai có quyền gì | Bảng danh mục + kết quả import | Thêm / import danh mục |
| Người dùng mới (lần đầu, mọi role) | Bắt đầu từ đâu | Danh sách 3–4 bước theo vai trò (chỉ khi dữ liệu trống) | Bước thiết lập đầu tiên |

## 1. Điều hướng
- **Desktop sidebar** (văn phòng): 5 mục cấp 1, tối đa 2 cấp:
  - Tổng quan
  - Sản xuất → Kế hoạch · Trại & bể · Đàn bố mẹ · Mẻ đẻ · Lô ương · Sự cố
  - Xét nghiệm → Hàng đợi mẫu · Phiếu kết quả
  - Kho → Tồn kho · Phiếu nhập · Yêu cầu cấp · Kiểm kê
  - Cài đặt → Danh mục · Người dùng & quyền · Import
  - Chân sidebar: ô tra mã lô/QR, ngôn ngữ VI/EN, tài khoản. Mục hiển thị theo quyền (công nhân không thấy Kho/Cài đặt).
- **Mobile bottom tabs** (hiện trường, ≤ 5): `Hôm nay` · `Bể` · `Quét` · `Cảnh báo` · `Tôi`. Trưởng trại thêm lối vào lô/kho qua `Tôi → Trại của tôi` (không vượt 5 tab).
- **Tablet**: sidebar thu gọn thành rail icon + nhãn khi mở; bảng giữ tối đa 6 cột, cột còn lại vào trang chi tiết.

## Flows (đường đi qua màn, map từ ba-spec §5)
| Flow | Đường đi |
|---|---|
| Tiếp nhận bố mẹ (NV1) | S4 Tiếp nhận đàn → S8 (U3) → S9 chốt → S4 đàn `Sẵn sàng` / `Loại bỏ` |
| Sản xuất lô (NV2→NV3) | S4 → S5 Tạo mẻ đẻ → Mở lô ương → S2 bể nổi bật |
| Kế hoạch (NV14) | S17 U2 sao chép tháng trước → sửa lô → Gửi duyệt → U5 S17 Duyệt → S1 có mốc |
| Việc hằng ngày (NV15) | S1 tự sinh → U2 S2/S3 Thêm việc đột xuất → U1 M1 |
| Ghi hằng ngày (NV4) | M1 → M2 Lưu → M2 bể kế tiếp … (hoặc M5 quét QR bể → M2) |
| Cảnh báo (NV4→NV7) | M2 ngoài ngưỡng → M4 (U2) Xác nhận → S7 Xử lý → (S12 yêu cầu vật tư) → S3 |
| Thu hoạch (NV5→NV6→NV13) | S8 → S9 chốt âm tính → S3 Thu hoạch → S14 In tem QR |
| Vật tư (NV8→NV9→NV10) | S10 → S11 Chốt phiếu nhập · U2 S12 Gửi yêu cầu → U4 S12 Cấp phát → tự trừ theo M2 |
| Kiểm kê (NV11) | S10 → S13 nhập số thực → Gửi duyệt → U2 S13 Duyệt → S10 |
| Thiết lập (NV0) | S15 Import → sửa dòng lỗi → S16 Thêm người dùng → S1 |

## Screen map
| # | Màn | Type | Vào từ | User đến để làm gì | Step tiếp theo | Primary | NV / AC |
|---|---|---|---|---|---|---|---|
| S1 | Tổng quan khu | read | Đăng nhập (U5), sidebar | Sản xuất có đạt kế hoạch không, trại nào chậm | Mở trại chậm nhất | Xem trại chậm nhất | NV12 · AC-19, AC-20, AC-22 |
| S17 | Kế hoạch sản xuất | product | sidebar Sản xuất, S1 | U2 lập lịch thả/thu lô tháng; U5 duyệt | Gửi duyệt / Duyệt | Gửi duyệt (U2) / Duyệt (U5) | NV14 · AC-21 |
| S2 | Trại (lưới bể) | product | S1, sidebar Sản xuất | Bể nào sắp thu, bể nào đang lệch | Mở bể cần xử lý | Mở lô ương | NV3 · AC-5 |
| S3 | Chi tiết lô ương | product | S2, S6, cảnh báo, QR | Lô đang ở giai đoạn nào và đang chờ gì để thu | Thu hoạch khi đủ điều kiện | Thu hoạch | NV4–NV6 · AC-12, AC-13 |
| S4 | Đàn bố mẹ (danh sách + chi tiết) | product | sidebar | Tiếp nhận đàn mới, theo dõi cách ly | Gửi mẫu xét nghiệm đầu vào | Tiếp nhận đàn | NV1 · AC-2, AC-3 |
| S5 | Mẻ đẻ | product | S4 (đàn sẵn sàng), sidebar | Ghi mẻ đẻ, số Nauplius, phân vào bể | Mở lô ương từ mẻ | Tạo mẻ đẻ | NV2, NV3 · AC-4 |
| S6 | Lô ương (danh sách) | product | sidebar | Lọc lô theo trại/giai đoạn/ngày dự kiến thu | Mở chi tiết lô | Mở lô ương | NV3 |
| S7 | Sự cố | product | cảnh báo, S3 | Xác nhận và xử lý sự cố | Đóng sự cố với hành động | Xử lý sự cố | NV7 · AC-10, AC-11 |
| S8 | Hàng đợi mẫu (lab) | product | đăng nhập U3, sidebar | Thấy mẫu chờ kết quả theo hạn | Nhập kết quả | Nhập kết quả | NV5 |
| S9 | Phiếu kết quả xét nghiệm | product | S8, S3, S4 | Nhập từng chỉ tiêu và chốt | Về hàng đợi, mẫu kế tiếp | Chốt phiếu | NV5 · AC-3, AC-11 |
| S10 | Tồn kho | product | đăng nhập U4, sidebar | Xem tồn theo kho/vật tư/lô hạn dùng, mức tối thiểu | Tạo phiếu nhập hoặc cấp phát | Tạo phiếu nhập | NV8, NV10 · AC-17 |
| S11 | Phiếu nhập | product | S10 | Ghi hàng NCC về | Chốt phiếu, về tồn kho | Chốt phiếu nhập | NV8 · AC-15 |
| S12 | Yêu cầu cấp vật tư | product | S10, S7, mobile `Tôi` (U2) | U2 tạo yêu cầu; U4 cấp phát FEFO | Yêu cầu kế tiếp trong hàng đợi | Cấp phát (U4) / Gửi yêu cầu (U2) | NV9 · AC-16 |
| S13 | Kiểm kê | product | S10 | Nhập số đếm thực, xem chênh lệch, duyệt | Duyệt / gửi duyệt | Gửi duyệt (U4) / Duyệt (U2) | NV11 · AC-18 |
| S14 | Truy xuất lô | read | ô tra sidebar, tab `Quét`, URL QR | Xem chuỗi nguồn gốc của lô thành phẩm | In / chia sẻ tem QR | In tem QR | NV13 · AC-14 |
| S15 | Danh mục & import | product | sidebar Cài đặt | Thiết lập trại, bể, loài, giai đoạn, ngưỡng, vật tư | Sửa dòng lỗi import | Import file | NV0 · AC-1 |
| S16 | Người dùng & quyền | product | sidebar Cài đặt | Gán vai trò và trại | Mời người kế tiếp | Thêm người dùng | NV0 · AC-8 |
| M1 | Hôm nay (mobile) | product | mở app U1/U2 | Việc nào phải làm ngay, còn bao nhiêu việc | Chạm 1 việc để ghi | Ghi việc kế tiếp | NV4 |
| M2 | Ghi nhật ký bể (mobile) | product | M1, M3, quét QR bể | Ghi cho ăn / nước / hao hụt nhanh | Bể kế tiếp trong danh sách | Lưu | NV4 · AC-6, AC-8, AC-9 |
| M3 | Bể của tôi (mobile) | product | tab `Bể` | Xem nhanh từng bể: giai đoạn, nước gần nhất, cảnh báo | Mở ghi nhật ký | Ghi nhật ký | NV4 |
| M4 | Cảnh báo (mobile) | product | tab, thông báo đẩy | Xem và xác nhận cảnh báo | Mở S7/S3 tương ứng | Xác nhận | NV7 · AC-9, AC-10 |
| M5 | Quét (mobile) | product | tab `Quét` | Quét QR bể (→ M2) hoặc QR lô (→ S14) | Màn đích | Quét | NV4, NV13 |

## 2. Layout & mật độ (từng màn chính)
- **S1 Tổng quan** (trả lời: đạt kế hoạch chưa, trại nào chậm):
  1. Khối đầu toàn chiều ngang: **Sản lượng thu tháng thực / kế hoạch** — số lớn 40px "68,2 / 300 tr PL", thanh tiến độ có vạch "kế hoạch tới hôm nay", chữ trạng thái "Chậm 4,1 tr so với kế hoạch" hoặc "Vượt …".
  2. Hàng 3 KPI phụ (20–24px): Lô đang ương · PL ước lượng trong bể · Tỷ lệ sống TB 30 ngày.
  3. Hai cột: trái = **Tiến độ theo trại** — thanh ngang 14 trại xếp % đạt tăng dần, vạch mốc chung, trại dưới mốc > 10 điểm có nhãn "Chậm"; bấm thanh → S2. Phải = **Cảnh báo mở** (tất cả, sắp theo mức độ rồi thời gian, tối đa 6 + "Tất cả").
  4. Hàng cuối: sản lượng 12 tuần thực vs kế hoạch (cột + đường) · vật tư dưới mức tối thiểu (5 dòng).
  Budget: 7 khối. Chưa có kế hoạch duyệt → khối 1 hiện sản lượng thực + "Chưa có kế hoạch tháng 11" + liên kết S17.
- **S2 Trại** (trả lời: bể nào sắp thu, bể nào lệch): dải 4 số đầu (Đang ương · Sắp thu 3 ngày · Bể lệch · Bể trống); thanh lọc; lưới thẻ bể (desktop 6 cột / tablet 4 / mobile 2) theo mẫu Horizon: mã bể 18px + nhãn trạng thái chữ, giai đoạn ("PL12"), **thanh tiến độ ngày tuổi / ngày dự kiến thu** ("ngày 21/22 · thu 08/11"), dòng phụ số ước lượng; viền trái màu chỉ khi lệch (kèm chữ "pH 9,1"). Bể trống hiện mờ + "Trống".
- **S3 Chi tiết lô** (trả lời: lô ở đâu, chờ gì): đầu trang mã lô + badge + nút Thu hoạch. Hai cột: trái = **Timeline giai đoạn dọc** (Nauplius → Zoea → Mysis → PL → Thu hoạch; mỗi mốc có ngày, mốc hiện tại nổi bật, mốc tương lai có ngày dự kiến); phải = **Điều kiện thu hoạch** checklist (PCR âm tính còn hiệu lực · đạt giai đoạn · ngày dự kiến) với Đạt/Chờ/Không đạt, rồi dải 4 số (Số thả · Ước lượng · Tỷ lệ sống · Chi phí/triệu PL). Dưới: tab `Nhật ký` · `Chỉ số nước` (mini-chart từng chỉ tiêu, dải ngưỡng) · `Xét nghiệm` · `Nguồn gốc`.
- **S17 Kế hoạch**: bảng lô dự kiến theo tháng (bể, ngày thả, số thả, ngày thu, số thu dự kiến), tổng cố định đầu bảng, trạng thái kế hoạch (Nháp · Chờ duyệt · Đã duyệt · Trả lại); sao chép tháng trước.
- **Bảng nghiệp vụ** (S4, S6, S8, S10–S13, S15, S16): hàng 48px, cột số căn phải tabular-nums, ≤ 7 cột desktop, lọc + tìm ở đầu, hành động phụ trong menu ⋯ cuối dòng, phân trang 50 dòng.
- **Form nhập** (phiếu nhập, phiếu kết quả, tiếp nhận đàn): Sheet bên phải trên desktop (giữ ngữ cảnh bảng), toàn màn trên mobile. Form > 8 trường hoặc nhiều dòng chi tiết (phiếu nhập, kiểm kê) → trang riêng.
- **M1 Hôm nay**: đầu màn số lớn "Còn 4/12 việc" + thanh tiến độ ngày; nhóm Bây giờ (gồm việc trễ, nhãn "Trễ 25 phút") · Sau đó · Đã xong (thu gọn); việc đột xuất có nhãn "Trưởng trại giao".
- **M2 Ghi nhật ký**: chọn loại bằng segmented 3 lựa chọn (Cho ăn · Nước · Hao hụt); trường số dùng bàn phím số, bước +/− cỡ 48dp; vật tư cho ăn gợi ý theo lần trước của bể; nút Lưu cố định đáy màn, rộng toàn phần, 56dp. Sau lưu tự chuyển bể kế tiếp.

## 3. Component (shadcn)
| Nhu cầu | Component | Ghi chú |
|---|---|---|
| Danh sách nghiệp vụ | Table (TanStack) | sort, lọc, chọn cột |
| Lưới bể / trại | Card nhỏ dạng `<button>` | toàn thẻ bấm được, có focus ring |
| Form ngắn | Sheet (desktop) / Drawer (mobile) | |
| Xác nhận không đảo được (chốt phiếu, huỷ lô) | AlertDialog | nêu hậu quả bằng số: "Huỷ lô L-100 — 820.000 con" |
| Trạng thái | Badge ≤ 2 từ | `Chậm` · `Đúng tiến độ` · `Trễ` · `Đang ương` · `Cách ly` · `Sẵn sàng` · `Loại bỏ` · `Chờ cấp` · `Đã chốt` · `Chờ duyệt` |
| Thông báo kết quả | Toast (sonner) | xoá/huỷ được → toast có Hoàn tác 10 giây |
| Biểu đồ | shadcn chart / Recharts | đường cho chỉ số nước, cột cho sản lượng |
| Tab trong trang | Tabs | 2–6 tab, không lồng |
| Chọn trại | Select ở đầu vùng làm việc | |
| Cảnh báo khẩn | Chuông + số đếm ở đầu vùng làm việc; Popover danh sách | thông báo đẩy trên mobile; không banner chiếm chỗ |
| Tiến độ | Progress + vạch mốc (custom theo token) | luôn kèm chữ % và chữ trạng thái |
| Ngày | Date picker, định dạng dd/MM/yyyy (vi) · MMM d, yyyy (en) | |

**Nhãn đồng bộ**: tab S3 đều 1–2 từ (`Nhật ký` · `Chỉ số nước` · `Xét nghiệm` · `Nguồn gốc`); bottom tabs đều 1 từ ≤ 8 ký tự ở cả VI/EN (`Today` · `Tanks` · `Scan` · `Alerts` · `Me`). Tiêu đề trang là danh từ, không chấm câu. Số: `1.250.000` (vi) / `1,250,000` (en); số lớn rút gọn ở KPI: `3,5 tr` / `3.5M`, đơn vị PL ghi rõ.

## 4. Action → expectation
| Hành động | Ngay sau đó user thấy |
|---|---|
| Lưu nhật ký (M2) | Toast "Đã lưu · B-03" + chấm đồng bộ (đã đồng bộ / chờ mạng); màn nhảy sang bể kế tiếp; dòng vừa ghi đứng đầu tab Nhật ký của S3 |
| Lưu khi offline | Biểu tượng mây gạch + số dòng chờ ở đầu app; khi có mạng chuyển "Đã đồng bộ" |
| Ghi chỉ số ngoài ngưỡng | Ngay trong form: giá trị tô màu nguy hiểm + chữ "Ngoài ngưỡng 7,5–8,5"; sau lưu cảnh báo xuất hiện ở M4 của trưởng trại |
| Mở lô ương | Về S2, thẻ bể vừa mở được làm nổi 2 giây, badge `Đang ương` |
| Thu hoạch | Sang S14 của lô thành phẩm mới, nút In tem QR là primary |
| Chốt phiếu xét nghiệm | Về S8, mẫu đã chốt biến khỏi hàng đợi; dương tính → banner "Đã mở sự cố cho L-100" có liên kết S7 |
| Chốt phiếu nhập / cấp phát | Về S10, dòng vật tư liên quan làm nổi, số tồn mới hiển thị |
| Huỷ lô / huỷ phiếu | AlertDialog → toast với Hoàn tác 10 giây (trước khi ghi giao dịch thật) |
| Import danh mục | Kết quả: "8 dòng đã lưu · 2 dòng lỗi" + bảng dòng lỗi có lý do, tải lại file lỗi |
| Chuyển VI/EN | Nhãn đổi tại chỗ, không tải lại, giữ vị trí cuộn và bộ lọc |

## Ma trận trạng thái
| Màn hình | Chưa login / sai quyền | Trống | Đang tải | Lỗi | Dữ liệu cực đoan |
|---|---|---|---|---|---|
| S1 Tổng quan | Về đăng nhập; role không phải U5/U6 → về trang chính theo role | Hệ thống mới: checklist thiết lập theo vai trò (U6) | Skeleton 4 KPI + lưới | Khối lỗi riêng từng widget + Thử lại; widget khác vẫn hiện | 14 trại × 50 bể; KPI ≥ 1 tỷ rút gọn `1,2 tỷ` |
| S17 Kế hoạch | U1/U3/U4 không thấy | "Chưa có kế hoạch tháng 12" + Sao chép tháng trước / Thêm lô | Skeleton bảng | Lưu lỗi giữ nháp | 40 lô/tháng: tổng cố định đầu bảng |
| S2 Trại | Trại ngoài quyền → 403 "Không có quyền với trại này" + về trại của tôi | "Chưa có bể" + Thêm bể (U6) / liên hệ quản trị (khác) | Skeleton lưới thẻ | Thử lại | 120 bể: lưới cuộn, lọc giữ cố định; mã bể dài cắt + tooltip và hiện đủ ở chi tiết |
| S3 Chi tiết lô | 403 như S2 | Lô mới chưa có nhật ký: "Chưa có nhật ký" + Ghi nhật ký | Skeleton | Thử lại; lô bị xoá → "Lô không tồn tại" + về S6 | 90 ngày × 8 lần ghi/ngày: nhật ký phân trang theo ngày; biểu đồ lấy trung bình theo giờ khi > 500 điểm |
| S4 Đàn bố mẹ | 403 | "Chưa có đàn bố mẹ" + Tiếp nhận đàn | Skeleton bảng | Thử lại | 2.000 con/đàn: số căn phải |
| S5 Mẻ đẻ | 403 | Không có đàn sẵn sàng → "Chưa có đàn sẵn sàng" + về S4 | Skeleton | Thử lại | Số Nauplius 9 chữ số format locale |
| S6 Lô ương | 403 | "Chưa có lô" + Mở lô ương | Skeleton bảng | Thử lại | 2.000 lô: phân trang + lọc theo trại mặc định |
| S7 Sự cố | 403 | "Không có sự cố mở" (trạng thái tốt, không CTA) | Skeleton | Thử lại | Mô tả dài: 3 dòng + xem thêm |
| S8 Hàng đợi mẫu | Chỉ U3/U2/U6 | "Không có mẫu chờ" | Skeleton | Thử lại | Mẫu quá hạn đứng đầu, đỏ + chữ "Quá hạn 2 ngày" |
| S9 Phiếu kết quả | Chỉ U3 ghi; U2 xem | — (luôn có mẫu) | Skeleton form | Lưu lỗi: giữ dữ liệu đã nhập, báo trường lỗi | 12 chỉ tiêu: nhóm theo loại |
| S10 Tồn kho | Chỉ U4/U2 (trại mình)/U5/U6 | "Chưa có vật tư" + Tạo phiếu nhập / Import tồn đầu kỳ | Skeleton bảng | Thử lại | Tồn âm hiện đỏ có dấu trừ + badge `Âm kho` (AC-17) |
| S11 Phiếu nhập | Chỉ U4 | Phiếu mới chưa có dòng: "Thêm dòng vật tư" | — | Vật tư cấm: lỗi tại dòng "Vật tư cấm dùng" (AC-15); lưu lỗi giữ nháp | 100 dòng: cuộn trong bảng, tổng tiền cố định đáy |
| S12 Yêu cầu cấp | U2 tạo / U4 cấp | "Không có yêu cầu chờ" | Skeleton | Thử lại | Cấp một phần: hiện "Đã cấp 20/25 kg" |
| S13 Kiểm kê | U4 nhập / U2 duyệt | "Chưa có đợt kiểm kê" + Bắt đầu kiểm kê | Skeleton | Mất mạng giữa chừng: lưu nháp cục bộ | Lệch > 2% tô cảnh báo theo dòng |
| S14 Truy xuất | Nội bộ cần login (QR công khai: phase 2) | Mã không tồn tại: "Không tìm thấy lô" + nhập lại | Skeleton chuỗi | Mắt xích thiếu hiện rõ "Thiếu dữ liệu: phiếu PCR" | Lô Green House nhiều nguồn: chuỗi rẽ nhánh, mỗi nhánh thu gọn được |
| S15 Danh mục | Chỉ U6 | Checklist thiết lập lần đầu | Skeleton | Import lỗi định dạng: "File không đúng mẫu" + tải file mẫu | 5.000 dòng import: tiến trình % |
| S16 Người dùng | Chỉ U6 | "Mới có bạn" + Thêm người dùng | Skeleton | Thử lại | Tên dài cắt + đủ ở chi tiết |
| M1 Hôm nay | Phiên hết hạn: giữ dữ liệu chờ đồng bộ, yêu cầu đăng nhập lại | "Chưa được giao bể" + liên hệ trưởng trại | Skeleton danh sách | Offline: dùng dữ liệu đã lưu, nhãn "Ngoại tuyến" | 30 bể/người: nhóm theo giờ |
| M2 Ghi nhật ký | Bể không được giao → chặn trước khi nhập (AC-8) | — | — | Lưu thất bại → vào hàng chờ đồng bộ, không mất dữ liệu | Giá trị phi lý (pH 14, âm) chặn tại trường |
| M3 Bể của tôi | như M1 | như M1 | Skeleton | Offline: dữ liệu lần đồng bộ cuối + giờ | — |
| M4 Cảnh báo | như M1 | "Không có cảnh báo" | Skeleton | Offline: danh sách cũ + giờ | 50 cảnh báo: nhóm theo bể |
| M5 Quét | Quyền camera bị từ chối → nhập mã tay | — | Đang mở camera | QR lạ: "Mã không thuộc hệ thống" | Ánh sáng yếu: bật đèn flash |

## 5. Visual tokens
- **Logo**: chưa có file logo trong repo → áp 04 §2 case (c): accent theo ngành thủy sản = **teal-700 `#0f766e`** (chữ trắng trên nền accent ≈ 5,5:1 ✓). Khi có logo Đắc Lộc → chạy lại B1–B4, ghi vào History.
- **Neutral**: slate (accent lạnh). Nền trang slate-50, thẻ trắng, viền slate-200, chữ phụ slate-500, chữ chính slate-900. Dark: nền slate-950, thẻ slate-900, viền slate-800, chữ slate-100/400; accent dark = teal-400 trên nền tối (đo ≥ 4.5:1), chữ trên nút accent dark = slate-950.
- **Semantic**: success green-600 · warning amber-600 (chữ trên nền amber dùng amber-950) · danger red-600 · info blue-600. Trạng thái nước luôn có chữ/biểu tượng đi kèm màu.
- **Chart categorical** (≤ 6, không dùng semantic): teal-600, indigo-500, orange-500, fuchsia-500, lime-600, sky-500. Dải ngưỡng nước tô nền slate-100.
- **Font**: system font stack; số tabular-nums. Scale theo 04 §3; KPI 32px; mã bể mobile 18px.
- **Spacing**: thang 4/8/12/16/24/32/48; thẻ padding 16 (mobile) / 24 (desktop); bo góc 12px thẻ, 8px control.
- **Icon**: lucide-react duy nhất; không emoji làm icon.
- **Ảnh**: chỉ ở S1 (ảnh trại thực tế làm nền thẻ trại khi có) — không ảnh minh hoạ stock.

## Ngoại lệ đã duyệt
| Luật | Làm khác | Lý do |
|---|---|---|
| Body UI 14px [DEF] | Vùng `(field)` mobile: body 16px, số nhập 20px, nút chính 56dp | AUDIENCE: công nhân đứng ngoài trời, nắng, tay ướt/đeo găng |
| Desktop dày hơn mobile [DEF] | Bảng văn phòng hàng 48px (không 40) | AUDIENCE: nhân sự trại ít quen phần mềm, ưu tiên dễ đọc hơn mật độ |

## Anti-references
- Dashboard tối neon kiểu "control room", gradient tím-xanh, glassmorphism.
- Chữ thuyết minh dài trên UI; emoji trang trí; thẻ KPI hơn 4 cái một hàng.
- Font trang trí (Be Vietnam Pro, Plus Jakarta Sans, Fraunces) — dùng system stack.

## Platform
- **Desktop 1280px** (văn phòng: S1–S16): sidebar 240px, nội dung tối đa 1440px.
- **Tablet 768–1024px**: rail icon, lưới bể 4 cột, form Sheet 480px.
- **Mobile 375px** (hiện trường M1–M5, và S1/S3/S14 responsive cho U2/U5): bottom tabs, mọi thao tác chính chạm được bằng ngón cái (nửa dưới màn).
- PWA cài được trên Android/iOS; offline cho M1–M4; camera cho M5.
- Bất biến: touch target 44/48 · contrast 4.5:1 cả sáng/tối · focus ring `focus-visible` không bị huỷ · không thao tác nào chỉ qua hover · số theo locale.

## Nghiệm thu
Screenshot từng màn ở 375 / 768 / 1280, sáng + tối, đối chiếu từng ô ma trận trạng thái — lưu `docs/app-map/_screens/mvp/<màn>-<cỡ>-<trạng thái>.png`. Bản thử HTML S1, S3, M1+M2 (số liệu mẫu): [docs/prototypes/mvp-ban-thu.html](../prototypes/mvp-ban-thu.html) — bản xem: https://claude.ai/artifact/Dnk8EyP5BMsMihthGvP9Vh. Chờ user duyệt hướng nhìn trước khi code.

## History
- v1 (2026-11-07): khởi tạo từ ba-spec 11 — 16 màn văn phòng + 5 màn hiện trường.
- v2 (2026-11-07): nguyên tắc tổ chức thông tin §0b; S1 mở đầu kế hoạch/thực tế + xếp hạng trại; S2 thẻ bể có tiến độ tới thu; S3 timeline + checklist thu hoạch; M1 tiến độ việc; thêm S17 Kế hoạch; cảnh báo khẩn qua chuông.

**Last Updated**: 2026-11-07
