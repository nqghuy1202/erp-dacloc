import { and, asc, eq, gt, inArray, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import type { DB } from "@/lib/db/types";
import {
  lots, materials, receiptLines, receipts, requestLines, requests, stockCountLines, stockCounts, stockLots, stockTx, warehouses,
} from "@/lib/db/schema";
import { assertFarm, assertRole } from "./access";
import { raiseAlert } from "./alerts";
import { fail } from "./errors";
import type { Actor } from "./types";
import { seesAllFarms } from "./types";
import { makeCode } from "./util";

export const COUNT_TOLERANCE = 0.02; // H9: lệch > 2% cần duyệt

export async function stockOf(db: DB, warehouseId: number, materialId: number) {
  const [r] = await db.select({ q: sql<number>`coalesce(sum(${stockTx.qty}),0)::float8` }).from(stockTx)
    .where(and(eq(stockTx.warehouseId, warehouseId), eq(stockTx.materialId, materialId)));
  return Number(r.q);
}

/** Giá vốn bình quân gia quyền theo nhập (Assumption ba-spec §11) */
async function avgCost(db: DB, warehouseId: number, materialId: number) {
  const [r] = await db.select({
    v: sql<number>`coalesce(sum(${stockTx.qty} * ${stockTx.unitCost}) / nullif(sum(${stockTx.qty}),0), 0)::float8`,
  }).from(stockTx).where(and(eq(stockTx.warehouseId, warehouseId), eq(stockTx.materialId, materialId), gt(stockTx.qty, 0)));
  return Number(r.v);
}

export async function farmWarehouse(db: DB, farmId: number) {
  const [w] = await db.select().from(warehouses).where(eq(warehouses.farmId, farmId));
  if (!w) fail("not_found", "Trại chưa có kho");
  return w!;
}

export async function centralWarehouse(db: DB) {
  const [w] = await db.select().from(warehouses).where(isNull(warehouses.farmId)).orderBy(asc(warehouses.id)).limit(1);
  if (!w) fail("not_found", "Chưa có kho tổng");
  return w!;
}

export async function stockList(db: DB, actor: Actor, warehouseId?: number) {
  const whs = await db.select().from(warehouses);
  const visible = whs.filter((w) => w.farmId == null ? actor.role !== "worker" : seesAllFarms(actor) || actor.farmIds.includes(w.farmId));
  const ids = (warehouseId ? visible.filter((w) => w.id === warehouseId) : visible).map((w) => w.id);
  if (!ids.length) return { warehouses: visible, rows: [] };
  const rows = await db.select({
    warehouseId: stockTx.warehouseId, materialId: stockTx.materialId, qty: sql<number>`sum(${stockTx.qty})::float8`,
  }).from(stockTx).where(inArray(stockTx.warehouseId, ids)).groupBy(stockTx.warehouseId, stockTx.materialId);
  const mats = await db.select().from(materials);
  const lotsRows = await db.select().from(stockLots).where(and(inArray(stockLots.warehouseId, ids), gt(stockLots.qtyRemaining, 0))).orderBy(asc(stockLots.expiry));
  return {
    warehouses: visible,
    rows: rows.map((r) => {
      const m = mats.find((x) => x.id === r.materialId)!;
      const nextExpiry = lotsRows.find((l) => l.warehouseId === r.warehouseId && l.materialId === r.materialId)?.expiry ?? null;
      return { ...r, qty: Number(r.qty), material: m, nextExpiry, belowMin: Number(r.qty) < m.minStock, negative: Number(r.qty) < 0 };
    }),
  };
}

// ───────── NV8 Phiếu nhập
export const receiptInput = z.object({
  warehouseId: z.coerce.number().int().positive().optional(),
  supplier: z.string().trim().min(1).max(120),
  docNo: z.string().trim().max(60).default(""),
  lines: z.array(z.object({
    materialId: z.coerce.number().int().positive(), qty: z.coerce.number().positive(), unitCost: z.coerce.number().min(0),
    supplierLot: z.string().trim().max(60).default(""), expiry: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("").transform(() => undefined)),
  })).min(1, "Cần ít nhất 1 dòng"),
});

