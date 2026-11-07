"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { run, type ActionState } from "@/lib/action";
import { requireActor } from "@/lib/session";
import { ackAlert } from "@/server/alerts";
import { assertRole } from "@/server/access";

export async function ack(_: ActionState, f: FormData): Promise<ActionState> {
  return run(async () => {
    const actor = await requireActor();
    assertRole(actor, ["farm_lead", "director"]);
    await ackAlert(db, actor, Number(f.get("id")));
    revalidatePath("/hien-truong/canh-bao");
    return "Đã xác nhận";
  });
}
