import { Badge, type Tone } from "./ui";

const MAP: Record<string, [string, string, Tone]> = {
  rearing: ["Đang ương", "Rearing", "acc"], harvested: ["Đã thu", "Harvested", "ok"], cancelled: ["Đã huỷ", "Cancelled", "neu"],
  quarantine: ["Cách ly", "Quarantine", "warn"], ready: ["Sẵn sàng", "Ready", "ok"], culled: ["Loại bỏ", "Culled", "bad"],
  open: ["Mở", "Open", "warn"], used: ["Đã dùng hết", "Used", "neu"], ack: ["Đã xác nhận", "Acknowledged", "acc"], closed: ["Đã đóng", "Closed", "neu"],
  pending: ["Chờ xử lý", "Pending", "warn"], partial: ["Cấp một phần", "Partial", "warn"], fulfilled: ["Đã cấp", "Fulfilled", "ok"],
  rejected: ["Từ chối", "Rejected", "bad"], final: ["Đã chốt", "Final", "ok"], void: ["Đã huỷ", "Void", "neu"],
  counting: ["Đang đếm", "Counting", "acc"], pending_approval: ["Chờ duyệt", "Awaiting", "warn"], approved: ["Đã duyệt", "Approved", "ok"],
  draft: ["Nháp", "Draft", "neu"], returned: ["Trả lại", "Returned", "bad"], superseded: ["Bản cũ", "Superseded", "neu"],
  empty: ["Trống", "Empty", "neu"], cleaning: ["Chờ vệ sinh", "Cleaning", "neu"], resolved: ["Đã xử lý", "Resolved", "ok"],
  done: ["Xong", "Done", "ok"],
};

export function StatusBadge({ status, locale = "vi" }: { status: string; locale?: "vi" | "en" }) {
  const m = MAP[status];
  if (!m) return <Badge>{status}</Badge>;
  return <Badge tone={m[2]}>{locale === "en" ? m[1] : m[0]}</Badge>;
}

// Tách ra roles.ts để màn hiện trường dùng nhãn vai trò mà không kéo Badge Astryx.
export { ROLE_LABEL } from "./roles";