export async function createReceipt(db: DB, actor: Actor, input: z.input<typeof receiptInput>) {
  assertRole(actor, ["storekeeper"]);
  const v = receiptInput.parse(input);
  const wh = v.warehouseId ? (await db.select().from(warehouses).where(eq(warehouses.id, v.warehouseId)))[0] : await centralWarehouse(db);
  if (!wh) fail("not_found", "Không tìm thấy kho");
  const mats = await db.select().from(materials).where(inArray(materials.id, v.lines.map((l) => l.materialId)));
  const banned = mats.filter((m) => m.banned);
  if (banned.length) fail("banned_material", `Vật tư cấm dùng: ${banned.map((b) => b.name).join(", ")}`, { materialIds: banned.map((b) => b.id) });
  if (mats.length !== new Set(v.lines.map((l) => l.materialId)).size) fail("not_found", "Có vật tư không tồn tại");
  return db.transaction(async (tx) => {
    const [r] = await tx.insert(receipts).values({ code: makeCode("PN"), warehouseId: wh!.id, supplier: v.supplier, docNo: v.docNo, createdBy: actor.id }).returning();
    for (const l of v.lines) {
      await tx.insert(receiptLines).values({ receiptId: r.id, ...l, expiry: l.expiry ?? null });
      const [sl] = await tx.insert(stockLots).values({ warehouseId: wh!.id, materialId: l.materialId, supplierLot: l.supplierLot, expiry: l.expiry ?? null, qtyRemaining: l.qty, unitCost: l.unitCost }).returning();
      await tx.insert(stockTx).values({ warehouseId: wh!.id, materialId: l.materialId, stockLotId: sl.id, qty: l.qty, unitCost: l.unitCost, type: "receipt", refKey: `receipt:${r.id}:${sl.id}`, createdBy: actor.id });
    }
    return r;
  });
}

// ───────── NV9 Yêu cầu & cấp phát
export const requestInput = z.object({
  farmId: z.coerce.number().int().positive(),
  note: z.string().trim().max(300).default(""),
  lines: z.array(z.object({ materialId: z.coerce.number().int().positive(), qty: z.coerce.number().positive() })).min(1),
});

export async function createRequest(db: DB, actor: Actor, input: z.input<typeof requestInput>) {
  assertRole(actor, ["farm_lead"]);
  const v = requestInput.parse(input);
  assertFarm(actor, v.farmId);
  const mats = await db.select().from(materials).where(inArray(materials.id, v.lines.map((l) => l.materialId)));
  if (mats.some((m) => m.banned)) fail("banned_material", "Vật tư cấm dùng");
  return db.transaction(async (tx) => {
    const [r] = await tx.insert(requests).values({ code: makeCode("YC"), farmId: v.farmId, note: v.note, createdBy: actor.id }).returning();
    await tx.insert(requestLines).values(v.lines.map((l) => ({ requestId: r.id, ...l })));
    return r;
  });
}

export async function cancelRequest(db: DB, actor: Actor, requestId: number) {
  const [r] = await db.select().from(requests).where(eq(requests.id, requestId));
  if (!r) fail("not_found");
  assertFarm(actor, r!.farmId);
  if (r!.status !== "pending") fail("request_closed", "Yêu cầu đã xử lý");
  await db.update(requests).set({ status: "cancelled", closedAt: new Date() }).where(eq(requests.id, requestId));
}

export async function rejectRequest(db: DB, actor: Actor, requestId: number, reason: string) {
  assertRole(actor, ["storekeeper"]);
  if (!reason.trim()) fail("invalid_input", "Cần lý do từ chối");
  const [r] = await db.update(requests).set({ status: "rejected", rejectReason: reason.trim(), closedAt: new Date() })
    .where(and(eq(requests.id, requestId), inArray(requests.status, ["pending", "partial"]))).returning();
  if (!r) fail("request_closed");
  return r;
}

