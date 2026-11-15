import { beforeEach, describe, expect, it, vi } from "vitest";
import { and, eq } from "drizzle-orm";
import { broodstocks, labTests, lots, tasks } from "@/lib/db/schema";
import { generateDailyTasks } from "@/server/planning";
import { createSpawnBatch, finalizeTest, openLot, receiveBroodstock } from "@/server/production";
import { makeWorld, type World } from "./helpers";

// Hồi quy: M1 /hien-truong gọi generateDailyTasks mỗi lần mở; bản cũ chèn mỗi lô một lệnh
// → 144 lô × ~220ms tới Supabase làm phản hồi kéo ~68s. Số lệnh INSERT phải không tăng theo số lô.
let w: World;
beforeEach(async () => { w = await makeWorld(); });

async function lotIn(tankIdx: number) {
  const b = await receiveBroodstock(w.db, w.actors.lead1, { farmId: w.farms.bm.id, speciesId: w.van.id, source: "X", males: 10, females: 100 });
  const [t] = await w.db.select().from(labTests).where(eq(labTests.subjectId, b.id));
  await finalizeTest(w.db, w.actors.lab, t.id, { results: t.results });
  await w.db.update(broodstocks).set({ status: "ready" }).where(eq(broodstocks.id, b.id));
  const batch = await createSpawnBatch(w.db, w.actors.lead1, { broodstockId: b.id, femalesSpawned: 50, nauplius: 1000 });
  const actor = tankIdx < 4 ? w.actors.lead1 : w.actors.lead2;
  const worker = tankIdx < 4 ? w.actors.worker1 : w.actors.worker2;
  return openLot(w.db, actor, { batchId: batch.id, tankId: w.tanks[tankIdx].id, qty: 1000, workerIds: [worker.id] });
}

describe("bug-fix m1-stream 2026-11-15: sinh việc hằng ngày chèn gộp", () => {
  it("nhiều lô → 1 lệnh INSERT, đủ việc mỗi lô, chạy lại không nhân đôi", async () => {
    const opened = [];
    for (const i of [0, 1, 2, 4, 5]) opened.push(await lotIn(i));
    const spy = vi.spyOn(w.db, "insert");
    const created = await generateDailyTasks(w.db, "2026-11-15");
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();

    const perLot = await Promise.all(opened.map(async (l) =>
      (await w.db.select().from(tasks).where(and(eq(tasks.lotId, l.id), eq(tasks.day, "2026-11-15")))).length));
    expect(perLot.every((n) => n > 0)).toBe(true);
    expect(created).toBe(perLot.reduce((a, n) => a + n, 0));

    expect(await generateDailyTasks(w.db, "2026-11-15")).toBe(0);
  });

  it("không có lô đang ương → không gửi lệnh INSERT rỗng", async () => {
    const lot = await lotIn(0);
    await w.db.update(lots).set({ status: "harvested" }).where(eq(lots.id, lot.id));
    const spy = vi.spyOn(w.db, "insert");
    expect(await generateDailyTasks(w.db, "2026-11-15")).toBe(0);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
