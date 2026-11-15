# ADR 0002 — Khai báo: nơi build, quyền theo phòng ban, phiên bản + duyệt

> Load khi: thêm hoặc sửa trang khai báo, bảng danh mục, vai trò, cơ chế duyệt/phiên bản, hoặc khi cần biết vì sao build ở erp-dacloc thay vì SDAqua.
covers: src/server, src/lib/db/schema.ts, src/app/(office)/cai-dat
last_verified: 2026-11-13
ttl_days: 180

## Bối cảnh
Biên bản họp Đắc Lộc 2026-11-10 và kế hoạch Phân hệ sản xuất của SDAqua (`docs/app-map/14`, Q5) ghi "xây tiếp trên SDAqua, không dùng erp-dacloc". Ngày 2026-11-13 user chốt làm các trang khai báo cho demo ngay trong erp-dacloc (đã có shell, kho, nhật ký, truy xuất chạy ở cổng 3001). Danh sách 21 trang và lý do: [research 03](../research/03-trang-khai-bao.md); hành vi: [ba-spec 11](../app-map/11-ba-spec-mvp-san-xuat-kho.md) NV0a–NV0f, NV16.

## Quyết định
| Vùng | Chọn | Lý do |
|---|---|---|
| Nơi build | erp-dacloc. Quyết định này thay Q5 của kế hoạch SDAqua cho phần khai báo của demo | user chốt; erp-dacloc đã có đủ luồng demo |
| Điều hướng | Nhóm menu "Khai báo" có trang tổng quan + 4 nhóm con; mỗi danh mục một route, route cũ `/cai-dat/danh-muc` được thay dần | phân quyền theo trang dễ hơn tab trong một trang dài |
| Quyền | Theo phòng ban (R15): thêm vai trò R&D, Kỹ thuật, Phụ trách ATSH; không có vai trò "sửa tất cả" | chuyên môn nằm ở phòng ban; admin không chịu trách nhiệm ngưỡng hay quy trình |
| Duyệt và phiên bản | Chỉ cho nhóm cần duyệt (ngưỡng, quy trình, bệnh, khu sạch–bẩn, khử trùng, bỏ cờ cấm): bản nháp → U5 duyệt → phiên bản mới, bản cũ giữ; lô giữ phiên bản lúc mở khi nới lỏng (R13) | ưu tiên 1 là an toàn sinh học và hồ sơ GlobalGAP |
| Quy trình duyệt chung | Mọi chứng từ cần duyệt (lệnh sản xuất, kế hoạch, khai báo cần duyệt, kiểm kê…) dùng một cơ chế cấu hình theo nghiệp vụ: 0..n cấp tuần tự, mỗi cấp người duyệt chính + người thay là nhân viên cụ thể, điều kiện bỏ qua/thêm cấp, quy tắc đánh số (R21–R23). Duyệt cố định hiện có chuyển thành cấu hình mặc định giữ hành vi cũ | user chốt "theo nghiệp vụ", người duyệt theo nhân viên cụ thể |
| Nhân viên | Nhân viên là hồ sơ gốc (phòng ban, chức vụ, cơ sở/trại, ca/tổ); tài khoản đăng nhập gắn vào nhân viên, tối đa 1 | user chốt |
| Xoá | Không xoá mục đã được tham chiếu, chỉ "ngừng sử dụng" (R14) | giữ truy xuất lô cũ |
| Nhật ký thay đổi | Mọi khai báo ghi ai/gì/lúc nào | mặc định an toàn, phục vụ đánh giá GlobalGAP |
| Logic | Giữ ADR 0001: nghiệp vụ trong `src/server/*` nhận `db`, kiểm quyền ở server, mọi bảng mới `ENABLE ROW LEVEL SECURITY` | không đổi |

Cơ chế lưu phiên bản (bảng phiên bản chung hay cột trạng thái trên từng bảng) chưa chọn; chọn ở bước dựng khung của story E5-05 và ghi bổ sung ở đây.

## Hệ quả
- Migration chủ yếu thêm bảng và cột nullable (cơ sở, loại đơn vị nuôi, nhà cung cấp, quy trình, định mức, thiết bị, ca/tổ, bệnh, khu, hoá chất, đơn vị quy đổi, bảng duyệt/phiên bản). Thêm giá trị vào `role` và `farm_kind` là additive.
- Mức RED cần user xác nhận trước khi làm: tách loài "Tôm hùm" thành bông và xanh nếu đã có lô tham chiếu; chuyển `species.requiredDiseases` sang bảng bệnh khi đã có dữ liệu; thay đổi RLS của bảng đang phục vụ.
- Doc phải cập nhật cùng code: app-map 01 (route), 02 (form), 03 (schema), 05 (vai trò, ma trận quyền), 06 (flow), `src/server/CLAUDE.md`, `src/app/CLAUDE.md`; test E2E ma trận vai trò (AC-28).
- Kế hoạch SDAqua vẫn ghi Q5 cũ; user cập nhật ở repo đó.

**Last Updated**: 2026-11-13
