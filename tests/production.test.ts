import { beforeEach, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { alerts, broodstocks, finishedLots, incidents, labTests, lots, notifications, spawnBatches, stockTx, tanks } from "@/lib/db/schema";
import { importTanks } from "@/server/catalog";
import {
  createSpawnBatch, finalizeTest, harvestLot, openLot, receiveBroodstock, requestLotTest, traceFinishedLot,
} from "@/server/production";
import { syncLogs } from "@/server/logs";
import { runEscalation } from "@/server/alerts";
import { createReceipt, createRequest, issueRequest, farmWarehouse, stockOf } from "@/server/inventory";
import { makeWorld, type World } from "./helpers";

let w: World;
beforeEach(async () => { w = await makeWorld(); });

async function readyBroodstock() {
  const b = await receiveBroodstock(w.db, w.actors.lead1, { farmId: w.farms.bm.id, speciesId: w.van.id, source: "SIS Hawaii", males: 200, females: 250 });
  const [t] = await w.db.select().from(labTests).where(and(eq(labTests.subjectType, "broodstock"), eq(labTests.subjectId, b.id)));
  await finalizeTest(w.db, w.actors.lab, t.id, { results: t.results.map((r) => ({ ...r, positive: false })) });
  return b;
}

async function rearingLot(tankIdx = 0, qty = 1_000_000) {
  const b = await readyBroodstock();
  const batch = await createSpawnBatch(w.db, w.actors.lead1, { broodstockId: b.id, femalesSpawned: 60, nauplius: 5_000_000 });
  return openLot(w.db, w.actors.lead1, { batchId: batch.id, tankId: w.tanks[tankIdx].id, qty, workerIds: [w.actors.worker1.id] });
}

describe("NV0 danh mục", () => {
  it("AC-1 import 10 bể, 2 dòng trùng mã → lưu 8, trả 2 lỗi duplicate_code", async () => {
    const rows = Array.from({ length: 8 }, (_, i) => ({ farmCode: "T1", code: `T1-N${i}`, volumeM3: 20 }));
    rows.push({ farmCode: "T1", code: "T1-B01", volumeM3: 20 }, { farmCode: "T1", code: "T1-B02", volumeM3: 20 });
    const before = (await w.db.select().from(tanks)).length;
    const r = await importTanks(w.db, w.actors.admin, rows);
    expect(r.saved).toBe(8);
    expect(r.errors).toHaveLength(2);
    expect(r.errors.every((e) => e.reason === "duplicate_code")).toBe(true);
    expect((await w.db.select().from(tanks)).length - before).toBe(8);
  });
});

describe("NV1 bố mẹ", () => {
  it("AC-2 đàn chưa có kết quả → từ chối tạo mẻ", async () => {
    const b = await receiveBroodstock(w.db, w.actors.lead1, { farmId: w.farms.bm.id, speciesId: w.van.id, source: "X", males: 10, females: 10 });
    await expect(createSpawnBatch(w.db, w.actors.lead1, { broodstockId: b.id, femalesSpawned: 5, nauplius: 1000 })).rejects.toMatchObject({ code: "broodstock_not_ready" });
    expect((await w.db.select().from(spawnBatches).where(eq(spawnBatches.broodstockId, b.id))).length).toBe(0);
  });

  it("AC-3 WSSV dương tính → đàn culled + 1 thông báo test_positive cho trưởng trại", async () => {
    const b = await receiveBroodstock(w.db, w.actors.lead1, { farmId: w.farms.bm.id, speciesId: w.van.id, source: "X", males: 10, females: 10 });
    const [t] = await w.db.select().from(labTests).where(eq(labTests.subjectId, b.id));
    await finalizeTest(w.db, w.actors.lab, t.id, { results: t.results.map((r) => ({ ...r, positive: r.indicator === "WSSV" })) });
    const [after] = await w.db.select().from(broodstocks).where(eq(broodstocks.id, b.id));
    expect(after.status).toBe("culled");
    const n = await w.db.select().from(notifications).where(and(eq(notifications.userId, w.actors.lead1.id), eq(notifications.type, "test_positive")));
    expect(n).toHaveLength(1);
  });
});

describe("NV3 mở lô", () => {
  it("AC-4 thả vượt số còn lại của mẻ → exceeds_batch_remaining, remaining giữ 500000", async () => {
    const b = await readyBroodstock();
    const batch = await createSpawnBatch(w.db, w.actors.lead1, { broodstockId: b.id, femalesSpawned: 60, nauplius: 2_000_000 });
    await openLot(w.db, w.actors.lead1, { batchId: batch.id, tankId: w.tanks[0].id, qty: 1_500_000, workerIds: [w.actors.worker1.id] });
    await expect(openLot(w.db, w.actors.lead1, { batchId: batch.id, tankId: w.tanks[1].id, qty: 600_000, workerIds: [w.actors.worker1.id] }))
      .rejects.toMatchObject({ code: "exceeds_batch_remaining" });
    const [after] = await w.db.select().from(spawnBatches).where(eq(spawnBatches.id, batch.id));
    expect(after.remaining).toBe(500_000);
  });

  it("AC-5 bể đang có lô → từ chối, vẫn đúng 1 lô rearing", async () => {
    const lot = await rearingLot(2);
    const [batch] = await w.db.select().from(spawnBatches).where(eq(spawnBatches.id, lot.batchId!));
    await expect(openLot(w.db, w.actors.lead1, { batchId: batch.id, tankId: w.tanks[2].id, qty: 100, workerIds: [w.actors.worker1.id] }))
      .rejects.toMatchObject({ code: "tank_busy" });
    expect((await w.db.select().from(lots).where(and(eq(lots.tankId, w.tanks[2].id), eq(lots.status, "rearing")))).length).toBe(1);
  });
});

describe("NV4 nhật ký", () => {
  it("AC-6 3 lần cho ăn offline → đồng bộ đủ 3 dòng, giữ thời điểm thực, không trùng", async () => {
    const lot = await rearingLot(0);
    await createReceipt(w.db, w.actors.store, { supplier: "NCC", lines: [{ materialId: w.cat.materials.ART90.id, qty: 100, unitCost: 1000 }] });
    const t0 = new Date(Date.now() - 3 * 3600 * 1000);
    const items = [0, 1, 2].map((i) => ({ id: randomUUID(), tankId: w.tanks[0].id, kind: "feed" as const, recordedAt: new Date(t0.getTime() + i * 3600e3), materialId: w.cat.materials.ART90.id, qty: 0.5 }));
    const r = await syncLogs(w.db, w.actors.worker1, items);
    expect(r.map((x) => x.status)).toEqual(["created", "created", "created"]);
    const r2 = await syncLogs(w.db, w.actors.worker1, items);
    expect(r2.every((x) => x.status === "duplicate")).toBe(true);
    const { logs } = await import("@/lib/db/schema");
    const saved = await w.db.select().from(logs).where(eq(logs.lotId, lot.id));
    expect(saved).toHaveLength(3);
    for (const it of items) expect(saved.find((s) => s.id === it.id)!.recordedAt.getTime()).toBe(it.recordedAt.getTime());
  });

  it("AC-8 công nhân trại T1 ghi bể trại T2 → forbidden, 0 dòng", async () => {
    await rearingLot(0);
    const r = await syncLogs(w.db, w.actors.worker1, [{ id: randomUUID(), tankId: w.tanks[4].id, kind: "note", recordedAt: new Date(), note: "x" }]);
    expect(r[0]).toMatchObject({ status: "rejected", error: "forbidden" });
  });

  it("AC-9 pH 9,1 ở Mysis → 1 cảnh báo mở water_out_of_range", async () => {
    const lot = await rearingLot(0);
    await w.db.update(lots).set({ stageId: w.stage.M1 }).where(eq(lots.id, lot.id));
    await syncLogs(w.db, w.actors.worker1, [{ id: randomUUID(), tankId: w.tanks[0].id, kind: "water", recordedAt: new Date(), water: { ph: 9.1 } }]);
    const a = await w.db.select().from(alerts).where(and(eq(alerts.status, "open"), eq(alerts.type, "water_out_of_range"), eq(alerts.lotId, lot.id)));
    expect(a).toHaveLength(1);
    const n = await w.db.select().from(notifications).where(and(eq(notifications.alertId, a[0].id), eq(notifications.userId, w.actors.lead1.id)));
    expect(n).toHaveLength(1);
  });
});

describe("NV7 leo thang", () => {
  it("AC-10 cảnh báo mở 2h01 → escalated + 1 thông báo cho BGĐ", async () => {
    const lot = await rearingLot(0);
    await syncLogs(w.db, w.actors.worker1, [{ id: randomUUID(), tankId: w.tanks[0].id, kind: "water", recordedAt: new Date(), water: { ph: 9.4 } }]);
    const [a] = await w.db.select().from(alerts).where(eq(alerts.lotId, lot.id));
    const n = await runEscalation(w.db, new Date(a.createdAt.getTime() + 2 * 3600e3 + 60e3));
    expect(n).toBe(1);
    const [after] = await w.db.select().from(alerts).where(eq(alerts.id, a.id));
    expect(after.escalated).toBe(true);
    expect((await w.db.select().from(notifications).where(and(eq(notifications.userId, w.actors.director.id), eq(notifications.type, "escalation")))).length).toBe(1);
    expect(await runEscalation(w.db, new Date(a.createdAt.getTime() + 5 * 3600e3))).toBe(0);
  });
});

describe("NV5–NV6–NV13", () => {
  it("AC-11 PCR lô AHPND dương tính → mở 1 sự cố pcr_positive", async () => {
    const lot = await rearingLot(0);
    const t = await requestLotTest(w.db, w.actors.lead1, lot.id);
    await finalizeTest(w.db, w.actors.lab, t.id, { results: t.results.map((r) => ({ ...r, positive: r.indicator === "AHPND" })) });
    expect((await w.db.select().from(incidents).where(and(eq(incidents.lotId, lot.id), eq(incidents.status, "open"), eq(incidents.cause, "pcr_positive")))).length).toBe(1);
  });

  it("AC-12 PCR âm tính 5 ngày trước (giới hạn 3) → pcr_expired, 0 lô thành phẩm", async () => {
    const lot = await rearingLot(0);
    await w.db.update(lots).set({ stageId: w.stage.PL12 }).where(eq(lots.id, lot.id));
    const t = await requestLotTest(w.db, w.actors.lead1, lot.id);
    await finalizeTest(w.db, w.actors.lab, t.id, { results: t.results });
    await w.db.update(labTests).set({ sampledAt: new Date(Date.now() - 5 * 86400e3) }).where(eq(labTests.id, t.id));
    await expect(harvestLot(w.db, w.actors.lead1, { lotId: lot.id, countedQty: 600000 })).rejects.toMatchObject({ code: "pcr_expired" });
    expect((await w.db.select().from(finishedLots)).length).toBe(0);
  });

  it("AC-13 + AC-14 thu hoạch 650.000/1.000.000 → QR duy nhất, 65%, bể chờ vệ sinh; truy xuất đủ 5 mắt xích", async () => {
    const lot = await rearingLot(0, 1_000_000);
    await createReceipt(w.db, w.actors.store, { supplier: "NCC", lines: [{ materialId: w.cat.materials.ART90.id, qty: 50, unitCost: 100 }] });
    const req = await createRequest(w.db, w.actors.lead1, { farmId: w.farms.t1.id, lines: [{ materialId: w.cat.materials.ART90.id, qty: 10 }] });
    await issueRequest(w.db, w.actors.store, req.id);
    await syncLogs(w.db, w.actors.worker1, [{ id: randomUUID(), tankId: w.tanks[0].id, kind: "feed", recordedAt: new Date(), materialId: w.cat.materials.ART90.id, qty: 1 }]);
    await w.db.update(lots).set({ stageId: w.stage.PL12 }).where(eq(lots.id, lot.id));
    const t = await requestLotTest(w.db, w.actors.lead1, lot.id);
    await finalizeTest(w.db, w.actors.lab, t.id, { results: t.results });
    const fl = await harvestLot(w.db, w.actors.lead1, { lotId: lot.id, countedQty: 650_000 });
    expect(fl.survivalRate).toBe(0.65);
    expect(fl.qrToken.length).toBeGreaterThan(10);
    const [tank] = await w.db.select().from(tanks).where(eq(tanks.id, w.tanks[0].id));
    expect(tank.status).toBe("cleaning");
    const [l] = await w.db.select().from(lots).where(eq(lots.id, lot.id));
    expect(l.status).toBe("harvested");
    const tr = await traceFinishedLot(w.db, fl.qrToken);
    expect(tr!.links[0].filter(([, ok]) => ok)).toHaveLength(5);
    expect(tr!.branches[0].materials.length).toBeGreaterThanOrEqual(1);
  });
});

describe("NV10 tiêu hao", () => {
  it("AC-7 đồng bộ cùng dòng 2 lần → kho trại chỉ giảm 2 kg, 1 giao dịch", async () => {
    await rearingLot(0);
    await createReceipt(w.db, w.actors.store, { supplier: "NCC", lines: [{ materialId: w.cat.materials.FRIP2.id, qty: 50, unitCost: 10 }] });
    const req = await createRequest(w.db, w.actors.lead1, { farmId: w.farms.t1.id, lines: [{ materialId: w.cat.materials.FRIP2.id, qty: 50 }] });
    await issueRequest(w.db, w.actors.store, req.id);
    const item = { id: randomUUID(), tankId: w.tanks[0].id, kind: "feed" as const, recordedAt: new Date(), materialId: w.cat.materials.FRIP2.id, qty: 2 };
    await syncLogs(w.db, w.actors.worker1, [item]);
    await syncLogs(w.db, w.actors.worker1, [item]);
    const wh = await farmWarehouse(w.db, w.farms.t1.id);
    expect(await stockOf(w.db, wh.id, w.cat.materials.FRIP2.id)).toBe(48);
    expect((await w.db.select().from(stockTx).where(eq(stockTx.refKey, `log:${item.id}`))).length).toBe(1);
  });
});

describe("phân quyền vá theo báo cáo review", () => {
  it("huỷ phiếu XN của trại ngoài quyền → forbidden; công nhân không xác nhận được cảnh báo", async () => {
    const lot = await rearingLot(0);
    const t = await requestLotTest(w.db, w.actors.lead1, lot.id);
    const outsider = { ...w.actors.lab, farmIds: [w.farms.t2.id] };
    const { voidTest } = await import("@/server/production");
    await expect(voidTest(w.db, outsider, t.id, "nhầm")).rejects.toMatchObject({ code: "forbidden" });
    await syncLogs(w.db, w.actors.worker1, [{ id: randomUUID(), tankId: w.tanks[0].id, kind: "water", recordedAt: new Date(), water: { ph: 9.5 } }]);
    const [a] = await w.db.select().from(alerts).where(eq(alerts.lotId, lot.id));
    const { ackAlert } = await import("@/server/alerts");
    await expect(ackAlert(w.db, w.actors.worker1, a.id)).rejects.toMatchObject({ code: "forbidden" });
  });
});
