# 03 — Database & automation

> Load khi: đổi schema, migration, RLS, cron/việc nền.
covers: src/lib/db, drizzle, scripts/migrate.mjs, scripts/seed.ts, src/app/api/cron
last_verified: 2026-11-07
ttl_days: 90

Nguồn schema: `src/lib/db/schema.ts` → `npm run db:generate` → `drizzle/NNNN_*.sql` → `npm run db:migrate`.

| Nhóm | Bảng | Ghi chú |
|---|---|---|
| Danh mục | farms, tanks, species, stages, water_thresholds, materials, warehouses | stages mang lịch mẫu cho ăn/đo nước (NV15) |
| Người dùng | users, user_farms, tank_workers | quyền theo trại (R1), bể giao công nhân |
| Sản xuất | broodstocks, spawn_batches, lots, logs, lab_tests, incidents, finished_lots | `lots_one_rearing_per_tank` (R4); logs.id = UUID máy khách (R8) |
| Cảnh báo | alerts, notifications | `alerts_dedupe` trên dedupe_key khi chưa đóng |
| Kho | stock_lots, stock_tx, receipts(+lines), requests(+lines), stock_counts(+lines) | tồn = Σ stock_tx; `stock_tx_ref` (ref_key, material) → tiêu hao idempotent |
| Kế hoạch | plans, plan_lines, tasks | `tasks_auto_unique` (R12) |

**RLS**: migration `0001_rls.sql` bật RLS cho 30 bảng, không policy → API REST anon/authenticated của Supabase không truy cập được. App truy cập bằng role chủ bảng từ server. Test `tests/smoke.test.ts` chặn bảng thiếu RLS.

**Việc nền** (idempotent, gọi lặp an toàn):
| Việc | Gọi bởi | Hàm |
|---|---|---|
| Sinh việc hằng ngày | Vercel Cron 00:00 VN (`vercel.json` 17:00 UTC) + mở `/hien-truong` | `generateDailyTasks` |
| Leo thang cảnh báo > 2h | Vercel Cron + mở `/` | `runEscalation` |

## History
- v1 (2026-11-07): schema MVP 30 bảng, RLS.
