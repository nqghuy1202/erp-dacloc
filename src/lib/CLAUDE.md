# src/lib

> Load khi: đổi kết nối DB, phiên đăng nhập, ngôn ngữ, offline outbox.

| File | Việc |
|---|---|
| db/schema.ts | Toàn bộ bảng Drizzle (+ `RLS_TABLES`) — đổi schema → `npm run db:generate` |
| db/client.ts | Kết nối postgres-js tới Supabase (server-only, `prepare:false` cho pooler) |
| db/types.ts | Kiểu `DB` chung cho postgres-js / PGlite |
| session.ts | getActor, requireActor(roles) → redirect, homeFor, getT/getLocale |
| action.ts | `run()` bọc server action → ActionState; map mã lỗi → tiếng Việt |
| i18n.ts | Từ điển vi/en + định dạng số/ngày theo locale |
| outbox.ts | IndexedDB outbox cho nhật ký offline, flush tới /api/logs/sync |
