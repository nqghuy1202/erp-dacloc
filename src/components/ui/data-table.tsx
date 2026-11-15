"use client";
import { useMemo, useState, type ReactNode } from "react";
import { Search } from "lucide-react";
import { Table, useTableSortable, useTableSortableState, proportional, pixel } from "@astryxdesign/core/Table";
import type { TableColumn } from "@astryxdesign/core/Table";
import { TextInput } from "@astryxdesign/core/TextInput";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { matchRows } from "./search";

/** Cột bảng: server truyền xuống (chỉ dữ liệu thuần, không hàm) — design-spec 12 §2 "Bảng nghiệp vụ". */
export type DataColumn = { key: string; header: string; align?: "start" | "end" | "center"; sortable?: boolean; width?: number };
/** Một dòng: `cells` là nội dung đã render ở server, `sort` là giá trị để sắp xếp, `search` là chữ để tìm. */
export type DataRow = { id: string; cells: Record<string, ReactNode>; sort?: Record<string, string | number | null>; search?: string };

type Item = Record<string, unknown> & { __id: string; __cells: Record<string, ReactNode> };

/**
 * Bảng tìm + sắp xếp phía trình duyệt trên trang dữ liệu đã tải (Astryx Table).
 * nợ: chỉ tìm/sắp trong trang hiện tại (≤ 50 dòng do server phân trang); trần: không tìm xuyên trang, nâng cấp khi user cần tìm toàn bộ → chuyển `q`/`sort` lên searchParams + query server.
 */
export function DataTable({ columns, rows, searchLabel, emptyTitle, noMatchTitle, defaultSort }: {
  columns: DataColumn[]; rows: DataRow[]; searchLabel: string; emptyTitle: string; noMatchTitle: string;
  defaultSort?: { key: string; direction: "ascending" | "descending" };
}) {
  const [q, setQ] = useState("");
  const data = useMemo<Item[]>(() => matchRows(rows, q).map((r) => ({ ...(r.sort ?? {}), __id: r.id, __cells: r.cells })), [rows, q]);
  const { sortedData, sortConfig } = useTableSortableState<Item>({
    data,
    defaultSort: defaultSort ? [{ sortKey: defaultSort.key, direction: defaultSort.direction }] : undefined,
  });
  const sortable = useTableSortable<Item>(sortConfig);
  const cols: TableColumn<Item>[] = columns.map((c) => ({
    key: c.key, header: c.header, align: c.align, sortable: c.sortable ?? false,
    width: c.width ? pixel(c.width) : proportional(1),
    renderCell: (it) => it.__cells[c.key],
  }));

  if (!rows.length) return <div className="py-8"><EmptyState title={emptyTitle} isCompact /></div>;
  return (
    <div>
      <div className="border-b border-line p-4">
        <TextInput label={searchLabel} isLabelHidden placeholder={searchLabel} value={q} onChange={setQ} hasClear startIcon={Search} type="search" width="min(100%, 360px)" />
      </div>
      {sortedData.length ? (
        <div className="overflow-x-auto">
          <Table data={sortedData} columns={cols} idKey="__id" plugins={{ sortable }} hasHover density="balanced" />
        </div>
      ) : (
        <div className="py-8"><EmptyState title={noMatchTitle} isCompact /></div>
      )}
    </div>
  );
}
