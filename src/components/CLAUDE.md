# src/components

> Load khi: thêm/sửa UI dùng chung. Token màu ở src/app/globals.css (design-spec 12 §5).

| File | Việc |
|---|---|
| ui/index.tsx | Button, LinkButton, Card, Badge, PageHeader, Empty, Stat, Table, Field/Input/Select/Textarea, Progress |
| ui/client.tsx | ActionForm (useActionState + toast), Submit, Sheet (`<dialog>`), Toaster/toast, ThemeToggle |
| ui/cn.ts | nối className |
| status.tsx | StatusBadge (bộ từ vựng trạng thái chung), ROLE_LABEL |
| shell/nav.ts · sidebar.tsx · bell.tsx | Điều hướng văn phòng theo vai trò, chuông thông báo |
| field/tabs.tsx · top.tsx · sync-badge.tsx | Bottom tabs, header, trạng thái đồng bộ vùng hiện trường |
| charts/weekly.tsx | Biểu đồ sản lượng tuần (SVG) |
