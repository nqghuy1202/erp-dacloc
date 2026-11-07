import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import type { DB } from "@/lib/db/types";
import { alerts, farms, finishedLots, materials, planLines, plans, stockTx, warehouses } from "@/lib/db/schema";
import type { Actor } from "./types";
import { seesAllFarms } from "./types";

/** Cảnh báo mở, sắp theo mức độ rồi thời gian (S1, M4) */
export async function openAlerts(db: DB, actor: Actor, limit = 50) {
  const scope = seesAllFarms(actor) ? sql`true` : actor.farmIds.length ? sql`(${alerts.farmId} is null or ${inArray(alerts.farmId, actor.farmIds)})` : sql`false`;
  return db.select({ a: alerts, farmName: farms.name }).from(alerts).leftJoin(farms, eq(farms.id, alerts.farmId))
    .where(and(sql`${alerts.status} <> 'closed'`, scope))
    .orderBy(sql`case when ${alerts.severity} = 'bad' then 0 else 1 end`, desc(alerts.createdAt)).limit(limit);
}

/** Sản lượng thu 12 tuần gần nhất: thực tế + kế hoạch đã duyệt */
export async function weeklyHarvest(db: DB, weeks = 12, now = new Date()) {
  const start = new Date(now.getTime() - weeks * 7 * 86400e3);
  const actual = await db.select({ wk: sql<string>`to_char(date_trunc('week', ${finishedLots.harvestedAt} at time zone 'Asia/Ho_Chi_Minh'), 'YYYY-MM-DD')`, q: sql<number>`sum(${finishedLots.qty})::float8` })
    .from(finishedLots).where(gte(finishedLots.harvestedAt, start)).groupBy(sql`1`);
  const plan = await db.select({ wk: sql<string>`to_char(date_trunc('week', ${planLines.harvestDate}::timestamp), 'YYYY-MM-DD')`, q: sql<number>`sum(${planLines.harvestQty})::float8` })
    .from(planLines).innerJoin(plans, eq(plans.id, planLines.planId))
    .where(and(eq(plans.status, "approved"), gte(planLines.harvestDate, start.toISOString().slice(0, 10)))).groupBy(sql`1`);
  const out: { week: string; actual: number; plan: number }[] = [];
  const monday = new Date(now); monday.setUTCHours(0, 0, 0, 0); monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date(monday.getTime() - i * 7 * 86400e3).toISOString().slice(0, 10);
    out.push({ week: d, actual: Number(actual.find((a) => a.wk === d)?.q ?? 0), plan: Number(plan.find((p) => p.wk === d)?.q ?? 0) });
  }
  return out;
}

export async function survival30(db: DB, now = new Date()) {
  const [r] = await db.select({ v: sql<number>`avg(${finishedLots.survivalRate})::float8`, n: sql<number>`count(*)::int` })
    .from(finishedLots).where(gte(finishedLots.harvestedAt, new Date(now.getTime() - 30 * 86400e3)));
  return r.n ? Number(r.v) : null;
}

/** Vật tư dưới mức tối thiểu ở kho tổng + kho trại trong phạm vi */
export async function lowStock(db: DB, actor: Actor, limit = 5) {
  const rows = await db.select({ wh: warehouses, m: materials, qty: sql<number>`coalesce(sum(${stockTx.qty}),0)::float8` })
    .from(materials).innerJoin(warehouses, sql`${warehouses.farmId} is null`)
    .leftJoin(stockTx, and(eq(stockTx.materialId, materials.id), eq(stockTx.warehouseId, warehouses.id)))
    .where(and(eq(materials.banned, false), sql`${materials.minStock} > 0`))
    .groupBy(warehouses.id, materials.id);
  void actor;
  return rows.map((r) => ({ ...r, qty: Number(r.qty) })).filter((r) => r.qty < r.m.minStock).sort((a, b) => a.qty / a.m.minStock - b.qty / b.m.minStock).slice(0, limit);
}
