"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { type ActionState, num, run, str } from "@/lib/action";
import { requireActor } from "@/lib/session";
import { eq } from "drizzle-orm";
import { broodstocks, spawnBatches } from "@/lib/db/schema";
import { assertFarm } from "@/server/access";
import { fail } from "@/server/errors";
import { cancelSpawnBatch, createSpawnBatch, openLot } from "@/server/production";

const idOf = (f: FormData, k: string, msg: string) => {
  const v = num(f, k);
  if (!v || !Number.isInteger(v) || v <= 0) fail("invalid_input", msg);
  return v!;
};

export async function createSpawnAction(_: ActionState, f: FormData): Promise<ActionState> {
  return run(async () => {
    const actor = await requireActor(["farm_lead"]);
    const b = await createSpawnBatch(db, actor, {
      broodstockId: idOf(f, "broodstockId", "Chọn đàn"), femalesSpawned: num(f, "femalesSpawned") ?? 0, nauplius: num(f, "nauplius") ?? 0,
    });
    revalidatePath("/san-xuat/me-de");
    return `Đã tạo mẻ ${b.code}`;
  });
}

export async function openLotAction(_: ActionState, f: FormData): Promise<ActionState> {
  return run(async () => {
    const actor = await requireActor(["farm_lead"]);
    const workerIds = f.getAll("workerIds").map((v) => Number(v)).filter((v) => Number.isInteger(v) && v > 0);
    const lot = await openLot(db, actor, {
      batchId: idOf(f, "batchId", "Thiếu mẻ"), tankId: idOf(f, "tankId", "Chọn bể"), qty: num(f, "qty") ?? 0, workerIds,
      expectedHarvestAt: str(f, "expectedHarvestAt") || undefined,
    });
    revalidatePath("/san-xuat/me-de");
    revalidatePath("/san-xuat/lo");
    revalidatePath("/san-xuat/trai", "layout");
    return { message: `Đã mở lô ${lot.code}`, data: { farmId: lot.farmId, tankId: lot.tankId } };
  });
}

export async function cancelBatchAction(_: ActionState, f: FormData): Promise<ActionState> {
  return run(async () => {
    const actor = await requireActor(["farm_lead"]);
    const reason = str(f, "reason");
    if (!reason) fail("invalid_input", "Cần lý do huỷ");
    const batchId = idOf(f, "batchId", "Thiếu mẻ");
    // R1: cancelSpawnBatch chưa kiểm phạm vi trại → kiểm ở đây
    const [row] = await db.select({ farmId: broodstocks.farmId }).from(spawnBatches)
      .innerJoin(broodstocks, eq(broodstocks.id, spawnBatches.broodstockId)).where(eq(spawnBatches.id, batchId));
    if (!row) fail("not_found", "Không tìm thấy mẻ");
    assertFarm(actor, row!.farmId);
    await cancelSpawnBatch(db, actor, batchId, reason);
    revalidatePath("/san-xuat/me-de");
    return "Đã huỷ mẻ";
  });
}
