# src/components

> Load khi: thêm/sửa UI dùng chung. Hệ thiết kế: Astryx, theme `dacloc` ([ADR 0003](../../docs/decisions/0003-design-system-astryx.md), design-spec 12 §5). Tra component: `npx astryx search "<cần gì>"`, `npx astryx component <Tên>`.
> Luật: văn phòng dùng component Astryx; PWA hiện trường + đăng nhập KHÔNG import `@astryxdesign/core` (chỉ `field/*`, `ui/form.tsx`, `ui/progress.tsx`, `ui/cn.ts`, `theme-mode.tsx`, `roles.ts`) — đo bundle bằng `npm run build` trước khi đổi.

| File | Việc |
|---|---|
| providers.tsx | Gốc giao diện: `Theme` Astryx `dacloc` (mode từ cookie `theme`), i18n Astryx `vi-VN`/`en`, `LinkProvider` next/link; nghe sự kiện `dacloc:theme` |
| theme-mode.tsx | Ngữ cảnh sáng/tối (`useThemeMode`, `useEffectiveDark`) — không import Astryx |
| ui/index.tsx | Button, LinkButton, Card(+Header/Body), Badge, PageHeader, Empty, Stat (bọc Astryx, giữ API cũ); Table tĩnh; Field/Input/Select/Textarea (native, nợ chuyển TextInput/Selector) |
| ui/client.tsx | Submit, Sheet (`<dialog>`), ThemeIconButton (Astryx) + re-export ActionForm/toast/Toaster |
| ui/form.tsx | ActionForm (useActionState + toast), Toaster/toast — không phụ thuộc Astryx |
| ui/data-table.tsx | DataTable: Astryx Table + ô tìm không dấu + sắp xếp cột phía trình duyệt (cột/dòng truyền từ server) |
| ui/search.ts · text.ts | fold/matchRows (tìm không dấu) · textOf (nhãn chữ từ children) — hàm thuần, có unit test |
| ui/progress.tsx | Progress có vạch mốc (theo token) |
| ui/cn.ts | nối className |
| brand.tsx | BrandLogo (logo Đắc Lộc), BrandWave (dải sóng màn đăng nhập) |
| status.tsx · roles.ts | StatusBadge (bộ từ vựng trạng thái chung) · ROLE_LABEL (tách riêng cho hiện trường) |
| shell/nav.ts | Danh mục điều hướng văn phòng theo vai trò |
| shell/frame.tsx | Shell: Astryx AppShell + TopNav (logo, chuông/sáng-tối/tài khoản) + SideNav (thu gọn thành rail, nhớ ở localStorage; mobile ngăn menu tự động) |
| shell/account-menu.tsx · bell.tsx · initials.ts | Popover tài khoản (tên/vai trò/ngôn ngữ/đăng xuất), chuông số cảnh báo, chữ cái đầu |
| field/ui.tsx · client.tsx | Bản nhẹ cho PWA: FieldBadge, FieldEmpty, FieldLinkButton (56dp) · FieldSubmit, FieldThemeToggle |
| field/tabs.tsx · top.tsx · sync-badge.tsx | Bottom tabs, header, trạng thái đồng bộ vùng hiện trường |
| charts/weekly.tsx | Biểu đồ sản lượng tuần (SVG, màu theo biến Astryx) |
