import type { ReactNode } from "react";
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


/** Chữ để tìm của một nút React: gom children và nhãn (`label`/`title`, vd Badge Astryx) — dùng cho bảng tĩnh có ô tìm. */
export function searchText(n: ReactNode): string {
  if (n == null || typeof n === "boolean") return "";
  if (typeof n === "string" || typeof n === "number") return String(n);
  if (Array.isArray(n)) return n.map(searchText).join(" ");
  if (typeof n === "object" && "props" in n) {
    const p = n.props as { children?: ReactNode; label?: ReactNode; title?: ReactNode };
    return [searchText(p.label), searchText(p.title), searchText(p.children)].filter(Boolean).join(" ");
  }
  return "";
}
