"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db/client";
import { type ActionState, num, run, str } from "@/lib/action";
import { requireActor } from "@/lib/session";
import { assertFarm, assertRole } from "@/server/access";
import { fail } from "@/server/errors";
import { addManualTask } from "@/server/planning";
import { advanceStage, getLot, harvestLot, requestLotTest } from "@/server/production";

const lotIdOf = (f: FormData) => {
  const id = num(f, "lotId");
  if (!id || !Number.isInteger(id) || id <= 0) fail("invalid_input", "Thiếu lô");
  return id!;
};

const refresh = (lotId: number) => {
  revalidatePath(`/san-xuat/lo/${lotId}`);
  revalidatePath("/san-xuat/lo");
  revalidatePath("/san-xuat/trai", "layout");
};

export async function addTaskAction(_: ActionState, f: FormData): Promise<ActionState> {
  return run(async () => {
    const actor = await requireActor(["farm_lead"]);
    const lot = await getLot(db, lotIdOf(f));
    const day = str(f, "day") || undefined;
    await addManualTask(db, actor, { tankId: lot.tankId, slot: str(f, "slot"), title: str(f, "title"), day });
    revalidatePath(`/san-xuat/lo/${lot.id}`);
    return `Đã thêm việc lúc ${str(f, "slot")}`;
  });
}

export async function requestTestAction(_: ActionState, f: FormData): Promise<ActionState> {
  return run(async () => {
    const actor = await requireActor(["farm_lead", "lab"]);
    const lotId = lotIdOf(f);
    const t = await requestLotTest(db, actor, lotId, "pcr");
    refresh(lotId);
    revalidatePath("/xet-nghiem");
    return `Đã gửi yêu cầu ${t.code}`;
  });
}

export async function advanceStageAction(_: ActionState, f: FormData): Promise<ActionState> {
  return run(async () => {
    const actor = await requireActor(["farm_lead"]);
    assertRole(actor, ["farm_lead"]);
    const lot = await getLot(db, lotIdOf(f));
    assertFarm(actor, lot.farmId);
    if (lot.status !== "rearing") fail("lot_not_rearing");
    const row = await advanceStage(db, lot.id);
    refresh(lot.id);
    return row.stageId === lot.stageId ? "Lô đã ở giai đoạn cuối" : "Đã chuyển giai đoạn";
  });
}

export async function harvestAction(_: ActionState, f: FormData): Promise<ActionState> {
  let qr = "";
  const state = await run(async () => {
    const actor = await requireActor(["farm_lead"]);
    const lotId = lotIdOf(f);
    const fl = await harvestLot(db, actor, { lotId, countedQty: num(f, "countedQty") ?? 0 });
    refresh(lotId);
    qr = fl.qrToken;
    return `Đã thu hoạch ${fl.code}`;
  });
  // Action → expectation: sang S14 của lô thành phẩm mới
  if (state.ok && qr) redirect(`/truy-xuat/${qr}`);
  return state;
}
