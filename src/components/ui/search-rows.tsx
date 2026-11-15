"use client";
import { Children, useMemo, useState, type ReactNode } from "react";
import { Search } from "lucide-react";
import { TextInput } from "@astryxdesign/core/TextInput";
import { fold, searchText } from "./search";

/**
 * Bảng tĩnh có ô tìm: lọc các dòng <tr> đã render ở server theo chữ (không dấu) — không đổi dữ liệu hay query.
 * nợ: chỉ lọc dòng của trang đang hiển thị; trần: không tìm xuyên trang, nâng cấp khi bảng có phân trang server → đưa `q` lên searchParams.
 */
export function SearchTable({ search: label, head: cols0, children }: { search: string; head: ReactNode[]; children: ReactNode }) {
  const cols = cols0.length;
  const head = (
    <thead>
      <tr>{cols0.map((h, i) => <th key={i} className="h-10 whitespace-nowrap border-b border-line px-3 text-left font-semibold text-fg-2">{h}</th>)}</tr>
    </thead>
  );
  const [q, setQ] = useState("");
  const rows = useMemo(() => Children.toArray(children).map((r) => ({ r, hay: fold(searchText(r)) })), [children]);
  const words = fold(q).split(/\s+/).filter(Boolean);
  const shown = words.length ? rows.filter((x) => words.every((w) => x.hay.includes(w))) : rows;
  return (
    <>
      <div className="border-b border-line p-4">
        <TextInput label={label} isLabelHidden placeholder={label} value={q} onChange={setQ} hasClear startIcon={Search} type="search" width="min(100%, 360px)" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[13px]">
          {head}
          <tbody className="num [&_td]:h-12 [&_td]:border-b [&_td]:border-line [&_td]:px-3 [&_td]:whitespace-nowrap [&_tr:last-child_td]:border-b-0 [&_tr:hover]:bg-surface-2">
            {shown.map((x) => x.r)}
            {!shown.length ? <tr><td colSpan={cols} className="!h-16 text-center text-fg-2">Không có dòng khớp “{q}”</td></tr> : null}
          </tbody>
        </table>
      </div>
      <p aria-live="polite" className="sr-only">{words.length ? `${shown.length} dòng khớp` : ""}</p>
    </>
  );
}
