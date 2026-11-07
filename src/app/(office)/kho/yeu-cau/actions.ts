"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { type ActionState, num, run, str } from "@/lib/action";
import { requireActor } from "@/lib/session";
import { fail } from "@/server/errors";
import { cancelRequest, createRequest, issueRequest, rejectRequest } from "@/server/inventory";

const done = () => { revalidatePath("/kho/yeu-cau"); revalidatePath("/kho"); };
const idOf = (f: FormData) => { const id = num(f, "id"); if (!id || !Number.isInteger(id) || id <= 0) fail("invalid_input", "Thiếu mã yêu cầu"); return id!; };

export async function sendRequest(_: ActionState, f: FormData): Promise<ActionState> {
  return run(async () => {
    const actor = await requireActor(["farm_lead"]);
    let lines: unknown;
    try { lines = JSON.parse(str(f, "lines") || "[]"); } catch { lines = null; }
    if (!Array.isArray(lines)) fail("invalid_input", "Dữ liệu dòng vật tư không hợp lệ");
    const r = await createRequest(db, actor, { farmId: num(f, "farmId") ?? 0, note: str(f, "note"), lines: lines as never });
    done();
    return `Đã gửi yêu cầu ${r.code}`;
  });
}

export async function cancelReq(_: ActionState, f: FormData): Promise<ActionState> {
  return run(async () => {
    const actor = await requireActor(["farm_lead"]);
    await cancelRequest(db, actor, idOf(f));
    done();
    return "Đã huỷ yêu cầu";
  });
}

export async function issueReq(_: ActionState, f: FormData): Promise<ActionState> {
  return run(async () => {
    const actor = await requireActor(["storekeeper"]);
    const issue: Record<number, number> = {};
    for (const [k, v] of f.entries()) {
      if (!k.startsWith("issue.")) continue;
      const materialId = Number(k.slice(6));
      const q = Number(String(v).replace(",", ".") || "0");
      if (!Number.isInteger(materialId) || materialId <= 0 || !Number.isFinite(q) || q < 0) fail("invalid_input", "Số cấp không hợp lệ");
      issue[materialId] = q;
    }
    if (!Object.values(issue).some((q) => q > 0)) fail("invalid_input", "Nhập số cấp cho ít nhất 1 vật tư");
    const r = await issueRequest(db, actor, idOf(f), issue);
    done();
    return r.status === "fulfilled" ? `Đã cấp đủ ${r.code}` : `Đã cấp một phần ${r.code}`;
  });
}

export async function rejectReq(_: ActionState, f: FormData): Promise<ActionState> {
  return run(async () => {
    const actor = await requireActor(["storekeeper"]);
    const r = await rejectRequest(db, actor, idOf(f), str(f, "reason"));
    done();
    return `Đã từ chối ${r.code}`;
  });
}
