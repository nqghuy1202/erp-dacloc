"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { run, num, type ActionState } from "@/lib/action";
import { getActor } from "@/lib/session";
import { ackAlert } from "@/server/alerts";
import { assertRole } from "@/server/access";
import { fail } from "@/server/errors";

/** M4/NV7: xác nhận cảnh báo (dừng leo thang H4) */
export async function ackAlertAction(_: ActionState, f: FormData): Promise<ActionState> {
  return run(async () => {
    const actor = await getActor();
    if (!actor) fail("unauthenticated");
    assertRole(actor!, ["farm_lead", "director"]);
    const id = num(f, "alertId");
    if (!id || !Number.isSafeInteger(id) || id <= 0) fail("invalid_input", "Thiếu cảnh báo");
    const row = await ackAlert(db, actor!, id!);
    revalidatePath("/thong-bao");
    revalidatePath("/");
    return `Đã xác nhận: ${row.title}`;
  });
}
