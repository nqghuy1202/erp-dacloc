"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { type ActionState, num, run } from "@/lib/action";
import { requireActor } from "@/lib/session";
import { fail } from "@/server/errors";
import { markTankClean } from "@/server/production";

export async function markCleanAction(_: ActionState, f: FormData): Promise<ActionState> {
  return run(async () => {
    const actor = await requireActor(["farm_lead"]);
    const tankId = num(f, "tankId");
    if (!tankId || !Number.isInteger(tankId) || tankId <= 0) fail("invalid_input", "Thiếu bể");
    await markTankClean(db, actor, tankId!);
    revalidatePath("/san-xuat/trai", "layout");
    return "Đã vệ sinh bể";
  });
}
