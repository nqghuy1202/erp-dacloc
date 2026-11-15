import type { ReactNode } from "react";

/** Nhãn chữ của children (Astryx Button bắt buộc `label` cho trợ năng). */
export function textOf(n: ReactNode): string {
  if (n == null || typeof n === "boolean") return "";
  if (typeof n === "string" || typeof n === "number") return String(n);
  if (Array.isArray(n)) return n.map(textOf).join("").trim();
  if (typeof n === "object" && "props" in n) return textOf((n.props as { children?: ReactNode }).children);
  return "";
}

