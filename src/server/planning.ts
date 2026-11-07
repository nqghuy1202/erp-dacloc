import { and, asc, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { z } from "zod";
import type { DB } from "@/lib/db/types";
import { alerts, farms, finishedLots, lots, planLines, plans, stages, tankWorkers, tanks, tasks } from "@/lib/db/schema";
import { assertFarm, assertRole } from "./access";
import { raiseAlert } from "./alerts";
import { fail } from "./errors";
import type { Actor } from "./types";
import { ymd } from "./util";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

// ───────── NV14 Kế hoạch sản xuất
export const planInput = z.object({
  farmId: z.coerce.number().int().positive(),
  month: z.string().regex(/^\d{4}-\d{2}$/),
  lines: z.array(z.object({
    tankId: z.coerce.number().int().positive(), stockDate: isoDate, stockQty: z.coerce.number().int().positive(),
    harvestDate: isoDate, harvestQty: z.coerce.number().int().positive(),
  })).min(1, "Cần ít nhất 1 lô dự kiến"),
});

/** Lưu nháp (tạo phiên bản mới nếu bản hiện hành đã duyệt — R11) */
export async function savePlan(db: DB, actor: Actor, input: z.input<typeof planInput>) {
  assertRole(actor, ["farm_lead"]);
  const v = planInput.parse(input);
  assertFarm(actor, v.farmId);
  for (const l of v.lines) if (l.harvestDate < l.stockDate) fail("invalid_input", "Ngày thu trước ngày thả");
  const farmTanks = await db.select({ id: tanks.id }).from(tanks).where(eq(tanks.farmId, v.farmId));
  if (v.lines.some((l) => !farmTanks.some((t) => t.id === l.tankId))) fail("invalid_input", "Bể không thuộc trại");
  return db.transaction(async (txRaw) => {
    const tx = txRaw as unknown as DB;
    const [cur] = await tx.select().from(plans).where(and(eq(plans.farmId, v.farmId), eq(plans.month, v.month))).orderBy(desc(plans.version)).limit(1);
    let plan = cur;
    if (!cur || cur.status === "approved" || cur.status === "pending") {
      if (cur?.status === "pending") fail("plan_not_editable", "Kế hoạch đang chờ duyệt");
      [plan] = await tx.insert(plans).values({ farmId: v.farmId, month: v.month, version: (cur?.version ?? 0) + 1, createdBy: actor.id }).returning();
    } else {
      await tx.delete(planLines).where(eq(planLines.planId, cur.id));
      [plan] = await tx.update(plans).set({ status: "draft", returnReason: null }).where(eq(plans.id, cur.id)).returning();
    }
    await tx.insert(planLines).values(v.lines.map((l) => ({ planId: plan!.id, ...l })));
    return plan!;
  });
}

export async function submitPlan(db: DB, actor: Actor, planId: number) {
  assertRole(actor, ["farm_lead"]);
  const [p] = await db.select().from(plans).where(eq(plans.id, planId));
  if (!p) fail("not_found");
  assertFarm(actor, p!.farmId);
  if (!["draft", "returned"].includes(p!.status)) fail("plan_not_editable");
  const [row] = await db.update(plans).set({ status: "pending", submittedAt: new Date() }).where(eq(plans.id, planId)).returning();
  const [f] = await db.select().from(farms).where(eq(farms.id, p!.farmId));
  await raiseAlert(db, { type: "plan_pending", farmId: p!.farmId, title: `Kế hoạch ${p!.month} · ${f.name} chờ duyệt`, dedupeKey: `plan:${p!.id}`, notifyRoles: ["director"] });
  return row;
}

export async function reviewPlan(db: DB, actor: Actor, planId: number, decision: "approve" | "return", reason = "") {
  assertRole(actor, ["director"]);
  return db.transaction(async (txRaw) => {
    const tx = txRaw as unknown as DB;
    const [p] = await tx.select().from(plans).where(eq(plans.id, planId));
    if (!p || p.status !== "pending") fail("plan_not_editable", "Kế hoạch không ở trạng thái chờ duyệt");
    if (decision === "return") {
      if (!reason.trim()) fail("invalid_input", "Cần lý do trả lại");
      const [row] = await tx.update(plans).set({ status: "returned", returnReason: reason.trim() }).where(eq(plans.id, planId)).returning();
      return row;
    }
    await tx.update(plans).set({ status: "superseded" }).where(and(eq(plans.farmId, p!.farmId), eq(plans.month, p!.month), eq(plans.status, "approved")));
    const [row] = await tx.update(plans).set({ status: "approved", approvedAt: new Date(), approvedBy: actor.id }).where(eq(plans.id, planId)).returning();
    await tx.update(alerts).set({ status: "closed" }).where(eq(alerts.dedupeKey, `plan:${planId}`));
    return row;
  });
}

/** Mốc kế hoạch (chỉ bản đã duyệt — R11). upTo: tính các lô có ngày thu ≤ upTo */
export async function planTarget(db: DB, farmId: number, month: string, upTo?: string) {
  const [p] = await db.select().from(plans).where(and(eq(plans.farmId, farmId), eq(plans.month, month), eq(plans.status, "approved")));
  if (!p) return null;
  const conds = [eq(planLines.planId, p.id)];
  if (upTo) conds.push(lte(planLines.harvestDate, upTo));
  const [r] = await db.select({ s: sql<number>`coalesce(sum(${planLines.harvestQty}),0)::float8` }).from(planLines).where(and(...conds));
  return Number(r.s);
}

// ───────── NV12 Tổng quan
export async function overview(db: DB, today = ymd(new Date())) {
  const month = today.slice(0, 7);
  const monthStart = `${month}-01`;
  const allFarms = await db.select().from(farms).orderBy(asc(farms.code));
  const rearing = await db.select({ farmId: lots.farmId, n: sql<number>`count(*)::int`, est: sql<number>`coalesce(sum(${lots.estimatedQty}),0)::float8` })
    .from(lots).where(eq(lots.status, "rearing")).groupBy(lots.farmId);
  const harvested = await db.select({ lotId: finishedLots.sourceLotIds, qty: finishedLots.qty, at: finishedLots.harvestedAt }).from(finishedLots)
    .where(gte(finishedLots.harvestedAt, new Date(`${monthStart}T00:00:00+07:00`)));
  const lotFarm = harvested.length
    ? await db.select({ id: lots.id, farmId: lots.farmId }).from(lots).where(inArray(lots.id, harvested.flatMap((h) => h.lotId)))
    : [];
  const actualBy = new Map<number, number>();
  for (const h of harvested) {
    const fid = lotFarm.find((l) => l.id === h.lotId[0])?.farmId;
    if (fid) actualBy.set(fid, (actualBy.get(fid) ?? 0) + h.qty);
  }
  // một truy vấn cho mốc kế hoạch mọi trại (chỉ bản đã duyệt — R11)
  const targets = await db.select({
    farmId: plans.farmId,
    month: sql<number>`coalesce(sum(${planLines.harvestQty}),0)::float8`,
    toDate: sql<number>`coalesce(sum(${planLines.harvestQty}) filter (where ${planLines.harvestDate} <= ${today}),0)::float8`,
  }).from(plans).innerJoin(planLines, eq(planLines.planId, plans.id))
    .where(and(eq(plans.month, month), eq(plans.status, "approved"))).groupBy(plans.farmId);
  const ranking = [];
  let planMonth = 0, planToDate = 0, hasPlan = false;
  // trại bố mẹ không có sản lượng PL → không xếp hạng
  for (const f of allFarms.filter((x) => x.kind === "hatchery")) {
    const tg = targets.find((x) => x.farmId === f.id);
    const pm = tg ? Number(tg.month) : null;
    const pt = tg ? Number(tg.toDate) : null;
    const actual = actualBy.get(f.id) ?? 0;
    if (pm != null) { hasPlan = true; planMonth += pm; planToDate += pt ?? 0; }
    ranking.push({
      farmId: f.id, farm: f.code, name: f.name, actual, planMonth: pm, planToDate: pt,
      pct: pm ? Math.round((actual / pm) * 1000) / 10 : null,
      pctOfToDate: pt ? Math.round((actual / pt) * 100) : null,
    });
  }
  // AC-22: xếp tăng dần theo % đạt so với mốc tới hôm nay; trại chưa có kế hoạch xuống cuối
  ranking.sort((a, b) => (a.pctOfToDate ?? Infinity) - (b.pctOfToDate ?? Infinity));
  const actualTotal = [...actualBy.values()].reduce((a, b) => a + b, 0);
  return {
    today, month,
    activeLots: rearing.reduce((a, r) => a + r.n, 0),
    estimatedPl: rearing.reduce((a, r) => a + Number(r.est), 0),
    actualMonth: actualTotal, planMonth: hasPlan ? planMonth : null, planToDate: hasPlan ? planToDate : null,
    ranking,
  };
}

// ───────── NV15 Việc hằng ngày
/** Sinh việc theo lịch mẫu giai đoạn — idempotent (R12, AC-23) */
export async function generateDailyTasks(db: DB, day = ymd(new Date())) {
  const rows = await db.select({ lot: lots, stage: stages }).from(lots).innerJoin(stages, eq(stages.id, lots.stageId)).where(eq(lots.status, "rearing"));
  let created = 0;
  for (const { lot, stage } of rows) {
    const vals = [
      ...stage.feedTimes.map((slot) => ({ kind: "feed", slot, title: "Cho ăn" })),
      ...stage.waterTimes.map((slot) => ({ kind: "water", slot, title: "Đo nước" })),
    ].map((t) => ({ ...t, lotId: lot.id, tankId: lot.tankId, day, source: "auto" }));
    if (!vals.length) continue;
    const ins = await db.insert(tasks).values(vals).onConflictDoNothing().returning({ id: tasks.id });
    created += ins.length;
  }
  return created;
}

export const manualTaskInput = z.object({
  tankId: z.coerce.number().int().positive(), slot: z.string().regex(/^\d{2}:\d{2}$/), title: z.string().trim().min(1).max(120),
  day: isoDate.optional(),
});

/** Việc đột xuất (AC-24) — gán cho công nhân của bể */
export async function addManualTask(db: DB, actor: Actor, input: z.input<typeof manualTaskInput>) {
  assertRole(actor, ["farm_lead"]);
  const v = manualTaskInput.parse(input);
  const [t] = await db.select().from(tanks).where(eq(tanks.id, v.tankId));
  if (!t) fail("not_found");
  assertFarm(actor, t!.farmId);
  const [lot] = await db.select().from(lots).where(and(eq(lots.tankId, v.tankId), eq(lots.status, "rearing")));
  if (!lot) fail("lot_not_rearing", "Bể không có lô đang ương");
  const [row] = await db.insert(tasks).values({
    lotId: lot!.id, tankId: v.tankId, day: v.day ?? ymd(new Date()), slot: v.slot, kind: "custom", title: v.title, source: "manual", createdBy: actor.id,
  }).returning();
  return row;
}

export async function tasksForUser(db: DB, actor: Actor, day = ymd(new Date())) {
  const tankIds = actor.role === "worker"
    ? (await db.select({ id: tankWorkers.tankId }).from(tankWorkers).where(eq(tankWorkers.userId, actor.id))).map((r) => r.id)
    : (await db.select({ id: tanks.id }).from(tanks).where(actor.farmIds.length ? inArray(tanks.farmId, actor.farmIds) : sql`true`)).map((r) => r.id);
  if (!tankIds.length) return [];
  return db.select({ task: tasks, tankCode: tanks.code }).from(tasks).innerJoin(tanks, eq(tanks.id, tasks.tankId))
    .where(and(eq(tasks.day, day), inArray(tasks.tankId, tankIds), sql`${tasks.status} <> 'cancelled'`))
    .orderBy(asc(tasks.slot), asc(tanks.code));
}
