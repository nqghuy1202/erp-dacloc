# ADR 0003 — Dùng design system Astryx cho giao diện

> Load khi: thêm/sửa component UI, đổi theme/màu, thêm thư viện UI, đụng bundle PWA hiện trường.
covers: src/components, src/app/globals.css, src/app/layers.css, themes/dacloc, src/themes, src/astryx-themes.ts, package.json
last_verified: 2026-11-15
ttl_days: 180

## Bối cảnh
Giao diện MVP dùng bộ component tự viết tối giản (ADR 0001, dòng UI) — user thấy sơ sài, bảng khó dùng, form/dialog chưa tốt. User (2026-11-15) chọn dùng Astryx (Meta, `@astryxdesign/core`, bản beta) thay dần, cài từ npm, nâng Tailwind 3 → 4, giữ nhận diện Đắc Lộc, PWA hiện trường phải giữ nhẹ (tăng JS > ~30% thì chỉ dùng token).

## Quyết định
| Vùng | Chọn | Lý do |
|---|---|---|
| Thư viện | `@astryxdesign/core` + `theme-neutral` + `cli` + `@stylexjs/stylex`, ghim đúng `0.7.16` (bản ổn định mới nhất trên npm) | Beta → ghim cứng, nâng bằng `npx astryx upgrade --from 0.7.16 --apply` |
| Theme | Theme riêng `dacloc` dựng bằng `npx astryx experimental theme editor` từ `neutral`: accent `#108040`, success teal `#0f766e`, warning `#b45309`, danger `#dc2626`, info `#2563eb`, neutral slate, font hệ thống, góc 8px (khung 12px) | Giữ nhận diện (design-spec 12 §5). Warning đổi amber-600 → amber-700 vì editor báo amber-600 chỉ đạt 2,82:1 với nền (cần 3:1 cho mảng màu) |
| Tailwind | v4, layer: `reset, theme, base, astryx-base, astryx-theme, components, utilities` khai ở `layers.css` (import đầu tiên) | Theo `astryx docs migration/migration-setup`. KHÔNG dùng `tailwind-theme.css` (cầu nối) vì nó đổi nghĩa `bg-surface`/`rounded-lg`/`shadow-md` đang dùng; thay vào đó `@theme reference inline` trỏ tên token cũ của app (`bg-surface`, `text-fg-2`, `bg-accent`…) vào biến Astryx → mọi màn đổi theo theme |
| Sáng/tối | Cookie `theme` đọc ở server (`getThemeMode`) → `data-theme` trên `<html>` + `<Theme mode>` | Theme Astryx tự đồng bộ `data-theme`; đọc ở server để không nháy màu |
| Ngôn ngữ | `InternationalizationProvider` với catalog `vi-VN` của Astryx theo cookie `locale` | Nhãn sẵn của Astryx (ngăn menu, thu gọn thanh bên…) hiện tiếng Việt |
| Khung văn phòng | `AppShell` + `TopNav` + `SideNav` (thu gọn thành rail, nhớ ở localStorage; mobile tự có ngăn menu) | Thay sidebar/topbar tự viết |
| Component dùng chung | `src/components/ui/index.tsx` giữ API cũ, bên trong là Astryx (Button, Badge, Card, Heading, EmptyState) | 29 màn đổi giao diện mà không phải sửa từng trang |
| Bảng | `DataTable` (Astryx Table + tìm không dấu + sắp xếp) phía trình duyệt | Màn mẫu S6; các bảng khác chuyển ở giai đoạn 2 |
| Hiện trường | `src/components/field/{ui,client}.tsx` — bản nhẹ chỉ dùng token, KHÔNG import component Astryx; `ui/form.tsx` (ActionForm/toast) không phụ thuộc Astryx; nút sáng/tối hiện trường phát sự kiện `dacloc:theme` | Đo 2026-11-15: dùng component Astryx làm `/hien-truong/be/[tankId]` 115 → 289 kB. Sau khi tách: mọi màn `/hien-truong/*` và `/dang-nhap` thay đổi −1…+2% |

## Hệ quả
- JS tải lần đầu của màn văn phòng tăng ~ +62…+68% (≈ 110 → 185 kB); `/san-xuat/lo` 109 → 271 kB (+149%) do Table. Chấp nhận cho văn phòng (máy bàn, mạng ổn định). `// nợ: Table Astryx nặng; trần 271 kB ở S6, nâng cấp: lazy-load DataTable khi bảng > 1 màn hoặc khi đo LCP văn phòng > 2,5s`.
- Field/Input/Select/Textarea vẫn là phần tử native (server action dùng form không kiểm soát) — chuyển sang `TextInput`/`Selector` (`htmlName`) từng form ở giai đoạn 2.
- Build in 61 cảnh báo CSS `Unknown at rule: @property` từ trình tối ưu CSS của Next — vô hại (trình duyệt hỗ trợ).
- Người đã chọn sáng/tối trước đây (localStorage) sẽ về theo hệ điều hành một lần, chọn lại thì lưu cookie.
- `npx astryx init` đã thêm khối `ASTRYX` vào CLAUDE.md gốc (khối do Astryx quản lý).
- Sửa ADR 0001 dòng UI: thay bằng ADR này.
