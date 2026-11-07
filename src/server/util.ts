import { randomBytes } from "node:crypto";

/** Mã chứng từ dễ đọc: PREFIX-YYMM-XXXX (ngẫu nhiên base32, tránh lộ thứ tự) */
export function makeCode(prefix: string, now = new Date()) {
  const yymm = `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const rnd = [...randomBytes(4)].map((b) => alphabet[b % alphabet.length]).join("");
  return `${prefix}-${yymm}-${rnd}`;
}

export const token = (bytes = 12) => randomBytes(bytes).toString("base64url");

export const ymd = (d: Date) => {
  const z = new Date(d.getTime() + 7 * 3600 * 1000); // ngày theo giờ Việt Nam
  return z.toISOString().slice(0, 10);
};

export const addDays = (isoDate: string, n: number) => {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

export const daysBetween = (a: Date, b: Date) => Math.floor((b.getTime() - a.getTime()) / 86400000);
