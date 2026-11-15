import type { DataRow } from "./data-table";

/** Chuẩn hoá để tìm không dấu: "Lô ương" khớp "lo uong". */
export function fold(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().trim();
}

/** Lọc dòng theo từ khoá — mọi từ phải xuất hiện trong chữ tìm của dòng. */
export function matchRows(rows: DataRow[], q: string) {
  const words = fold(q).split(/\s+/).filter(Boolean);
  if (!words.length) return rows;
  return rows.filter((r) => { const hay = fold(r.search ?? ""); return words.every((w) => hay.includes(w)); });
}

