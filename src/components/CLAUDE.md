# src/components

> Load khi: thêm/sửa UI dùng chung. Token màu ở src/app/globals.css (design-spec 12 §5).

| File | Việc |
|---|---|
| ui/index.tsx | Button, LinkButton, Card, Badge, PageHeader, Empty, Stat, Table, Field/Input/Select/Textarea, Progress |
| ui/client.tsx | ActionForm (useActionState + toast), Submit, Sheet (`<dialog>`), Toaster/toast, ThemeToggle (nhóm chữ, màn Tôi), ThemeIconButton (nút icon ở header) |
| ui/cn.ts | nối className |
| brand.tsx | BrandLogo (logo Đắc Lộc), BrandWave (dải sóng màn đăng nhập) |
| status.tsx | StatusBadge (bộ từ vựng trạng thái chung), ROLE_LABEL |
| shell/nav.ts · sidebar.tsx | Điều hướng văn phòng theo vai trò; Sidebar là component điều khiển (open/hidden nhận từ Shell), chân chỉ còn ô tra mã |
| shell/frame.tsx | Shell: giữ trạng thái menu (mở ngăn mobile, ẩn sidebar desktop, nhớ ở localStorage) và dựng Sidebar + Topbar + main |
| shell/topbar.tsx · account-menu.tsx · bell.tsx · initials.ts | Thanh header văn phòng (design-spec 12 §1b): nút menu, chuông, tài khoản (popover tên/vai trò/ngôn ngữ/đăng xuất), chữ cái đầu |
| field/tabs.tsx · top.tsx · sync-badge.tsx | Bottom tabs, header, trạng thái đồng bộ vùng hiện trường |
| charts/weekly.tsx | Biểu đồ sản lượng tuần (SVG) |
