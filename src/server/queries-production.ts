import { and, asc, desc, eq, inArray, isNotNull, sql, type SQL } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import type { DB } from "@/lib/db/types";
import {
  alerts, broodstocks, farms, incidents, labTests, logs, lots, materials, species, spawnBatches, stages, tanks, userFarms, users, waterThresholds,
} from "@/lib/db/schema";
import { type Actor, seesAllFarms } from "./types";
import { ymd } from "./util";

/** Đọc cho các màn S2–S7 (văn phòng). Ghi đi qua production.ts / planning.ts. */

/** R1: điều kiện phạm vi trại cho một cột farm_id */
export function farmScope(actor: Actor, col: AnyPgColumn): SQL {
  if (seesAllFarms(actor)) return sql`true`;
  if (!actor.farmIds.length) return sql`false`;
  return inArray(col, actor.farmIds);
}

export async function visibleFarms(db: DB, actor: Actor, kind?: "broodstock" | "hatchery") {
  const conds = [farmScope(actor, farms.id)];
  if (kind) conds.push(eq(farms.kind, kind));
  return db.select().from(farms).where(and(...conds)).orderBy(asc(farms.kind), sql`length(${farms.code})`, asc(farms.code));
}

/** Ngày (YYYY-MM-DD) theo giờ Việt Nam của một cột timestamp */
const vnDay = (col: AnyPgColumn) => sql<string>`to_char(${col} at time zone 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD')`;

// ───────── S2 Trại (lưới bể)
export async function farmBoard(db: DB, farmId: number) {
  const [farm] = await db.select().from(farms).where(eq(farms.id, farmId));
  if (!farm) return null;
  const [tankRows, lotRows, alertRows] = await Promise.all([
    db.select().from(tanks).where(eq(tanks.farmId, farmId)).orderBy(asc(tanks.code)),
    db.select({ lot: lots, stage: stages }).from(lots).innerJoin(stages, eq(stages.id, lots.stageId))
      .where(and(eq(lots.farmId, farmId), eq(lots.status, "rearing"))),
    db.select().from(alerts).where(and(eq(alerts.farmId, farmId), isNotNull(alerts.tankId), sql`${alerts.status} <> 'closed'`))
      .orderBy(sql`case when ${alerts.severity} = 'bad' then 0 else 1 end`, desc(alerts.createdAt)),
  ]);
  return {
    farm,
    tanks: tankRows.map((t) => {
      const l = lotRows.find((r) => r.lot.tankId === t.id);
      return { tank: t, lot: l?.lot ?? null, stage: l?.stage ?? null, alert: alertRows.find((a) => a.tankId === t.id) ?? null };
    }),
  };
}

/** Bảng tóm tắt từng trại cho bộ chọn trại */
export async function farmSummaries(db: DB, actor: Actor) {
  const list = await visibleFarms(db, actor);
  if (!list.length) return [];
  const ids = list.map((f) => f.id);
  const [tankCounts, lotCounts] = await Promise.all([
    db.select({ farmId: tanks.farmId, n: sql<number>`count(*)::int` }).from(tanks).where(inArray(tanks.farmId, ids)).groupBy(tanks.farmId),
    db.select({ farmId: lots.farmId, n: sql<number>`count(*)::int` }).from(lots).where(and(inArray(lots.farmId, ids), eq(lots.status, "rearing"))).groupBy(lots.farmId),
  ]);
  return list.map((f) => ({ farm: f, tanks: tankCounts.find((r) => r.farmId === f.id)?.n ?? 0, rearing: lotCounts.find((r) => r.farmId === f.id)?.n ?? 0 }));
}

// ───────── S6 Lô ương (danh sách)
export const LOT_PAGE = 50;

export async function lotList(db: DB, actor: Actor, f: { farmId?: number; stageCode?: string; status?: string; page: number }) {
  const conds: SQL[] = [farmScope(actor, lots.farmId)];
  if (f.farmId) conds.push(eq(lots.farmId, f.farmId));
  if (f.stageCode) conds.push(eq(stages.code, f.stageCode));
  if (f.status) conds.push(eq(lots.status, f.status));
  const where = and(...conds);
  const [rows, [{ n }]] = await Promise.all([
    db.select({ lot: lots, tankCode: tanks.code, stage: stages, farmName: farms.name }).from(lots)
      .innerJoin(tanks, eq(tanks.id, lots.tankId)).innerJoin(stages, eq(stages.id, lots.stageId)).innerJoin(farms, eq(farms.id, lots.farmId))
      .where(where)
      .orderBy(sql`case when ${lots.status} = 'rearing' then 0 else 1 end`, sql`${lots.expectedHarvestAt} asc nulls last`, desc(lots.id))
      .limit(LOT_PAGE).offset((f.page - 1) * LOT_PAGE),
    db.select({ n: sql<number>`count(*)::int` }).from(lots).innerJoin(stages, eq(stages.id, lots.stageId)).where(where),
  ]);
  return { rows, total: n };
}

