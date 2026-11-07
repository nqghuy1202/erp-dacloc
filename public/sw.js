/* Service worker Đắc Lộc ERP — offline cho vùng hiện trường (ADR 0001).
 * Trang: network-first, rơi về bản đã lưu khi mất mạng. Tài nguyên tĩnh: cache-first.
 * Ghi dữ liệu KHÔNG đi qua SW: nhật ký nằm trong IndexedDB outbox (src/lib/outbox.ts). */
const VERSION = "dl-v1";
const PAGES = `${VERSION}-pages`, ASSETS = `${VERSION}-assets`;
const PRECACHE = ["/hien-truong", "/hien-truong/be", "/hien-truong/canh-bao", "/hien-truong/toi", "/icon.svg", "/manifest.webmanifest"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(PAGES).then((c) => Promise.allSettled(PRECACHE.map((u) => c.add(u)))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin || url.pathname.startsWith("/api/")) return;
  if (url.pathname.startsWith("/_next/static/") || /\.(png|svg|webmanifest|ico|woff2?)$/.test(url.pathname)) {
    e.respondWith(caches.open(ASSETS).then(async (c) => (await c.match(req)) || fetch(req).then((r) => { if (r.ok) c.put(req, r.clone()); return r; })));
    return;
  }
  if (req.mode === "navigate" && url.pathname.startsWith("/hien-truong")) {
    e.respondWith(fetch(req).then((r) => { if (r.ok) caches.open(PAGES).then((c) => c.put(req, r.clone())); return r; })
      .catch(async () => (await caches.match(req)) || (await caches.match("/hien-truong")) || new Response("Ngoại tuyến", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } })));
  }
});
