"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { type ActionState, num, run, str } from "@/lib/action";
import { requireActor } from "@/lib/session";
import { fail } from "@/server/errors";
import { createFarm, importMaterials, importTanks, parseCsv, setMaterialBanned } from "@/server/catalog";

const MAX_BYTES = 2 * 1024 * 1024;
const MAX_ROWS = 5000;
const done = () => revalidatePath("/cai-dat/danh-muc");

/** Đọc CSV từ file tải lên hoặc ô dán; dòng đầu là tiêu đề, phải có đủ cột bắt buộc */
async function readCsv(f: FormData, required: string[]) {
  const file = f.get("file");
  let text = "";
  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_BYTES) fail("invalid_input", "File quá lớn (tối đa 2 MB)");
    text = await file.text();
  } else text = str(f, "text");
  if (!text.trim()) fail("invalid_input", "Chọn file CSV hoặc dán nội dung");
  const [head, ...rows] = parseCsv(text);
  const cols = (head ?? []).map((h) => h.trim());
  const lower = cols.map((c) => c.toLowerCase());
  if (!required.every((r) => lower.includes(r.toLowerCase()))) fail("invalid_input", `File không đúng mẫu: cần cột ${required.join(", ")}`);
  if (rows.length > MAX_ROWS) fail("invalid_input", `Tối đa ${MAX_ROWS} dòng mỗi lần`);
  return rows.map((cells) => Object.fromEntries(cols.map((c, i) => {
    const canon = required.find((r) => r.toLowerCase() === c.toLowerCase()) ?? c;
    return [canon, cells[i] ?? ""];
  })));
}

const summary = (r: { saved: number; errors: unknown[] }) => ({ message: `${r.saved} dòng đã lưu · ${r.errors.length} dòng lỗi`, data: r });

export async function importTanksAction(_: ActionState, f: FormData): Promise<ActionState> {
  return run(async () => {
    const actor = await requireActor(["admin"]);
    const rows = await readCsv(f, ["farmCode", "code", "volumeM3"]);
    const r = await importTanks(db, actor, rows as { farmCode: string; code: string; volumeM3: string }[]);
    done();
    return summary(r);
  });
}

export async function importMaterialsAction(_: ActionState, f: FormData): Promise<ActionState> {
  return run(async () => {
    const actor = await requireActor(["admin"]);
    const rows = await readCsv(f, ["code", "name", "unit"]);
    // cột tuỳ chọn để trống → dùng mặc định của danh mục
    const clean = rows.map((r) => Object.fromEntries(Object.entries(r).filter(([, v]) => v !== "")));
    const r = await importMaterials(db, actor, clean);
    done();
    return summary(r);
  });
}

export async function createFarmAction(_: ActionState, f: FormData): Promise<ActionState> {
  return run(async () => {
    const actor = await requireActor(["admin"]);
    const kind = str(f, "kind") === "broodstock" ? "broodstock" : "hatchery";
    const farm = await createFarm(db, actor, { code: str(f, "code"), name: str(f, "name"), kind });
    done();
    return `Đã thêm trại ${farm.code}`;
  });
}

export async function setBannedAction(_: ActionState, f: FormData): Promise<ActionState> {
  return run(async () => {
    const actor = await requireActor(["admin"]);
    const id = num(f, "materialId");
    if (!id || !Number.isInteger(id) || id <= 0) fail("invalid_input", "Thiếu mã vật tư");
    const banned = str(f, "banned") === "1";
    await setMaterialBanned(db, actor, id!, banned);
    done();
    revalidatePath("/kho");
    return banned ? "Đã gắn cờ cấm dùng" : "Đã bỏ cờ cấm dùng";
  });
}
