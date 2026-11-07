"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db/client";
import { type ActionState, num, run } from "@/lib/action";
import { requireActor } from "@/lib/session";
import { fail } from "@/server/errors";
import { approveCount, startCount, submitCount } from "@/server/inventory";

const idOf = (f: FormData, k = "id") => { const id = num(f, k); if (!id || !Number.isInteger(id) || id <= 0) fail("invalid_input", "Thiếu mã"); return id!; };

export async function startCountAction(_: ActionState, f: FormData): Promise<ActionState> {
  let id = 0;
  const res = await run(async () => {
    const actor = await requireActor(["storekeeper"]);
    const c = await startCount(db, actor, idOf(f, "warehouseId"));
    id = c.id;
    revalidatePath("/kho/kiem-ke");
    return `Đã mở biên bản ${c.code}`;
  });
  if (res.ok && id) redirect(`/kho/kiem-ke/${id}`);
  return res;
}

export async function submitCountAction(_: ActionState, f: FormData): Promise<ActionState> {
  return run(async () => {
    const actor = await requireActor(["storekeeper"]);
    const actuals: Record<number, number> = {};
    for (const [k, v] of f.entries()) {
      if (!k.startsWith("actual.") || String(v).trim() === "") continue;
      const materialId = Number(k.slice(7));
      const q = Number(String(v).replace(",", "."));
      if (!Number.isInteger(materialId) || materialId <= 0 || !Number.isFinite(q) || q < 0) fail("invalid_input", "Số đếm không hợp lệ");
      actuals[materialId] = q;
    }
    const id = idOf(f);
    const c = await submitCount(db, actor, id, actuals);
    revalidatePath("/kho/kiem-ke");
    revalidatePath(`/kho/kiem-ke/${id}`);
    revalidatePath("/kho");
    return c.status === "approved" ? "Đã điều chỉnh tồn theo số thực" : "Đã gửi duyệt · lệch > 2%";
  });
}

export async function approveCountAction(_: ActionState, f: FormData): Promise<ActionState> {
  return run(async () => {
    const actor = await requireActor(["farm_lead", "director"]);
    const id = idOf(f);
    await approveCount(db, actor, id);
    revalidatePath("/kho/kiem-ke");
    revalidatePath(`/kho/kiem-ke/${id}`);
    revalidatePath("/kho");
    return "Đã duyệt biên bản, tồn đã điều chỉnh";
  });
}
