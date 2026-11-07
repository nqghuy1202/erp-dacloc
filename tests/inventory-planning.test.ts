import { beforeEach, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { alerts, broodstocks, finishedLots, labTests, lots, notifications, stockCounts, stockTx, tankWorkers, users } from "@/lib/db/schema";
import {
  approveCount, centralWarehouse, createReceipt, createRequest, farmWarehouse, issueRequest, startCount, stockOf, submitCount,
} from "@/server/inventory";
import { addManualTask, generateDailyTasks, overview, planTarget, reviewPlan, savePlan, submitPlan, tasksForUser } from "@/server/planning";
import { createSpawnBatch, finalizeTest, openLot, receiveBroodstock } from "@/server/production";
import { syncLogs } from "@/server/logs";
import { stockLots } from "@/lib/db/schema";
import { makeWorld, type World } from "./helpers";

let w: World;
beforeEach(async () => { w = await makeWorld(); });

async function lotIn(tankIdx: number, qty: number, workerId = w.actors.worker1.id, actor = w.actors.lead1) {
  const b = await receiveBroodstock(w.db, w.actors.lead1, { farmId: w.farms.bm.id, speciesId: w.van.id, source: "X", males: 10, females: 100 });
  const [t] = await w.db.select().from(labTests).where(eq(labTests.subjectId, b.id));
  await finalizeTest(w.db, w.actors.lab, t.id, { results: t.results });
  await w.db.update(broodstocks).set({ status: "ready" }).where(eq(broodstocks.id, b.id));
  const batch = await createSpawnBatch(w.db, w.actors.lead1, { broodstockId: b.id, femalesSpawned: 50, nauplius: qty });
  return openLot(w.db, actor, { batchId: batch.id, tankId: w.tanks[tankIdx].id, qty, workerIds: [workerId] });
}

describe("NV8 nhập kho", () => {
  it("AC-15 vật tư cấm → banned_material, tồn kho tổng == 0", async () => {
    await expect(createReceipt(w.db, w.actors.store, { supplier: "X", lines: [{ materialId: w.cat.materials.ABK.id, qty: 5, unitCost: 1 }] }))
      .rejects.toMatchObject({ code: "banned_material" });
    const c = await centralWarehouse(w.db);
    expect(await stockOf(w.db, c.id, w.cat.materials.ABK.id)).toBe(0);
  });
});

describe("NV9 cấp phát", () => {
  it("AC-16 FEFO: lô A 20kg hạn 01/12, lô B 30kg hạn 15/12, cấp 25 → A 20 + B 5", async () => {
    const X = w.cat.materials.FRIP2.id;
    await createReceipt(w.db, w.actors.store, { supplier: "N", lines: [
      { materialId: X, qty: 30, unitCost: 10, supplierLot: "B", expiry: "2026-12-15" },
      { materialId: X, qty: 20, unitCost: 10, supplierLot: "A", expiry: "2026-12-01" },
    ] });
    const r = await createRequest(w.db, w.actors.lead1, { farmId: w.farms.t1.id, lines: [{ materialId: X, qty: 25 }] });
    const done = await issueRequest(w.db, w.actors.store, r.id);
    expect(done.status).toBe("fulfilled");
    const sl = await w.db.select().from(stockLots).where(eq(stockLots.materialId, X));
    expect(20 - sl.find((s) => s.supplierLot === "A")!.qtyRemaining).toBe(20);
    expect(30 - sl.find((s) => s.supplierLot === "B")!.qtyRemaining).toBe(5);
    expect(await stockOf(w.db, (await farmWarehouse(w.db, w.farms.t1.id)).id, X)).toBe(25);
  });

  it("cấp một phần → partial, phần còn lại vẫn chờ", async () => {
    const X = w.cat.materials.EDTA.id;
    await createReceipt(w.db, w.actors.store, { supplier: "N", lines: [{ materialId: X, qty: 100, unitCost: 1 }] });
    const r = await createRequest(w.db, w.actors.lead1, { farmId: w.farms.t1.id, lines: [{ materialId: X, qty: 25 }] });
    expect((await issueRequest(w.db, w.actors.store, r.id, { [X]: 20 })).status).toBe("partial");
    expect((await issueRequest(w.db, w.actors.store, r.id)).status).toBe("fulfilled");
  });
});

describe("NV10 âm kho", () => {
  it("AC-17 tồn 1kg, ghi 3kg → log lưu, tồn −2, 1 cảnh báo negative_stock cho 2 người", async () => {
    const X = w.cat.materials.ART90.id;
    await lotIn(0, 100000);
    await createReceipt(w.db, w.actors.store, { supplier: "N", lines: [{ materialId: X, qty: 1, unitCost: 1 }] });
    const r = await createRequest(w.db, w.actors.lead1, { farmId: w.farms.t1.id, lines: [{ materialId: X, qty: 1 }] });
    await issueRequest(w.db, w.actors.store, r.id);
    const res = await syncLogs(w.db, w.actors.worker1, [{ id: randomUUID(), tankId: w.tanks[0].id, kind: "feed", recordedAt: new Date(), materialId: X, qty: 3 }]);
    expect(res[0].status).toBe("created");
    const wh = await farmWarehouse(w.db, w.farms.t1.id);
    expect(await stockOf(w.db, wh.id, X)).toBe(-2);
    const a = await w.db.select().from(alerts).where(eq(alerts.type, "negative_stock"));
    expect(a).toHaveLength(1);
    const n = await w.db.select().from(notifications).where(eq(notifications.alertId, a[0].id));
    expect(new Set(n.map((x) => x.userId))).toEqual(new Set([w.actors.lead1.id, w.actors.store.id]));
  });
});

describe("NV11 kiểm kê", () => {
  it("AC-18 sổ 100, thực 95 → chờ duyệt, tồn 100; sau duyệt tồn 95 + 1 adjustment", async () => {
    const X = w.cat.materials.FRIP2.id;
    await createReceipt(w.db, w.actors.store, { supplier: "N", lines: [{ materialId: X, qty: 100, unitCost: 1 }] });
    const r = await createRequest(w.db, w.actors.lead1, { farmId: w.farms.t1.id, lines: [{ materialId: X, qty: 100 }] });
    await issueRequest(w.db, w.actors.store, r.id);
    const wh = await farmWarehouse(w.db, w.farms.t1.id);
    const c = await startCount(w.db, w.actors.store, wh.id);
    const s = await submitCount(w.db, w.actors.store, c.id, { [X]: 95 });
    expect(s.status).toBe("pending_approval");
    expect(await stockOf(w.db, wh.id, X)).toBe(100);
    await approveCount(w.db, w.actors.lead1, c.id);
    expect(await stockOf(w.db, wh.id, X)).toBe(95);
    expect((await w.db.select().from(stockTx).where(and(eq(stockTx.type, "adjust"), eq(stockTx.refKey, `count:${c.id}`)))).length).toBe(1);
    const [after] = await w.db.select().from(stockCounts).where(eq(stockCounts.id, c.id));
    expect(after.status).toBe("approved");
  });
});

describe("NV14 kế hoạch", () => {
  it("AC-21 kế hoạch 10 lô 120tr chỉ thành mốc sau khi BGĐ duyệt", async () => {
    const lines = Array.from({ length: 10 }, () => ({ tankId: w.tanks[0].id, stockDate: "2026-12-01", stockQty: 20_000_000, harvestDate: "2026-12-22", harvestQty: 12_000_000 }));
    const p = await savePlan(w.db, w.actors.lead1, { farmId: w.farms.t1.id, month: "2026-12", lines });
    await submitPlan(w.db, w.actors.lead1, p.id);
    expect(await planTarget(w.db, w.farms.t1.id, "2026-12")).toBeNull();
    const ok = await reviewPlan(w.db, w.actors.director, p.id, "approve");
    expect(ok.status).toBe("approved");
    expect(await planTarget(w.db, w.farms.t1.id, "2026-12")).toBe(120_000_000);
  });
});

describe("NV12 tổng quan", () => {
  it("AC-19 3 lô 1tr + 2tr + 0,5tr ở 2 trại → 3 lô, 3.500.000 PL", async () => {
    await lotIn(0, 1_000_000);
    await lotIn(1, 2_000_000);
    await lotIn(4, 500_000, w.actors.worker2.id, w.actors.lead2);
    const o = await overview(w.db);
    expect(o.activeLots).toBe(3);
    expect(o.estimatedPl).toBe(3_500_000);
  });

  it("AC-22 mốc T2=40tr, T7=50tr; thực T2=30tr, T7=10tr → T7 (20%) trước T2 (75%)", async () => {
    // T1 đóng vai "T7", T2 giữ "T2"
    const month = "2026-11";
    for (const [farm, lead, tank, target] of [[w.farms.t1, w.actors.lead1, w.tanks[0], 50e6], [w.farms.t2, w.actors.lead2, w.tanks[4], 40e6]] as const) {
      const p = await savePlan(w.db, lead, { farmId: farm.id, month, lines: [{ tankId: tank.id, stockDate: "2026-11-01", stockQty: 1, harvestDate: "2026-11-05", harvestQty: target }] });
      await submitPlan(w.db, lead, p.id);
      await reviewPlan(w.db, w.actors.director, p.id, "approve");
    }
    const l1 = await lotIn(0, 100);
    const l2 = await lotIn(4, 100, w.actors.worker2.id, w.actors.lead2);
    await w.db.insert(finishedLots).values([
      { code: "TP1", qrToken: "q1", sourceLotIds: [l1.id], qty: 10e6, stageCode: "PL12", survivalRate: 1, harvestedAt: new Date("2026-11-08T03:00:00Z") },
      { code: "TP2", qrToken: "q2", sourceLotIds: [l2.id], qty: 30e6, stageCode: "PL12", survivalRate: 1, harvestedAt: new Date("2026-11-08T03:00:00Z") },
    ]);
    const o = await overview(w.db, "2026-11-10");
    expect(o.ranking[0].farmId).toBe(w.farms.t1.id);
    expect(o.ranking[0].pctOfToDate).toBe(20);
    expect(o.ranking[1].farmId).toBe(w.farms.t2.id);
    expect(o.ranking[1].pctOfToDate).toBe(75);
  });
});

describe("NV15 việc hằng ngày", () => {
  it("AC-23 lô Mysis: chạy sinh việc 2 lần → đúng 8 việc", async () => {
    const lot = await lotIn(0, 1000);
    await w.db.update(lots).set({ stageId: w.stage.M2 }).where(eq(lots.id, lot.id));
    await generateDailyTasks(w.db, "2026-11-07");
    await generateDailyTasks(w.db, "2026-11-07");
    const { tasks } = await import("@/lib/db/schema");
    expect((await w.db.select().from(tasks).where(and(eq(tasks.lotId, lot.id), eq(tasks.day, "2026-11-07")))).length).toBe(8);
  });

  it("AC-24 việc đột xuất chỉ đến công nhân của bể", async () => {
    await lotIn(0, 1000);
    const [ok] = await w.db.select().from(tankWorkers).where(eq(tankWorkers.tankId, w.tanks[0].id));
    expect(ok.userId).toBe(w.actors.worker1.id);
    await addManualTask(w.db, w.actors.lead1, { tankId: w.tanks[0].id, slot: "08:30", title: "Đo lại pH", day: "2026-11-07" });
    const mine = await tasksForUser(w.db, w.actors.worker1, "2026-11-07");
    const other = await tasksForUser(w.db, w.actors.worker1b, "2026-11-07");
    expect(mine.filter((t) => t.task.title === "Đo lại pH")).toHaveLength(1);
    expect(other.filter((t) => t.task.title === "Đo lại pH")).toHaveLength(0);
    void users;
  });
});
