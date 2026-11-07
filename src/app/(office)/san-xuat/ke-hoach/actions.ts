"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { type ActionState, num, run, str } from "@/lib/action";
import { requireActor } from "@/lib/session";
import { fail } from "@/server/errors";
import { reviewPlan, savePlan, submitPlan } from "@/server/planning";

const done = () => { revalidatePath("/san-xuat/ke-hoach"); revalidatePath("/"); };

/** intent=save → Lưu nháp; intent=submit → lưu rồi gửi duyệt (gửi đúng bản đang thấy) */
export async function savePlanAction(_: ActionState, f: FormData): Promise<ActionState> {
  return run(async () => {
    const actor = await requireActor(["farm_lead"]);
    let lines: unknown;
    try { lines = JSON.parse(str(f, "lines") || "[]"); } catch { lines = null; }
    if (!Array.isArray(lines)) fail("invalid_input", "Dữ liệu lô dự kiến không hợp lệ");
    const plan = await savePlan(db, actor, { farmId: num(f, "farmId") ?? 0, month: str(f, "month"), lines: lines as never });
    if (str(f, "intent") === "submit") {
      await submitPlan(db, actor, plan.id);
      done();
      return `Đã gửi duyệt kế hoạch ${plan.month}`;
    }
    done();
    return "Đã lưu nháp";
  });
}

export async function reviewPlanAction(_: ActionState, f: FormData): Promise<ActionState> {
  return run(async () => {
    const actor = await requireActor(["director"]);
    const id = num(f, "planId");
    if (!id || !Number.isInteger(id) || id <= 0) fail("invalid_input", "Thiếu mã kế hoạch");
    const decision = str(f, "decision") === "return" ? "return" : "approve";
    const p = await reviewPlan(db, actor, id!, decision, str(f, "reason"));
    done();
    return decision === "return" ? `Đã trả lại kế hoạch ${p.month}` : `Đã duyệt kế hoạch ${p.month}`;
  });
}