export async function stageCodes(db: DB) {
  const rows = await db.select({ code: stages.code, name: stages.name }).from(stages).orderBy(asc(stages.speciesId), asc(stages.seq));
  const seen = new Set<string>();
  return rows.filter((r) => (seen.has(r.code) ? false : (seen.add(r.code), true)));
}

// ───────── S3 Chi tiết lô
export async function lotDetail(db: DB, lotId: number) {
  const [row] = await db.select({ lot: lots, tank: tanks, farm: farms, species, stage: stages }).from(lots)
    .innerJoin(tanks, eq(tanks.id, lots.tankId)).innerJoin(farms, eq(farms.id, lots.farmId))
    .innerJoin(species, eq(species.id, lots.speciesId)).innerJoin(stages, eq(stages.id, lots.stageId))
    .where(eq(lots.id, lotId));
  if (!row) return null;
  const stageList = await db.select().from(stages).where(eq(stages.speciesId, row.lot.speciesId)).orderBy(asc(stages.seq));
  const [thresholds, tests, batchRow, parents] = await Promise.all([
    stageList.length ? db.select().from(waterThresholds).where(inArray(waterThresholds.stageId, stageList.map((s) => s.id))) : Promise.resolve([]),
    db.select().from(labTests).where(and(eq(labTests.subjectType, "lot"), eq(labTests.subjectId, lotId))).orderBy(desc(labTests.sampledAt)),
    row.lot.batchId
      ? db.select({ batch: spawnBatches, brood: broodstocks, broodFarm: farms.name }).from(spawnBatches)
        .innerJoin(broodstocks, eq(broodstocks.id, spawnBatches.broodstockId)).innerJoin(farms, eq(farms.id, broodstocks.farmId))
        .where(eq(spawnBatches.id, row.lot.batchId))
      : Promise.resolve([]),
    row.lot.parentLotIds.length ? db.select({ id: lots.id, code: lots.code }).from(lots).where(inArray(lots.id, row.lot.parentLotIds)) : Promise.resolve([]),
  ]);
  const origin = batchRow[0] ?? null;
  const broodTests = origin
    ? await db.select().from(labTests).where(and(eq(labTests.subjectType, "broodstock"), eq(labTests.subjectId, origin.brood.id))).orderBy(desc(labTests.sampledAt))
    : [];
  return { ...row, stageList, thresholds, tests, origin, broodTests, parents };
}

/** Nhật ký phân trang theo ngày (ma trận S3: 90 ngày × 8 lần/ngày) */
export async function lotLogDays(db: DB, lotId: number, page: number, daysPerPage = 7) {
  const day = vnDay(logs.recordedAt);
  const days = await db.select({ day }).from(logs).where(eq(logs.lotId, lotId)).groupBy(sql`1`).orderBy(sql`1 desc`);
  const slice = days.slice((page - 1) * daysPerPage, page * daysPerPage).map((d) => d.day);
  const rows = slice.length
    ? await db.select({ log: logs, day, material: materials.name, unit: materials.unit, user: users.name }).from(logs)
      .leftJoin(materials, eq(materials.id, logs.materialId)).leftJoin(users, eq(users.id, logs.userId))
      .where(and(eq(logs.lotId, lotId), inArray(day, slice))).orderBy(desc(logs.recordedAt))
    : [];
  return { totalDays: days.length, days: slice.map((d) => ({ day: d, rows: rows.filter((r) => r.day === d) })) };
}

/** Chuỗi chỉ số nước của lô, cũ → mới */
export async function lotWaterSeries(db: DB, lotId: number, limit = 500) {
  // nợ: lấy 500 điểm mới nhất, chưa trung bình theo giờ; nâng cấp khi lô có > 500 lần đo (ma trận S3)
  const rows = await db.select({ at: logs.recordedAt, data: logs.data }).from(logs)
    .where(and(eq(logs.lotId, lotId), eq(logs.kind, "water"))).orderBy(desc(logs.recordedAt)).limit(limit);
  return rows.reverse();
}

// ───────── S4 Đàn bố mẹ
export const BROOD_PAGE = 50;

