import "server-only";
import { ZodError } from "zod";
import { AppError, type ErrorCode } from "@/server/errors";

export type ActionState = { ok?: boolean; message?: string; error?: string; at?: number; data?: unknown };

const MESSAGES: Partial<Record<ErrorCode, string>> = {
  unauthenticated: "Phiên đăng nhập đã hết, hãy đăng nhập lại",
  forbidden: "Bạn không có quyền thực hiện việc này",
  not_found: "Không tìm thấy dữ liệu",
  broodstock_not_ready: "Đàn chưa sẵn sàng: cần kết quả xét nghiệm âm tính",
  exceeds_batch_remaining: "Số thả vượt số Nauplius còn lại của mẻ",
  tank_busy: "Bể đang có lô ương",
  pcr_missing: "Chưa có phiếu PCR đã chốt cho lô",
  pcr_expired: "Phiếu PCR đã hết hiệu lực, cần xét nghiệm lại",
  pcr_positive: "PCR gần nhất dương tính, không được thu hoạch",
  stage_too_early: "Lô chưa đạt giai đoạn thu hoạch",
  lot_not_rearing: "Lô không ở trạng thái đang ương",
  banned_material: "Vật tư thuộc danh mục cấm dùng",
  insufficient_stock: "Kho tổng không đủ tồn",
  duplicate_code: "Mã đã tồn tại",
  test_already_final: "Phiếu đã chốt, không sửa được",
  plan_not_editable: "Kế hoạch đang chờ duyệt, không sửa được",
  request_closed: "Yêu cầu đã đóng",
  count_not_pending: "Biên bản không ở trạng thái phù hợp",
  value_out_of_bounds: "Giá trị nằm ngoài giới hạn đo",
};

export function errorMessage(e: unknown): string {
  if (e instanceof ZodError) return e.issues[0]?.message && e.issues[0].message !== "Required" ? e.issues[0].message : `Thiếu hoặc sai trường: ${e.issues[0]?.path.join(".")}`;
  if (e instanceof AppError) return e.message !== e.code ? e.message : MESSAGES[e.code] ?? e.code;
  console.error(e);
  return "Có lỗi xảy ra, dữ liệu chưa được lưu. Hãy thử lại.";
}

/** Bọc server action: không ném lỗi ra client, luôn trả trạng thái để form hiển thị */
export async function run(fn: () => Promise<string | void | { message: string; data?: unknown }>): Promise<ActionState> {
  try {
    const r = await fn();
    if (r && typeof r === "object") return { ok: true, message: r.message, data: r.data, at: Date.now() };
    return { ok: true, message: r ?? "Đã lưu", at: Date.now() };
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e && String((e as { digest: unknown }).digest).startsWith("NEXT_REDIRECT")) throw e;
    return { ok: false, error: errorMessage(e), at: Date.now() };
  }
}

export const num = (f: FormData, k: string) => { const v = f.get(k); return v == null || v === "" ? undefined : Number(String(v).replace(",", ".")); };
export const str = (f: FormData, k: string) => { const v = f.get(k); return v == null ? "" : String(v).trim(); };
