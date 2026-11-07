import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import type { DB } from "@/lib/db/types";
import { lots, logs, materials, stages, tasks, waterThresholds } from "@/lib/db/schema";
import { assertCanLogTank } from "./access";
import { raiseAlert } from "./alerts";
import { fail } from "./errors";
import { advanceStage } from "./production";
import { consumeForLog } from "./inventory";
import type { Actor } from "./types";

export const WATER_PARAMS = ["ph", "temp", "salinity", "do"] as const;
/** Giới hạn vật lý — giá trị phi lý bị chặn tại biên (ma trận M2 "dữ liệu cực đoan") */
const PHYSICAL: Record<string, [number, number]> = { ph: [0, 14], temp: [0, 45], salinity: [0, 60], do: [0, 30] };
const SUSPECT_CLOCK_MS = 10 * 60 * 1000; // R9

export const logInput = z.object({
  id: z.string().uuid(),
  tankId: z.coerce.number().int().positive(),
  kind: z.enum(["feed", "water", "loss", "stage", "note"]),
  recordedAt: z.coerce.date(),
  clientNow: z.coerce.date().optional(),
  materialId: z.coerce.number().int().positive().optional(),
  qty: z.coerce.number().positive().max(100000).optional(),
  water: z.object({ ph: z.number(), temp: z.number(), salinity: z.number(), do: z.number() }).partial().optional(),
  lossPct: z.coerce.number().min(0).max(100).optional(),
  note: z.string().max(500).optional(),
  taskId: z.coerce.number().int().positive().optional(),
});
export type LogInput = z.input<typeof logInput>;

export type SyncResult = { id: string; status: "created" | "duplicate" | "rejected"; error?: string; alerts?: string[] };

/** Đồng bộ nhật ký (offline outbox). Idempotent theo id (AC-6, AC-7). */
export async function syncLogs(db: DB, actor: Actor, items: LogInput[], serverNow = new Date()): Promise<SyncResult[]> {
  const out: SyncResult[] = [];
  for (const raw of items) {
    const parsed = logInput.safeParse(raw);
    if (!parsed.success) { out.push({ id: String((raw as { id?: string }).id ?? ""), status: "rejected", error: "invalid_input" }); continue; }
    try {
      out.push(await saveLog(db, actor, parsed.data, serverNow));
    } catch (e) {
      const code = (e as { code?: string }).code ?? "error";
      out.push({ id: parsed.data.id, status: "rejected", error: code });
    }
  }
  return out;
}

async function saveLog(db: DB, actor: Actor, v: z.output<typeof logInput>, serverNow: Date): Promise<SyncResult> {
  const [dup] = await db.select({ id: logs.id }).from(logs).where(eq(logs.id, v.id));
  if (dup) return { id: v.id, status: "duplicate" };
  const tank = await assertCanLogTank(db, actor, v.tankId);
  const [lot] = await db.select().from(lots).where(and(eq(lots.tankId, tank.id), eq(lots.status, "rearing")));
  if (!lot) fail("lot_not_rearing", "Bể không có lô đang ương");

  const data: Record<string, number | string | null> = {};
  if (v.kind === "feed") {
    if (!v.materialId || !v.qty) fail("invalid_input", "Cần vật tư và lượng");
    const [m] = await db.select().from(materials).where(eq(materials.id, v.materialId!));
    if (!m) fail("not_found", "Không tìm thấy vật tư");
    if (m!.banned) fail("banned_material", "Vật tư cấm dùng");
  }
  if (v.kind === "water") {
    if (!v.water || !Object.keys(v.water).length) fail("invalid_input", "Cần ít nhất 1 chỉ số");
    for (const [k, val] of Object.entries(v.water!)) {
      const [lo, hi] = PHYSICAL[k];
      if (typeof val !== "number" || val < lo || val > hi) fail("value_out_of_bounds", `${k} ngoài giới hạn đo`);
      data[k] = val;
    }
  }
  if (v.kind === "loss") data.lossPct = v.lossPct ?? null;
  if (v.note) data.note = v.note;
  const clientNow = v.clientNow ?? serverNow;
  const suspect = Math.abs(clientNow.getTime() - serverNow.getTime()) > SUSPECT_CLOCK_MS;

  const alertTitles: string[] = [];
  await db.transaction(async (txRaw) => {
    const tx = txRaw as unknown as DB;
    await tx.insert(logs).values({
      id: v.id, lotId: lot!.id, tankId: tank.id, userId: actor.id, kind: v.kind, recordedAt: v.recordedAt, syncedAt: serverNow,
      suspectTime: suspect, materialId: v.materialId ?? null, qty: v.qty ?? null, data, taskId: v.taskId ?? null,
    });
    if (v.taskId) await tx.update(tasks).set({ status: "done", doneAt: v.recordedAt }).where(and(eq(tasks.id, v.taskId), eq(tasks.tankId, tank.id)));

    if (v.kind === "feed") {
      const res = await consumeForLog(tx, { logId: v.id, farmId: tank.farmId, lotId: lot!.id, materialId: v.materialId!, qty: v.qty!, userId: actor.id });
      if (res.negative) alertTitles.push("negative_stock");
    }
    if (v.kind === "water") {
      const thr = await tx.select().from(waterThresholds).where(and(eq(waterThresholds.stageId, lot!.stageId), inArray(waterThresholds.param, Object.keys(data))));
      const [st] = await tx.select().from(stages).where(eq(stages.id, lot!.stageId));
      const bad = thr.filter((t) => { const x = data[t.param] as number; return x < t.min || x > t.max; });
      if (bad.length) {
        const label = bad.map((b) => `${b.param.toUpperCase()} ${String(data[b.param]).replace(".", ",")}`).join(" · ");
        await raiseAlert(tx, {
          type: "water_out_of_range", severity: "bad", farmId: tank.farmId, lotId: lot!.id, tankId: tank.id,
          title: `${label} · bể ${tank.code}`, detail: `Ngưỡng ${st.name}: ${bad.map((b) => `${b.param} ${b.min}–${b.max}`).join(", ")}`,
          dedupeKey: `water:${lot!.id}:${bad.map((b) => b.param).sort().join(",")}`,
        });
        alertTitles.push("water_out_of_range");
      }
    }
    if (v.kind === "loss" && v.lossPct != null) {
      const [st] = await tx.select().from(stages).where(eq(stages.id, lot!.stageId));
      const est = Math.max(0, Math.round(lot!.estimatedQty * (1 - v.lossPct / 100)));
      await tx.update(lots).set({ estimatedQty: est }).where(eq(lots.id, lot!.id));
      if (v.lossPct > st.lossLimitPct) {
        await raiseAlert(tx, {
          type: "loss_high", farmId: tank.farmId, lotId: lot!.id, tankId: tank.id,
          title: `Hao hụt ${String(v.lossPct).replace(".", ",")}%/ngày · ${tank.code}`, detail: `Ngưỡng ${st.lossLimitPct}%/ngày ở ${st.name}`,
          dedupeKey: `loss:${lot!.id}`,
        });
        alertTitles.push("loss_high");
      }
    }
  });
  if (v.kind === "stage") await advanceStage(db, lot!.id);
  return { id: v.id, status: "created", alerts: alertTitles };
}