/** Cấp phát FEFO từ kho tổng sang kho trại (AC-16). issue = {materialId: qty}; bỏ trống = cấp đủ phần còn lại. */
export async function issueRequest(db: DB, actor: Actor, requestId: number, issue?: Record<number, number>) {
  assertRole(actor, ["storekeeper"]);
  return db.transaction(async (txRaw) => {
    const tx = txRaw as unknown as DB;
    const [r] = await tx.select().from(requests).where(eq(requests.id, requestId));
    if (!r) fail("not_found");
    if (!["pending", "partial"].includes(r!.status)) fail("request_closed", "Yêu cầu đã đóng");
    const central = await centralWarehouse(tx);
    const dest = await farmWarehouse(tx, r!.farmId);
    const lines = await tx.select().from(requestLines).where(eq(requestLines.requestId, requestId));
    for (const line of lines) {
      const want = Math.min(issue?.[line.materialId] ?? line.qty - line.issued, line.qty - line.issued);
      if (want <= 0) continue;
      const avail = await stockOf(tx, central.id, line.materialId);
      if (avail < want - 1e-9) fail("insufficient_stock", `Kho tổng chỉ còn ${avail}`, { materialId: line.materialId, avail });
      let left = want;
      const fefo = await tx.select().from(stockLots)
        .where(and(eq(stockLots.warehouseId, central.id), eq(stockLots.materialId, line.materialId), gt(stockLots.qtyRemaining, 0)))
        .orderBy(sql`${stockLots.expiry} asc nulls last`, asc(stockLots.id));
      for (const sl of fefo) {
        if (left <= 1e-9) break;
        const take = Math.min(left, sl.qtyRemaining);
        await tx.update(stockLots).set({ qtyRemaining: sl.qtyRemaining - take }).where(eq(stockLots.id, sl.id));
        const ref = `issue:${requestId}:${line.id}:${sl.id}:${Date.now()}`;
        await tx.insert(stockTx).values([
          { warehouseId: central.id, materialId: line.materialId, stockLotId: sl.id, qty: -take, unitCost: sl.unitCost, type: "issue_out", refKey: `${ref}:out`, createdBy: actor.id },
          { warehouseId: dest.id, materialId: line.materialId, stockLotId: sl.id, qty: take, unitCost: sl.unitCost, type: "issue_in", refKey: `${ref}:in`, createdBy: actor.id },
        ]);
        left -= take;
      }
      await tx.update(requestLines).set({ issued: line.issued + want }).where(eq(requestLines.id, line.id));
    }
    const after = await tx.select().from(requestLines).where(eq(requestLines.requestId, requestId));
    const full = after.every((l) => l.issued >= l.qty - 1e-9);
    const [row] = await tx.update(requests).set({ status: full ? "fulfilled" : "partial", closedAt: full ? new Date() : null }).where(eq(requests.id, requestId)).returning();
    return row;
  });
}

// ───────── NV10 Tiêu hao theo nhật ký (idempotent qua ref_key)
export async function consumeForLog(db: DB, p: { logId: string; farmId: number; lotId: number; materialId: number; qty: number; userId: number }) {
  const wh = await farmWarehouse(db, p.farmId);
  const cost = await avgCost(db, wh.id, p.materialId);
  const inserted = await db.insert(stockTx).values({
    warehouseId: wh.id, materialId: p.materialId, qty: -p.qty, unitCost: cost, type: "consume", refKey: `log:${p.logId}`, lotId: p.lotId, createdBy: p.userId,
  }).onConflictDoNothing().returning();
  if (!inserted.length) return { negative: false, duplicate: true };
  await db.update(lots).set({ costTotal: sql`${lots.costTotal} + ${p.qty * cost}` }).where(eq(lots.id, p.lotId));
  const after = await stockOf(db, wh.id, p.materialId);
  if (after < 0) {
    const [m] = await db.select().from(materials).where(eq(materials.id, p.materialId));
    await raiseAlert(db, {
      type: "negative_stock", farmId: p.farmId, title: `Âm kho ${m.name} · ${wh.name}`, detail: `Tồn sổ ${after} ${m.unit}`,
      dedupeKey: `neg:${wh.id}:${p.materialId}`, notifyRoles: ["farm_lead", "storekeeper"],
    });
  }
  return { negative: after < 0, duplicate: false };
}

