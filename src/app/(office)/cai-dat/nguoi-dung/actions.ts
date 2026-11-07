"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { type ActionState, num, run, str } from "@/lib/action";
import { requireActor } from "@/lib/session";
import { fail } from "@/server/errors";
import { createUser, setUserActive, setUserFarms, userInput } from "@/server/catalog";

const farmIdsOf = (f: FormData) => {
  const ids = f.getAll("farmIds").map((v) => Number(v));
  if (ids.some((n) => !Number.isInteger(n) || n <= 0)) fail("invalid_input", "Trại không hợp lệ");
  return [...new Set(ids)];
};
const userIdOf = (f: FormData) => { const id = num(f, "userId"); if (!id || !Number.isInteger(id) || id <= 0) fail("invalid_input", "Thiếu mã người dùng"); return id!; };
const done = () => revalidatePath("/cai-dat/nguoi-dung");

export async function createUserAction(_: ActionState, f: FormData): Promise<ActionState> {
  return run(async () => {
    const actor = await requireActor(["admin"]);
    const role = userInput.shape.role.safeParse(str(f, "role"));
    if (!role.success) fail("invalid_input", "Chọn vai trò");
    const u = await createUser(db, actor, {
      empCode: str(f, "empCode"), name: str(f, "name"), role: role.data!, password: String(f.get("password") ?? ""), farmIds: farmIdsOf(f),
    });
    done();
    return `Đã thêm ${u.empCode} · ${u.name}`;
  });
}

export async function setFarmsAction(_: ActionState, f: FormData): Promise<ActionState> {
  return run(async () => {
    const actor = await requireActor(["admin"]);
    await setUserFarms(db, actor, userIdOf(f), farmIdsOf(f));
    done();
    return "Đã cập nhật trại";
  });
}

export async function setActiveAction(_: ActionState, f: FormData): Promise<ActionState> {
  return run(async () => {
    const actor = await requireActor(["admin"]);
    const active = str(f, "active") === "1";
    await setUserActive(db, actor, userIdOf(f), active);
    done();
    return active ? "Đã mở khoá tài khoản" : "Đã khoá tài khoản";
  });
}
