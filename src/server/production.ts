import { and, asc, desc, eq, gt, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import type { DB } from "@/lib/db/types";
import {
  broodstocks, finishedLots, incidents, labTests, logs, lots, materials, spawnBatches, species, stages, tankWorkers, tanks,
} from "@/lib/db/schema";
import { assertFarm, assertRole } from "./access";
import { closeAlert, raiseAlert } from "./alerts";
import { fail } from "./errors";
import type { Actor } from "./types";
import { addDays, makeCode, token, ymd } from "./util";

const posInt = z.coerce.number().int().positive();

// ───────── NV1 Đàn bố mẹ
export const broodstockInput = z.object({
  farmId: posInt, tankId: posInt.optional(), speciesId: posInt, source: z.string().trim().min(1).max(120),
  origin: z.string().trim().max(120).default(""), line: z.string().trim().max(60).default(""),
  males: z.coerce.number().int().min(0).max(100000), females: z.coerce.number().int().min(1).max(100000),
  quarantineDoc: z.string().trim().max(120).default(""),
});

export async function receiveBroodstock(db: DB, actor: Actor, input: z.input<typeof broodstockInput>) {
  assertRole(actor, ["farm_lead"]);
  const v = broodstockInput.parse(input);
  assertFarm(actor, v.farmId);
  return db.transaction(async (tx) => {
    const [b] = await tx.insert(broodstocks).values({ ...v, code: makeCode("BM"), status: "quarantine" }).returning();
    const [sp] = await tx.select().from(species).where(eq(species.id, v.speciesId));
    // H1: phiếu xét nghiệm đầu vào chờ U3, hạn 48h
    await tx.insert(labTests).values({
      code: makeCode("XN"), subjectType: "broodstock", subjectId: b.id, kind: "pcr",
      dueAt: new Date(Date.now() + 48 * 3600 * 1000), results: (sp?.requiredDiseases ?? []).map((indicator) => ({ indicator, positive: false })),
    });
    return b;
  });
}

// ───────── NV5 Xét nghiệm
export const testResultInput = z.object({
  results: z.array(z.object({ indicator: z.string().min(1), positive: z.boolean() })).min(1),
  lab: z.string().trim().max(80).optional(),
});

export async function requestLotTest(db: DB, actor: Actor, lotId: number, kind: "pcr" | "micro" | "quality" = "pcr") {
  assertRole(actor, ["farm_lead", "lab"]);
  const lot = await getLot(db, lotId);
  assertFarm(actor, lot.farmId);
  const [sp] = await db.select().from(species).where(eq(species.id, lot.speciesId));
  const [t] = await db.insert(labTests).values({
    code: makeCode("XN"), subjectType: "lot", subjectId: lotId, kind, dueAt: new Date(Date.now() + 24 * 3600 * 1000),
    results: kind === "pcr" ? sp.requiredDiseases.map((indicator) => ({ indicator, positive: false })) : [],
  }).returning();
  return t;
}

/** Chốt phiếu (R10): không sửa sau khi chốt. Dương tính → loại đàn (AC-3) / mở sự cố (AC-11) */
export async function finalizeTest(db: DB, actor: Actor, testId: number, input: z.input<typeof testResultInput>) {
  assertRole(actor, ["lab"]);
  const v = testResultInput.parse(input);
  return db.transaction(async (tx) => {
    const [t] = await tx.select().from(labTests).where(eq(labTests.id, testId));
    if (!t) fail("not_found");
    if (t!.status !== "pending") fail("test_already_final", "Phiếu đã chốt hoặc đã huỷ");
    const positives = v.results.filter((r) => r.positive).map((r) => r.indicator);
    const [done] = await tx.update(labTests).set({
      results: v.results, status: "final", finalizedAt: new Date(), finalizedBy: actor.id, ...(v.lab ? { lab: v.lab } : {}),
    }).where(eq(labTests.id, testId)).returning();

    if (t!.subjectType === "broodstock") {
      const [b] = await tx.select().from(broodstocks).where(eq(broodstocks.id, t!.subjectId));
      assertFarm(actor, b.farmId);
      const status = positives.length ? "culled" : "ready";
      await tx.update(broodstocks).set({ status }).where(eq(broodstocks.id, b.id));
      if (positives.length) {
        await raiseAlert(tx as unknown as DB, {
          type: "test_positive", severity: "bad", farmId: b.farmId, title: `${positives.join(", ")} dương tính · đàn ${b.code}`,
          detail: "Đàn đã chuyển Loại bỏ",
        });
      }
    } else if (t!.subjectType === "lot") {
      const lot = await getLot(tx as unknown as DB, t!.subjectId);
      assertFarm(actor, lot.farmId);
      if (positives.length) {
        const alert = await raiseAlert(tx as unknown as DB, {
          type: "pcr_positive", severity: "bad", farmId: lot.farmId, lotId: lot.id, tankId: lot.tankId,
          title: `${positives.join(", ")} dương tính · ${lot.code}`, detail: "Sự cố đã mở, chờ trưởng trại xử lý",
          notifyRoles: ["farm_lead", "director"],
        });
        await tx.insert(incidents).values({ lotId: lot.id, alertId: alert.id, cause: "pcr_positive" });
      }
    }
    return done;
  });
}

export async function voidTest(db: DB, actor: Actor, testId: number, reason: string) {
  assertRole(actor, ["lab"]);
  if (!reason.trim()) fail("invalid_input", "Cần lý do huỷ");
  const [t] = await db.select().from(labTests).where(eq(labTests.id, testId));
  if (!t) fail("not_found");
  if (t!.status === "void") fail("test_already_final", "Phiếu đã huỷ");
  const farmId = t!.subjectType === "lot"
    ? (await getLot(db, t!.subjectId)).farmId
    : (await db.select({ f: broodstocks.farmId }).from(broodstocks).where(eq(broodstocks.id, t!.subjectId)))[0]?.f;
  if (farmId) assertFarm(actor, farmId);
  await db.update(labTests).set({ status: "void", voidReason: reason.trim() }).where(eq(labTests.id, testId));
  // R2 edge: huỷ kết quả đã làm đàn "sẵn sàng" → quay về chờ xét nghiệm
  if (t!.subjectType === "broodstock" && t!.status === "final") {
    await db.update(broodstocks).set({ status: "quarantine" }).where(and(eq(broodstocks.id, t!.subjectId), eq(broodstocks.status, "ready")));
  }
}

// ───────── NV2 Mẻ đẻ
export const spawnInput = z.object({
  broodstockId: posInt, femalesSpawned: posInt, nauplius: z.coerce.number().int().positive().max(1_000_000_000),
});

export async function createSpawnBatch(db: DB, actor: Actor, input: z.input<typeof spawnInput>) {
  assertRole(actor, ["farm_lead"]);
  const v = spawnInput.parse(input);
  const [b] = await db.select().from(broodstocks).where(eq(broodstocks.id, v.broodstockId));
  if (!b) fail("not_found");
  assertFarm(actor, b!.farmId);
  if (b!.status !== "ready") fail("broodstock_not_ready", "Đàn chưa sẵn sàng (chưa có kết quả âm tính)");
  if (v.femalesSpawned > b!.females) fail("invalid_input", "Số con cái cho đẻ vượt số cái của đàn");
  const [row] = await db.insert(spawnBatches).values({ code: makeCode("ME"), broodstockId: b!.id, femalesSpawned: v.femalesSpawned, nauplius: v.nauplius, remaining: v.nauplius }).returning();
  return row;
}

export async function cancelSpawnBatch(db: DB, actor: Actor, batchId: number, reason: string) {
  assertRole(actor, ["farm_lead"]);
  if (!reason.trim()) fail("invalid_input", "Cần lý do huỷ");
  const [row] = await db.select({ farmId: broodstocks.farmId }).from(spawnBatches).innerJoin(broodstocks, eq(broodstocks.id, spawnBatches.broodstockId)).where(eq(spawnBatches.id, batchId));
  if (!row) fail("not_found");
  assertFarm(actor, row!.farmId);
  await db.update(spawnBatches).set({ status: "cancelled", cancelReason: reason.trim() }).where(and(eq(spawnBatches.id, batchId), eq(spawnBatches.status, "open")));
}

// ───────── NV3 Mở lô ương
export const openLotInput = z.object({
  batchId: posInt, tankId: posInt, qty: posInt, workerIds: z.array(posInt).min(1, "Cần giao ít nhất 1 công nhân"),
  expectedHarvestAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export async function openLot(db: DB, actor: Actor, input: z.input<typeof openLotInput>) {
  assertRole(actor, ["farm_lead"]);
  const v = openLotInput.parse(input);
  return db.transaction(async (tx) => {
    const [tank] = await tx.select().from(tanks).where(eq(tanks.id, v.tankId));
    if (!tank) fail("not_found", "Không tìm thấy bể");
    assertFarm(actor, tank!.farmId);
    const [busy] = await tx.select({ id: lots.id }).from(lots).where(and(eq(lots.tankId, v.tankId), eq(lots.status, "rearing")));
    if (busy || tank!.status === "rearing") fail("tank_busy", "Bể đang có lô ương");
    // R3: trừ có điều kiện để hai người phân cùng lúc không vượt mẻ
    const [batch] = await tx.update(spawnBatches).set({ remaining: sql`${spawnBatches.remaining} - ${v.qty}` })
      .where(and(eq(spawnBatches.id, v.batchId), eq(spawnBatches.status, "open"), sql`${spawnBatches.remaining} >= ${v.qty}`)).returning();
    if (!batch) {
      const [exists] = await tx.select().from(spawnBatches).where(eq(spawnBatches.id, v.batchId));
      if (!exists) fail("not_found", "Không tìm thấy mẻ");
      fail("exceeds_batch_remaining", `Mẻ chỉ còn ${exists!.remaining}`);
    }
    if (batch!.remaining === 0) await tx.update(spawnBatches).set({ status: "used" }).where(eq(spawnBatches.id, batch!.id));
    const [brood] = await tx.select().from(broodstocks).where(eq(broodstocks.id, batch!.broodstockId));
    const [first] = await tx.select().from(stages).where(eq(stages.speciesId, brood.speciesId)).orderBy(asc(stages.seq)).limit(1);
    const total = await tx.select({ days: sql<number>`coalesce(sum(${stages.days}),0)::int` }).from(stages)
      .innerJoin(species, eq(species.id, stages.speciesId))
      .where(and(eq(stages.speciesId, brood.speciesId), sql`${stages.seq} <= ${species.harvestMinStageSeq}`));
    const [lot] = await tx.insert(lots).values({
      code: `L-${tank!.code}-${makeCode("").slice(1)}`, farmId: tank!.farmId, tankId: tank!.id, speciesId: brood.speciesId, batchId: batch!.id,
      stageId: first.id, stockedQty: v.qty, estimatedQty: v.qty, expectedHarvestAt: v.expectedHarvestAt ?? addDays(ymd(new Date()), total[0].days),
    }).returning();
    await tx.update(tanks).set({ status: "rearing" }).where(eq(tanks.id, tank!.id));
    await tx.delete(tankWorkers).where(eq(tankWorkers.tankId, tank!.id));
    await tx.insert(tankWorkers).values(v.workerIds.map((userId) => ({ tankId: tank!.id, userId })));
    return lot;
  });
}

export async function getLot(db: DB, lotId: number) {
  const [l] = await db.select().from(lots).where(eq(lots.id, lotId));
  if (!l) fail("not_found", "Không tìm thấy lô");
  return l!;
}

/** Chuyển sang giai đoạn kế tiếp (đề xuất từ nhật ký hoặc trưởng trại) */
export async function advanceStage(db: DB, lotId: number) {
  const lot = await getLot(db, lotId);
  const [cur] = await db.select().from(stages).where(eq(stages.id, lot.stageId));
  const [next] = await db.select().from(stages).where(and(eq(stages.speciesId, lot.speciesId), gt(stages.seq, cur.seq))).orderBy(asc(stages.seq)).limit(1);
  if (!next) return lot;
  const [row] = await db.update(lots).set({ stageId: next.id, stageStartedAt: new Date() }).where(eq(lots.id, lotId)).returning();
  return row;
}

// ───────── NV6 Thu hoạch
export async function harvestEligibility(db: DB, lotId: number, now = new Date()) {
  const lot = await getLot(db, lotId);
  const [sp] = await db.select().from(species).where(eq(species.id, lot.speciesId));
  const [st] = await db.select().from(stages).where(eq(stages.id, lot.stageId));
  const [pcr] = await db.select().from(labTests)
    .where(and(eq(labTests.subjectType, "lot"), eq(labTests.subjectId, lotId), eq(labTests.kind, "pcr"), eq(labTests.status, "final")))
    .orderBy(desc(labTests.sampledAt)).limit(1);
  const ageDays = pcr ? (now.getTime() - pcr.sampledAt.getTime()) / 86400000 : Infinity;
  const positive = pcr?.results.some((r) => r.positive) ?? false;
  const checks = {
    pcr: !pcr ? "pcr_missing" : positive ? "pcr_positive" : ageDays > sp.pcrValidDays ? "pcr_expired" : "ok",
    stage: st.seq >= sp.harvestMinStageSeq ? "ok" : "stage_too_early",
    status: lot.status === "rearing" ? "ok" : "lot_not_rearing",
  } as const;
  return { lot, stage: st, species: sp, pcr: pcr ?? null, pcrValidUntil: pcr ? new Date(pcr.sampledAt.getTime() + sp.pcrValidDays * 86400000) : null, checks };
}

export const harvestInput = z.object({ lotId: posInt, countedQty: posInt });

export async function harvestLot(db: DB, actor: Actor, input: z.input<typeof harvestInput>, now = new Date()) {
  assertRole(actor, ["farm_lead"]);
  const v = harvestInput.parse(input);
  return db.transaction(async (tx) => {
    const e = await harvestEligibility(tx as unknown as DB, v.lotId, now);
    assertFarm(actor, e.lot.farmId);
    for (const c of [e.checks.status, e.checks.pcr, e.checks.stage]) if (c !== "ok") fail(c);
    const [fl] = await tx.insert(finishedLots).values({
      code: makeCode("TP"), qrToken: token(), sourceLotIds: [e.lot.id], qty: v.countedQty, stageCode: e.stage.code,
      survivalRate: Math.round((v.countedQty / e.lot.stockedQty) * 10000) / 10000, harvestedBy: actor.id, pcrTestId: e.pcr!.id,
    }).returning();
    await tx.update(lots).set({ status: "harvested", closedAt: now, estimatedQty: v.countedQty }).where(eq(lots.id, e.lot.id));
    await tx.update(tanks).set({ status: "cleaning" }).where(eq(tanks.id, e.lot.tankId));
    return fl;
  });
}

// ───────── NV7 Sự cố
export const resolveInput = z.object({
  action: z.enum(["monitor", "treat", "cull"]), note: z.string().trim().max(500).default(""),
  culledQty: z.coerce.number().int().min(0).optional(),
});

export async function resolveIncident(db: DB, actor: Actor, incidentId: number, input: z.input<typeof resolveInput>) {
  assertRole(actor, ["farm_lead"]);
  const v = resolveInput.parse(input);
  return db.transaction(async (tx) => {
    const [inc] = await tx.select().from(incidents).where(eq(incidents.id, incidentId));
    if (!inc) fail("not_found");
    const lot = await getLot(tx as unknown as DB, inc!.lotId);
    assertFarm(actor, lot.farmId);
    if (v.action === "cull") {
      if (!v.note) fail("invalid_input", "Huỷ lô cần lý do");
      await tx.update(lots).set({ status: "cancelled", closedAt: new Date() }).where(eq(lots.id, lot.id));
      await tx.update(tanks).set({ status: "cleaning" }).where(eq(tanks.id, lot.tankId));
    }
    const [row] = await tx.update(incidents).set({ status: "resolved", action: v.action, note: v.note, resolvedAt: new Date(), resolvedBy: actor.id })
      .where(eq(incidents.id, incidentId)).returning();
    if (inc!.alertId) await closeAlert(tx as unknown as DB, inc!.alertId);
    return row;
  });
}

export async function markTankClean(db: DB, actor: Actor, tankId: number) {
  assertRole(actor, ["farm_lead"]);
  const [t] = await db.select().from(tanks).where(eq(tanks.id, tankId));
  if (!t) fail("not_found");
  assertFarm(actor, t!.farmId);
  await db.update(tanks).set({ status: "empty" }).where(and(eq(tanks.id, tankId), eq(tanks.status, "cleaning")));
}

// ───────── NV13 Truy xuất
export async function traceFinishedLot(db: DB, codeOrToken: string) {
  const key = codeOrToken.trim();
  const [fl] = await db.select().from(finishedLots).where(sql`${finishedLots.code} = ${key} or ${finishedLots.qrToken} = ${key}`);
  if (!fl) return null;
  const srcLots = await db.select().from(lots).where(inArray(lots.id, fl.sourceLotIds));
  const branches = await Promise.all(srcLots.map(async (l) => {
    const [tank] = await db.select().from(tanks).where(eq(tanks.id, l.tankId));
    const [batch] = l.batchId ? await db.select().from(spawnBatches).where(eq(spawnBatches.id, l.batchId)) : [];
    const [brood] = batch ? await db.select().from(broodstocks).where(eq(broodstocks.id, batch.broodstockId)) : [];
    const broodTests = brood ? await db.select().from(labTests).where(and(eq(labTests.subjectType, "broodstock"), eq(labTests.subjectId, brood.id), eq(labTests.status, "final"))) : [];
    const lotTests = await db.select().from(labTests).where(and(eq(labTests.subjectType, "lot"), eq(labTests.subjectId, l.id), eq(labTests.status, "final")));
    const mats = await db.select({ name: materials.name, unit: materials.unit, qty: sql<number>`sum(${logs.qty})` })
      .from(logs).innerJoin(materials, eq(materials.id, logs.materialId)).where(eq(logs.lotId, l.id)).groupBy(materials.name, materials.unit);
    return { lot: l, tank: tank ?? null, batch: batch ?? null, broodstock: brood ?? null, broodTests, lotTests, materials: mats };
  }));
  const links = (b: (typeof branches)[number]) => [
    ["finished", true], ["lot", !!b.lot], ["batch", !!b.batch], ["broodstock", !!b.broodstock], ["pcr", b.lotTests.some((t) => t.kind === "pcr")],
  ] as const;
  return { finished: fl, branches, links: branches.map(links) };
}
