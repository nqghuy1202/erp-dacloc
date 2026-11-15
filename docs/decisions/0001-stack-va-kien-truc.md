# ADR 0001 — Stack và kiến trúc MVP

> Load khi: chọn thư viện, thêm tầng mới, đổi cách truy cập DB / đăng nhập / phân quyền.
covers: src/, drizzle/, package.json
last_verified: 2026-11-15
ttl_days: 180

## Bối cảnh
MVP sản xuất giống + kho (ba-spec 11, design-spec 12). User chốt: Supabase cloud, đăng nhập mã NV + mật khẩu, commit thẳng main, deploy Vercel, song ngữ, PWA offline.

## Quyết định
| Vùng | Chọn | Lý do |
|---|---|---|
| Web | Next.js 15 App Router (ghim bản vá bảo mật, hiện `15.5.29`) + React 19 + TypeScript strict | Server Components + Server Actions, chạy tốt trên Vercel |
| UI | ~~Tailwind 3 + component tối giản theo API shadcn~~ → thay bởi [ADR 0003](0003-design-system-astryx.md) (Astryx + Tailwind 4, 2026-11-15) | Ngoại lệ [STACK]: không chạy CLI shadcn/radix để giữ phụ thuộc ít; dùng `<dialog>` native. `// nợ: component tự viết tối giản, chuyển sang shadcn khi cần combobox/menu phức tạp` |
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
- Next.js phải ở bản đã vá: Vercel CHẶN deploy bản có lỗ hổng đã công bố ("Vulnerable version of Next.js detected"). 2026-11-15 nâng 15.1.6 → 15.5.29 (nhãn npm `backport`, dòng 15 còn được vá), kèm `eslint-config-next` 15.5.29 và `@playwright/test` 1.49.1 → 1.51.1 (peer của Next 15.5). Nâng tiếp: theo nhãn `backport` của npm cho tới khi chuyển Next 16 có chủ đích.
- `vercel.json` khai `"framework": "nextjs"`: project Vercel từng đặt Framework Preset = "Other" nên build xong vẫn trả 404 NOT_FOUND (2026-11-15). Khai trong repo để không phụ thuộc cài đặt trên dashboard.
