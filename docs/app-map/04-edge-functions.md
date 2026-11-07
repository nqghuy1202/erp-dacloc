# 04 — API routes (thay cho edge function)

> Load khi: thêm/sửa route `src/app/api/*`.
covers: src/app/api
last_verified: 2026-11-07
ttl_days: 90

| Route | Method | Auth | Việc |
|---|---|---|---|
| /api/logs/sync | POST `{items[]}` ≤ 500 | cookie phiên | Đồng bộ outbox nhật ký; trả `{results:[{id,status,error}]}` (created/duplicate/rejected) |
| /api/cron/daily | GET | `Authorization: Bearer $CRON_SECRET` | generateDailyTasks + runEscalation |
| /api/resolve?code= | GET | cookie phiên | Mã bể → `/hien-truong/be/:id`; mã lô/QR → `/truy-xuat/:token` |
| /api/qr/[token] | GET | cookie phiên | SVG QR của URL truy xuất |
