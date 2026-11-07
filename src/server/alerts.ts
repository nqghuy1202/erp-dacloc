import { and, eq, inArray, lt, sql } from "drizzle-orm";
import type { DB } from "@/lib/db/types";
import { alerts, notifications, userFarms, users } from "@/lib/db/schema";
import type { Actor, Role } from "./types";
import { assertFarm } from "./access";
import { fail } from "./errors";

export const ESCALATE_AFTER_MS = 2 * 60 * 60 * 1000; // H4: 2 giờ

type NewAlert = {
  type: string; severity?: "warn" | "bad"; farmId?: number | null; lotId?: number | null; tankId?: number | null;
  title: string; detail?: string; dedupeKey?: string; notifyRoles?: Role[]; notifyUserIds?: number[];
};

async function usersFor(db: DB, roles: Role[], farmId: number | null | undefined) {
  if (!roles.length) return [] as number[];
  const rows = await db.select({ id: users.id, role: users.role }).from(users).where(and(inArray(users.role, roles), eq(users.active, true)));
  const global = rows.filter((r) => r.role === "director" || r.role === "admin").map((r) => r.id);
  const scoped = rows.filter((r) => r.role !== "director" && r.role !== "admin").map((r) => r.id);
  if (!farmId || !scoped.length) return [...global, ...(farmId ? [] : scoped)];
  const inFarm = await db.select({ userId: userFarms.userId }).from(userFarms).where(and(eq(userFarms.farmId, farmId), inArray(userFarms.userId, scoped)));
  return [...global, ...inFarm.map((r) => r.userId)];
}

/** Tạo cảnh báo + thông báo; dedupeKey tránh trùng khi cảnh báo cũ còn mở */
export async function raiseAlert(db: DB, a: NewAlert) {
  if (a.dedupeKey) {
    const [ex] = await db.select().from(alerts).where(and(eq(alerts.dedupeKey, a.dedupeKey), sql`${alerts.status} <> 'closed'`));
    if (ex) return ex;
  }
  const [row] = await db.insert(alerts).values({
    type: a.type, severity: a.severity ?? "warn", farmId: a.farmId ?? null, lotId: a.lotId ?? null, tankId: a.tankId ?? null,
    title: a.title, detail: a.detail ?? "", dedupeKey: a.dedupeKey ?? null,
  }).returning();
  const ids = new Set([...(await usersFor(db, a.notifyRoles ?? ["farm_lead"], a.farmId)), ...(a.notifyUserIds ?? [])]);
  if (ids.size) await db.insert(notifications).values([...ids].map((userId) => ({ userId, type: a.type, alertId: row.id, title: a.title })));
  return row;
}

export async function ackAlert(db: DB, actor: Actor, alertId: number) {
  if (!["farm_lead", "director", "admin"].includes(actor.role)) fail("forbidden", "Không có quyền xác nhận cảnh báo");
  const [a] = await db.select().from(alerts).where(eq(alerts.id, alertId));
  if (!a) fail("not_found");
  if (a!.farmId) assertFarm(actor, a!.farmId);
  const [row] = await db.update(alerts).set({ status: "ack", ackAt: new Date(), ackBy: actor.id }).where(eq(alerts.id, alertId)).returning();
  return row;
}

export async function closeAlert(db: DB, alertId: number) {
  await db.update(alerts).set({ status: "closed" }).where(eq(alerts.id, alertId));
}

/** H4/AC-10: cảnh báo mở quá 2h chưa xác nhận → leo thang BGĐ. Idempotent. */
export async function runEscalation(db: DB, now = new Date()) {
  const cutoff = new Date(now.getTime() - ESCALATE_AFTER_MS);
  const due = await db.select().from(alerts).where(and(eq(alerts.status, "open"), eq(alerts.escalated, false), lt(alerts.createdAt, cutoff)));
  if (!due.length) return 0;
  const directors = await usersFor(db, ["director"], null);
  for (const a of due) {
    await db.update(alerts).set({ escalated: true }).where(eq(alerts.id, a.id));
    if (directors.length) await db.insert(notifications).values(directors.map((userId) => ({ userId, type: "escalation", alertId: a.id, title: `Leo thang: ${a.title}` })));
  }
  return due.length;
}
