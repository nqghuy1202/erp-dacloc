"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { type ActionState, num, run, str } from "@/lib/action";
import { requireActor } from "@/lib/session";
import { fail } from "@/server/errors";
import { resolveIncident } from "@/server/production";

const ACTIONS = ["monitor", "treat", "cull"] as const;

export async function resolveAction(_: ActionState, f: FormData): Promise<ActionState> {
  return run(async () => {
    const actor = await requireActor(["farm_lead"]);
    const id = num(f, "incidentId");
    if (!id || !Number.isInteger(id) || id <= 0) fail("invalid_input", "Thiếu sự cố");
    const action = str(f, "action") as (typeof ACTIONS)[number];
    if (!ACTIONS.includes(action)) fail("invalid_input", "Chọn hành động");
    const note = str(f, "note");
    if (action === "cull" && !note) fail("invalid_input", "Huỷ lô cần lý do");
    const row = await resolveIncident(db, actor, id!, { action, note });
    revalidatePath("/san-xuat/su-co");
    revalidatePath(`/san-xuat/lo/${row.lotId}`);
    revalidatePath("/san-xuat/trai", "layout");
    revalidatePath("/");
    return action === "cull" ? "Đã huỷ lô và đóng sự cố" : "Đã xử lý sự cố";
  });
}
