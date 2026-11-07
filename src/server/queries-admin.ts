import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import type { DB } from "@/lib/db/types";
import {
  farms, materials, planLines, plans, receiptLines, receipts, requestLines, requests, species, stages, stockCountLines,
  stockCounts, tanks, userFarms, users, warehouses, waterThresholds,
} from "@/lib/db/schema";
import { canFarm } from "./access";
import type { Actor } from "./types";
import { seesAllFarms } from "./types";

/** Trại trong phạm vi người dùng (R1) */
export async function farmsInScope(db: DB, actor: Actor) {
  const all = await db.select().from(farms).orderBy(asc(farms.code));
  return all.filter((f) => canFarm(actor, f.id));
}

export async function farmsWithTankCount(db: DB) {
  return db.select({ f: farms, tanks: sql<number>`count(${tanks.id})::int` }).from(farms)
    .leftJoin(tanks, eq(tanks.farmId, farms.id)).groupBy(farms.id).orderBy(asc(farms.code));
}

export async function materialsAll(db: DB) {
  return db.select().from(materials).orderBy(asc(materials.name));
}

export async function tanksOfFarm(db: DB, farmId: number) {
  return db.select().from(tanks).where(eq(tanks.farmId, farmId)).orderBy(asc(tanks.code));
}

/** Kho người dùng được thấy (cùng luật với stockList) */
export async function warehousesInScope(db: DB, actor: Actor) {
  const whs = await db.select().from(warehouses).orderBy(sql`${warehouses.farmId} nulls first`, asc(warehouses.code));
  return whs.filter((w) => w.farmId == null ? actor.role !== "worker" : seesAllFarms(actor) || actor.farmIds.includes(w.farmId));
}

// ───────── S11 Phiếu nhập
export async function recentReceipts(db: DB, limit = 20) {
  return db.select({
    r: receipts, warehouse: warehouses.name,
    lines: sql<number>`count(${receiptLines.id})::int`,
    total: sql<number>`coalesce(sum(${receiptLines.qty} * ${receiptLines.unitCost}),0)::float8`,
  }).from(receipts).innerJoin(warehouses, eq(warehouses.id, receipts.warehouseId))
    .leftJoin(receiptLines, eq(receiptLines.receiptId, receipts.id))
    .groupBy(receipts.id, warehouses.name).orderBy(desc(receipts.createdAt)).limit(limit);
}

// ───────── S12 Yêu cầu cấp
/** Hàng đợi: chờ/cấp một phần trước (cũ nhất trước), sau đó 30 yêu cầu đã đóng gần nhất */
export async function requestQueue(db: DB, actor: Actor) {
  const scope = seesAllFarms(actor) || actor.role === "storekeeper" ? sql`true`
    : actor.farmIds.length ? inArray(requests.farmId, actor.farmIds) : sql`false`;
  const cols = { r: requests, farmName: farms.name };
  const open = await db.select(cols).from(requests).innerJoin(farms, eq(farms.id, requests.farmId))
    .where(and(scope, inArray(requests.status, ["pending", "partial"]))).orderBy(asc(requests.createdAt));
  const closed = await db.select(cols).from(requests).innerJoin(farms, eq(farms.id, requests.farmId))
    .where(and(scope, sql`${requests.status} not in ('pending','partial')`)).orderBy(desc(requests.createdAt)).limit(30);
  const all = [...open, ...closed];
  const lines = all.length
    ? await db.select({ l: requestLines, m: materials }).from(requestLines).innerJoin(materials, eq(materials.id, requestLines.materialId))
      .where(inArray(requestLines.requestId, all.map((x) => x.r.id))).orderBy(asc(requestLines.id))
    : [];
  return all.map((x) => ({ ...x, lines: lines.filter((l) => l.l.requestId === x.r.id) }));
}

