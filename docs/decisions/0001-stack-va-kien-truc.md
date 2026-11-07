# ADR 0001 — Stack và kiến trúc MVP

> Load khi: chọn thư viện, thêm tầng mới, đổi cách truy cập DB / đăng nhập / phân quyền.
covers: src/, drizzle/, package.json
last_verified: 2026-11-07
ttl_days: 180

## Bối cảnh
MVP sản xuất giống + kho (ba-spec 11, design-spec 12). User chốt: Supabase cloud, đăng nhập mã NV + mật khẩu, commit thẳng main, deploy Vercel, song ngữ, PWA offline.

## Quyết định
| Vùng | Chọn | Lý do |
|---|---|---|
| Web | Next.js 15 App Router + React 19 + TypeScript strict | Server Components + Server Actions, chạy tốt trên Vercel |
| UI | Tailwind 3 + component tối giản theo API shadcn trong `src/components/ui` | Ngoại lệ [STACK]: không chạy CLI shadcn/radix để giữ phụ thuộc ít; dùng `<dialog>` native. `// nợ: component tự viết tối giản, chuyển sang shadcn khi cần combobox/menu phức tạp` |
| DB | Postgres của Supabase, truy cập qua Drizzle ORM + `postgres` (server-only) | Một nguồn schema có kiểu; migration bằng drizzle-kit |
| Auth | Tự làm: mã NV + bcrypt, phiên là JWT ký HS256 (jose) trong cookie httpOnly | Supabase Auth bắt buộc email; user chọn mã NV |
| Phân quyền | Kiểm ở server trong từng hàm nghiệp vụ (`requireUser`, `assertFarm`) theo role + trại (R1) | Truy cập DB chỉ từ server với role postgres |
| RLS | BẬT RLS trên mọi bảng `public`, KHÔNG policy nào → API REST/anon của Supabase không đọc được gì | Chặn đường vào thứ hai; server dùng role chủ bảng nên không bị ảnh hưởng |
| Logic nghiệp vụ | Hàm thuần nhận `db` trong `src/server/<domain>` | Test integration bằng PGlite (Postgres nhúng), không chạm DB cloud (L2) |
| Offline | Service worker + IndexedDB outbox; mỗi dòng nhật ký mang UUID do máy sinh → server idempotent (R8) | AC-6, AC-7 |
| Việc nền | Hàm idempotent `runDaily`, `runEscalation`; gọi bởi Vercel Cron + gọi lười khi mở màn liên quan | Hobby cron chỉ 1 lần/ngày |
| i18n | Từ điển `vi`/`en` tự viết, cookie `locale` | 2 ngôn ngữ, không cần thư viện |
| QR | thư viện `qrcode` sinh SVG | S14 in tem |
| Test | Vitest (unit + integration PGlite); e2e: Playwright | Theo ba-spec §10 |

## Hệ quả
- Không dùng supabase-js; khoá anon/service của Supabase không cần trong app.
- Mọi bảng mới phải có `enable row level security` trong migration (kiểm bằng test `rls.test.ts`).
- Session secret `AUTH_SECRET` và `DATABASE_URL` chỉ ở `.env.local` / biến môi trường Vercel.
