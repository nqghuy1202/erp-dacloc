"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { type ActionState, run, str } from "@/lib/action";
import { requireActor } from "@/lib/session";
import { fail } from "@/server/errors";
import { createReceipt } from "@/server/inventory";

export async function saveReceipt(_: ActionState, f: FormData): Promise<ActionState> {
  return run(async () => {
    const actor = await requireActor(["storekeeper"]);
    let lines: unknown;
    try { lines = JSON.parse(str(f, "lines") || "[]"); } catch { lines = null; }
    if (!Array.isArray(lines)) fail("invalid_input", "Dữ liệu dòng vật tư không hợp lệ");
    const r = await createReceipt(db, actor, { supplier: str(f, "supplier"), docNo: str(f, "docNo"), lines: lines as never });
    revalidatePath("/kho");
    revalidatePath("/kho/nhap");
    const materialIds = (lines as { materialId?: unknown }[]).map((l) => Number(l.materialId)).filter((n) => n > 0);
    return { message: `Đã chốt phiếu ${r.code}`, data: { materialIds } };
  });
}