export async function broodstockList(db: DB, actor: Actor, page: number) {
  const where = farmScope(actor, broodstocks.farmId);
  const [rows, [{ n }]] = await Promise.all([
    db.select({ b: broodstocks, farmName: farms.name, speciesName: species.nameVi }).from(broodstocks)
      .innerJoin(farms, eq(farms.id, broodstocks.farmId)).innerJoin(species, eq(species.id, broodstocks.speciesId))
      .where(where).orderBy(desc(broodstocks.receivedAt)).limit(BROOD_PAGE).offset((page - 1) * BROOD_PAGE),
    db.select({ n: sql<number>`count(*)::int` }).from(broodstocks).where(where),
  ]);
  const ids = rows.map((r) => r.b.id);
  const tests = ids.length
    ? await db.select().from(labTests).where(and(eq(labTests.subjectType, "broodstock"), inArray(labTests.subjectId, ids))).orderBy(desc(labTests.sampledAt))
    : [];
  return { rows: rows.map((r) => ({ ...r, test: tests.find((t) => t.subjectId === r.b.id) ?? null })), total: n };
}

export async function speciesList(db: DB) {
  return db.select({ id: species.id, name: species.nameVi }).from(species).orderBy(asc(species.id));
}

// ───────── S5 Mẻ đẻ
export async function spawnBoard(db: DB, actor: Actor) {
  const [ready, batches, emptyTanks, workers] = await Promise.all([
    db.select({ b: broodstocks, farmName: farms.name }).from(broodstocks).innerJoin(farms, eq(farms.id, broodstocks.farmId))
      .where(and(eq(broodstocks.status, "ready"), farmScope(actor, broodstocks.farmId))).orderBy(desc(broodstocks.receivedAt)),
    db.select({ batch: spawnBatches, broodCode: broodstocks.code, farmName: farms.name }).from(spawnBatches)
      .innerJoin(broodstocks, eq(broodstocks.id, spawnBatches.broodstockId)).innerJoin(farms, eq(farms.id, broodstocks.farmId))
      .where(and(eq(spawnBatches.status, "open"), farmScope(actor, broodstocks.farmId))).orderBy(desc(spawnBatches.spawnedAt)),
    db.select({ id: tanks.id, code: tanks.code, farmId: tanks.farmId, farmName: farms.name }).from(tanks).innerJoin(farms, eq(farms.id, tanks.farmId))
      .where(and(eq(tanks.status, "empty"), eq(farms.kind, "hatchery"), farmScope(actor, tanks.farmId))).orderBy(sql`length(${farms.code})`, asc(farms.code), asc(tanks.code)),
    db.select({ id: users.id, name: users.name, empCode: users.empCode, farmId: userFarms.farmId }).from(users)
      .innerJoin(userFarms, eq(userFarms.userId, users.id))
      .where(and(eq(users.role, "worker"), eq(users.active, true), farmScope(actor, userFarms.farmId))).orderBy(asc(users.name)),
  ]);
  return { ready, batches, emptyTanks, workers };
}

// ───────── S7 Sự cố
export async function incidentList(db: DB, actor: Actor, resolvedLimit = 10) {
  const base = () => db.select({ inc: incidents, lot: lots, tankCode: tanks.code, farmName: farms.name, alertTitle: alerts.title }).from(incidents)
    .innerJoin(lots, eq(lots.id, incidents.lotId)).innerJoin(tanks, eq(tanks.id, lots.tankId)).innerJoin(farms, eq(farms.id, lots.farmId))
    .leftJoin(alerts, eq(alerts.id, incidents.alertId));
  const [open, resolved] = await Promise.all([
    base().where(and(eq(incidents.status, "open"), farmScope(actor, lots.farmId))).orderBy(desc(incidents.createdAt)),
    base().where(and(eq(incidents.status, "resolved"), farmScope(actor, lots.farmId))).orderBy(desc(incidents.resolvedAt)).limit(resolvedLimit),
  ]);
  return { open, resolved };
}

// ───────── Hàm thuần dùng chung cho các màn sản xuất
const dayMs = 86400000;
/** Số ngày từ a tới b (YYYY-MM-DD) */
export const dayDiff = (a: string, b: string) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / dayMs);

/** Ngày tuổi / tổng ngày tới dự kiến thu / còn bao nhiêu ngày */
export function lotProgress(lot: { stockedAt: Date; expectedHarvestAt: string | null }, now = new Date()) {
  const start = ymd(lot.stockedAt);
  const today = ymd(now);
  const day = dayDiff(start, today) + 1;
  const total = lot.expectedHarvestAt ? Math.max(1, dayDiff(start, lot.expectedHarvestAt)) : null;
  const left = lot.expectedHarvestAt ? dayDiff(today, lot.expectedHarvestAt) : null;
  return { day, total, left, pct: total ? Math.min(100, (day / total) * 100) : 0 };
}

const PARAM_LABEL: Record<string, string> = { PH: "pH", TEMP: "Nhiệt độ", SALINITY: "Độ mặn", DO: "DO" };
/** "PH 9,1 · bể B-03" → "pH 9,1" (chữ ngắn trên thẻ bể) */
export const alertShort = (title: string) => title.split(" · ")[0].replace(/\b(PH|TEMP|SALINITY|DO)\b/g, (m) => PARAM_LABEL[m] ?? m);
