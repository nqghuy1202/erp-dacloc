# 01 — Pages & navigation

> Load khi: thêm route, đổi điều hướng.
covers: src/app, src/components/shell, src/components/field
last_verified: 2026-11-07
ttl_days: 90

| Route | Màn (design-spec 12) | Vai trò |
|---|---|---|
| /dang-nhap | Đăng nhập | công khai |
| / | S1 Tổng quan | director, farm_lead, admin |
| /san-xuat/ke-hoach | S17 Kế hoạch | farm_lead, director |
| /san-xuat/trai, /san-xuat/trai/[farmId] | S2 Trại | farm_lead, director, lab |
| /san-xuat/bo-me | S4 Đàn bố mẹ | farm_lead, director, lab |
| /san-xuat/me-de | S5 Mẻ đẻ + mở lô | farm_lead, director |
| /san-xuat/lo, /san-xuat/lo/[id] | S6 Lô ương, S3 Chi tiết lô | farm_lead, director, lab |
| /san-xuat/su-co | S7 Sự cố | farm_lead, director |
| /xet-nghiem, /xet-nghiem/[id] | S8 Hàng đợi mẫu, S9 Phiếu kết quả | lab, farm_lead, director |
| /kho | S10 Tồn kho | storekeeper, farm_lead, director |
| /kho/nhap | S11 Phiếu nhập | storekeeper, director |
| /kho/yeu-cau | S12 Yêu cầu cấp | storekeeper, farm_lead, director |
| /kho/kiem-ke, /kho/kiem-ke/[id] | S13 Kiểm kê | storekeeper, farm_lead, director |
| /truy-xuat, /truy-xuat/[token], /truy-xuat/[token]/tem | S14 Truy xuất + tem QR | mọi vai trò đã đăng nhập |
| /thong-bao | Thông báo, cảnh báo mở | mọi vai trò |
| /cai-dat/danh-muc | S15 Danh mục & import | admin |
| /cai-dat/nguoi-dung | S16 Người dùng & quyền | admin |
| /hien-truong | M1 Hôm nay | worker, farm_lead |
| /hien-truong/be, /hien-truong/be/[tankId] | M3 Bể của tôi, M2 Ghi nhật ký | worker, farm_lead |
| /hien-truong/canh-bao | M4 Cảnh báo | worker, farm_lead |
| /hien-truong/quet | M5 Quét | worker, farm_lead |
| /hien-truong/toi | Tôi (ngôn ngữ, giao diện, đăng xuất) | worker, farm_lead |

Điều hướng: sidebar văn phòng 5 nhóm (`src/components/shell/nav.ts`, lọc theo vai trò); bottom tabs hiện trường 5 mục.