// ───────── NV11 Kiểm kê
export async function startCount(db: DB, actor: Actor, warehouseId: number) {
  assertRole(actor, ["storekeeper"]);
  const [wh] = await db.select().from(warehouses).where(eq(warehouses.id, warehouseId));
  if (!wh) fail("not_found");
  if (wh!.farmId) assertFarm(actor, wh!.farmId);
  const mats = await db.select().from(materials).where(eq(materials.banned, false));
  return db.transaction(async (txRaw) => {
    const tx = txRaw as unknown as DB;
    const [c] = await tx.insert(stockCounts).values({ code: makeCode("KK"), warehouseId, createdBy: actor.id }).returning();
    for (const m of mats) {
      await tx.insert(stockCountLines).values({ countId: c.id, materialId: m.id, bookQty: await stockOf(tx, warehouseId, m.id), unitCost: await avgCost(tx, warehouseId, m.id) });
    }
    return c;
  });
}

export async function submitCount(db: DB, actor: Actor, countId: number, actuals: Record<number, number>) {
  assertRole(actor, ["storekeeper"]);
  return db.transaction(async (txRaw) => {
    const tx = txRaw as unknown as DB;
    const [c] = await tx.select().from(stockCounts).where(eq(stockCounts.id, countId));
    if (!c || c.status !== "counting") fail("count_not_pending");
    const lines = await tx.select().from(stockCountLines).where(eq(stockCountLines.countId, countId));
    let needsApproval = false;
    for (const l of lines) {
      const actual = actuals[l.materialId] ?? l.bookQty;
      if (!Number.isFinite(actual) || actual < 0) fail("invalid_input", "Số đếm không hợp lệ");
      await tx.update(stockCountLines).set({ actualQty: actual }).where(eq(stockCountLines.id, l.id));
      const base = Math.abs(l.bookQty);
      const ratio = base === 0 ? (actual === 0 ? 0 : 1) : Math.abs(actual - l.bookQty) / base;
      if (ratio > COUNT_TOLERANCE) needsApproval = true;
    }
    if (needsApproval) {
      const [wh] = await tx.select().from(warehouses).where(eq(warehouses.id, c!.warehouseId));
      await raiseAlert(tx, { type: "count_pending", farmId: wh.farmId, title: `Kiểm kê ${c!.code} lệch > 2% · chờ duyệt`, dedupeKey: `count:${c!.id}` });
      const [row] = await tx.update(stockCounts).set({ status: "pending_approval" }).where(eq(stockCounts.id, countId)).returning();
      return row;
    }
    return applyCount(tx, actor, countId);
  });
}

async function applyCount(tx: DB, actor: Actor, countId: number) {
  const [c] = await tx.select().from(stockCounts).where(eq(stockCounts.id, countId));
  const lines = await tx.select().from(stockCountLines).where(eq(stockCountLines.countId, countId));
  for (const l of lines) {
    // điều chỉnh bằng chênh lệch (thực − sổ lúc chốt) để giữ nguyên giao dịch phát sinh trong lúc đếm
    const diff = (l.actualQty ?? l.bookQty) - l.bookQty;
    if (Math.abs(diff) > 1e-9) {
      await tx.insert(stockTx).values({ warehouseId: c.warehouseId, materialId: l.materialId, qty: diff, unitCost: l.unitCost, type: "adjust", refKey: `count:${countId}`, createdBy: actor.id });
    }
  }
  const [row] = await tx.update(stockCounts).set({ status: "approved", approvedBy: actor.id, approvedAt: new Date() }).where(eq(stockCounts.id, countId)).returning();
  return row;
}

export async function approveCount(db: DB, actor: Actor, countId: number) {
  assertRole(actor, ["farm_lead", "director"]);
  return db.transaction(async (txRaw) => {
    const tx = txRaw as unknown as DB;
    const [c] = await tx.select().from(stockCounts).where(eq(stockCounts.id, countId));
    if (!c || c.status !== "pending_approval") fail("count_not_pending", "Biên bản không ở trạng thái chờ duyệt");
    const [wh] = await tx.select().from(warehouses).where(eq(warehouses.id, c!.warehouseId));
    if (wh.farmId) assertFarm(actor, wh.farmId);
    return applyCount(tx, actor, countId);
  });
}
