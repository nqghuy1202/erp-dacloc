"use client";
/** Hàng đợi nhật ký offline (IndexedDB). Mỗi dòng có UUID → server idempotent (R8, AC-6/7). */
export type OutItem = { id: string; tankId: number; kind: string; recordedAt: string; clientNow?: string; [k: string]: unknown };
type Listener = (s: { pending: number; online: boolean; syncing: boolean; lastError?: string }) => void;

const DB_NAME = "dl-outbox", STORE = "logs";
const listeners = new Set<Listener>();
let syncing = false, lastError: string | undefined;

function open(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB_NAME, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE, { keyPath: "id" });
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise((res, rej) => {
    const t = db.transaction(STORE, mode); const req = fn(t.objectStore(STORE));
    req.onsuccess = () => res(req.result); req.onerror = () => rej(req.error);
  });
}
export const pendingItems = () => tx<OutItem[]>("readonly", (s) => s.getAll() as IDBRequest<OutItem[]>).catch(() => [] as OutItem[]);
async function emit() {
  const items = await pendingItems();
  const st = { pending: items.length, online: typeof navigator === "undefined" ? true : navigator.onLine, syncing, lastError };
  listeners.forEach((l) => l(st));
}
export function subscribe(l: Listener) { listeners.add(l); void emit(); return () => { listeners.delete(l); }; }

export async function enqueue(item: OutItem) {
  await tx("readwrite", (s) => s.put({ ...item, clientNow: new Date().toISOString() }));
  await emit();
  void flush();
}

/** Gửi hàng đợi; dòng created/duplicate/rejected(lỗi nghiệp vụ) rời hàng đợi, lỗi mạng/401 giữ lại */
export async function flush(): Promise<{ rejected: { id: string; error?: string }[] }> {
  if (syncing || (typeof navigator !== "undefined" && !navigator.onLine)) return { rejected: [] };
  const items = await pendingItems();
  if (!items.length) { lastError = undefined; await emit(); return { rejected: [] }; }
  syncing = true; await emit();
  try {
    const res = await fetch("/api/logs/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: items.map((i) => ({ ...i, clientNow: new Date().toISOString() })) }) });
    if (!res.ok) { lastError = res.status === 401 ? "Cần đăng nhập lại" : `Lỗi ${res.status}`; return { rejected: [] }; }
    const { results } = (await res.json()) as { results: { id: string; status: string; error?: string }[] };
    for (const r of results) await tx("readwrite", (s) => s.delete(r.id));
    lastError = undefined;
    return { rejected: results.filter((r) => r.status === "rejected") };
  } catch {
    lastError = "Mất kết nối";
    return { rejected: [] };
  } finally {
    syncing = false; await emit();
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("online", () => { void flush(); });
  window.addEventListener("offline", () => { void emit(); });
  setInterval(() => { void flush(); }, 30000);
}