// ───────── S13 Kiểm kê
export async function countList(db: DB, actor: Actor, limit = 50) {
  const whIds = (await warehousesInScope(db, actor)).map((w) => w.id);
  if (!whIds.length) return [];
  return db.select({ c: stockCounts, warehouse: warehouses.name }).from(stockCounts)
    .innerJoin(warehouses, eq(warehouses.id, stockCounts.warehouseId))
    .where(inArray(stockCounts.warehouseId, whIds)).orderBy(desc(stockCounts.createdAt)).limit(limit);
}

export async function countDetail(db: DB, actor: Actor, countId: number) {
  const [row] = await db.select({ c: stockCounts, wh: warehouses }).from(stockCounts)
    .innerJoin(warehouses, eq(warehouses.id, stockCounts.warehouseId)).where(eq(stockCounts.id, countId));
  if (!row) return null;
  if (row.wh.farmId != null && !canFarm(actor, row.wh.farmId)) return "forbidden" as const;
  const lines = await db.select({ l: stockCountLines, m: materials }).from(stockCountLines)
    .innerJoin(materials, eq(materials.id, stockCountLines.materialId))
    .where(eq(stockCountLines.countId, countId)).orderBy(asc(materials.name));
  return { ...row, lines };
}

// ───────── S17 Kế hoạch
/** Phiên bản mới nhất của kế hoạch tháng (bất kể trạng thái) kèm dòng */
export async function latestPlan(db: DB, farmId: number, month: string) {
  const [p] = await db.select().from(plans).where(and(eq(plans.farmId, farmId), eq(plans.month, month), sql`${plans.status} <> 'superseded'`))
    .orderBy(desc(plans.version)).limit(1);
  if (!p) return null;
  const lines = await db.select({ l: planLines, tankCode: tanks.code }).from(planLines).innerJoin(tanks, eq(tanks.id, planLines.tankId))
    .where(eq(planLines.planId, p.id)).orderBy(asc(planLines.stockDate), asc(tanks.code));
  return { plan: p, lines };
}

export async function pendingPlans(db: DB) {
  return db.select({
    p: plans, farmName: farms.name,
    lines: sql<number>`count(${planLines.id})::int`,
    harvest: sql<number>`coalesce(sum(${planLines.harvestQty}),0)::float8`,
  }).from(plans).innerJoin(farms, eq(farms.id, plans.farmId)).leftJoin(planLines, eq(planLines.planId, plans.id))
    .where(eq(plans.status, "pending")).groupBy(plans.id, farms.name).orderBy(asc(plans.submittedAt));
}

/** Tỷ lệ sống chuẩn mặc định: loài đầu tiên trong danh mục (bể chưa gắn loài) */
export async function defaultSurvival(db: DB) {
  const [s] = await db.select({ v: species.standardSurvival }).from(species).orderBy(asc(species.id)).limit(1);
  return s?.v ?? 0.6;
}

// ───────── S15 Loài & giai đoạn
export async function speciesCatalog(db: DB) {
  const sp = await db.select().from(species).orderBy(asc(species.id));
  const st = await db.select().from(stages).orderBy(asc(stages.speciesId), asc(stages.seq));
  const thr = st.length ? await db.select().from(waterThresholds).where(inArray(waterThresholds.stageId, st.map((s) => s.id))) : [];
  return sp.map((s) => ({
    species: s,
    stages: st.filter((x) => x.speciesId === s.id).map((x) => ({ stage: x, thresholds: thr.filter((t) => t.stageId === x.id) })),
  }));
}

// ───────── S16 Người dùng
export async function usersWithFarms(db: DB) {
  const us = await db.select({ id: users.id, empCode: users.empCode, name: users.name, role: users.role, active: users.active, createdAt: users.createdAt })
    .from(users).orderBy(asc(users.empCode));
  const uf = await db.select().from(userFarms);
  return us.map((u) => ({ ...u, farmIds: uf.filter((x) => x.userId === u.id).map((x) => x.farmId) }));
}
