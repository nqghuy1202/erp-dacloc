"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { run, str, type ActionState } from "@/lib/action";
import { getActor } from "@/lib/session";
import { finalizeTest, voidTest } from "@/server/production";
import { labDetail } from "@/server/queries-lab";
import { fail } from "@/server/errors";

async function actorOrFail() {
  const a = await getActor();
  if (!a) fail("unauthenticated");
  return a!;
}

/** S9 Chốt phiếu: mỗi chỉ tiêu một radio `r:<chỉ tiêu>` = "pos" | "neg" */
export async function finalizeTestAction(testId: number, _: ActionState, f: FormData): Promise<ActionState> {
  return run(async () => {
    const actor = await actorOrFail();
    const cur = await labDetail(db, actor, testId);
    if (!cur) fail("not_found", "Không tìm thấy phiếu");
    // Chỉ tiêu lấy từ phiếu mẫu (cấu hình loài); phiếu không có mẫu (vi sinh/chất lượng) mới nhận tên từ form
    const pairs = cur!.t.results.length
      ? cur!.t.results.map((r) => ({ indicator: r.indicator, key: `r:${r.indicator}` }))
      : f.getAll("ind").map((v, i) => ({ indicator: String(v).trim(), key: `r:__${i}` }));
    if (!pairs.length || pairs.some((p) => !p.indicator)) fail("invalid_input", "Cần tên cho mỗi chỉ tiêu");
    if (pairs.length > 30 || pairs.some((p) => p.indicator.length > 60)) fail("invalid_input", "Tên chỉ tiêu tối đa 60 ký tự, tối đa 30 chỉ tiêu");
    if (new Set(pairs.map((p) => p.indicator)).size !== pairs.length) fail("invalid_input", "Tên chỉ tiêu bị trùng");
    const results = pairs.map(({ indicator, key }) => {
      const v = f.get(key);
      if (v !== "pos" && v !== "neg") fail("invalid_input", `Chưa chọn kết quả cho ${indicator}`);
      return { indicator, positive: v === "pos" };
    });
    const lab = str(f, "lab");
    if (lab.length > 80) fail("invalid_input", "Tên lab tối đa 80 ký tự");
    const done = await finalizeTest(db, actor, testId, { results, lab: lab || undefined });
    const positive = results.some((r) => r.positive);
    const row = cur!;
    const subject = row.lotCode ?? (row.broodCode ? `đàn ${row.broodCode}` : null);
    revalidatePath("/xet-nghiem");
    revalidatePath(`/xet-nghiem/${testId}`);
    return {
      message: `Đã chốt ${done.code}${subject ? ` · ${subject}` : ""} · ${positive ? "dương tính" : "âm tính"}`,
      data: { incident: positive && row.lotCode ? row.lotCode : null },
    };
  });
}

/** S9 Huỷ phiếu (R10): bắt buộc lý do; kiểm phạm vi trại trước khi huỷ */
export async function voidTestAction(testId: number, _: ActionState, f: FormData): Promise<ActionState> {
  return run(async () => {
    const actor = await actorOrFail();
    const reason = str(f, "reason");
    if (!reason) fail("invalid_input", "Cần lý do huỷ");
    if (reason.length > 500) fail("invalid_input", "Lý do tối đa 500 ký tự");
    const row = await labDetail(db, actor, testId);
    if (!row) fail("not_found", "Không tìm thấy phiếu");
    if (row!.t.status === "void") fail("test_already_final", "Phiếu đã huỷ");
    await voidTest(db, actor, testId, reason);
    revalidatePath("/xet-nghiem");
    revalidatePath(`/xet-nghiem/${testId}`);
    return `Đã huỷ phiếu ${row!.t.code}`;
  });
}
