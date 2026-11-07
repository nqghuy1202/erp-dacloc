"use client";
import { useCallback, useEffect, useState } from "react";
import { ClipboardList } from "lucide-react";
import { ActionForm, Sheet, Submit, type ActionState } from "@/components/ui/client";
import { Field, Input, Select } from "@/components/ui";
import { cn } from "@/components/ui/cn";
import { fmtNum, type Locale } from "@/lib/i18n";
import { TOLERANCE, diffRatio } from "./diff";

type Act = (prev: ActionState, f: FormData) => Promise<ActionState>;

export function StartCountSheet({ action, warehouses }: { action: Act; warehouses: { id: number; name: string }[] }) {
  return (
    <Sheet title="Bắt đầu kiểm kê" trigger={<><ClipboardList size={16} />Bắt đầu kiểm kê</>}>
      {() => (
        <ActionForm action={action} className="flex flex-col gap-4">
          <Field label="Kho">
            <Select name="warehouseId" required defaultValue={warehouses.length === 1 ? String(warehouses[0].id) : ""}>
              <option value="">Chọn kho</option>
              {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </Select>
          </Field>
          <Submit>Bắt đầu kiểm kê</Submit>
        </ActionForm>
      )}
    </Sheet>
  );
}


type CountLine = { materialId: number; name: string; code: string; unit: string; bookQty: number };

/** Nhập số đếm; nháp lưu cục bộ để không mất khi mất mạng giữa chừng */
export function CountForm({ action, countId, lines, locale }: { action: Act; countId: number; lines: CountLine[]; locale: Locale }) {
  const key = `count-draft:${countId}`;
  const [vals, setVals] = useState<Record<number, string>>({});
  useEffect(() => {
    try { const s = localStorage.getItem(key); if (s) setVals(JSON.parse(s) as Record<number, string>); } catch { /* bỏ qua */ }
  }, [key]);
  const update = (id: number, v: string) => setVals((x) => {
    const next = { ...x, [id]: v };
    try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* bỏ qua */ }
    return next;
  });
  const parsed = (id: number) => { const s = vals[id]; if (s == null || s.trim() === "") return null; const v = Number(s.replace(",", ".")); return Number.isFinite(v) ? v : null; };
  const clearDraft = useCallback(() => { try { localStorage.removeItem(key); } catch { /* bỏ qua */ } }, [key]);
  const filled = lines.filter((l) => parsed(l.materialId) != null).length;
  const over = lines.filter((l) => { const a = parsed(l.materialId); return a != null && Math.abs(diffRatio(l.bookQty, a)) > TOLERANCE; }).length;

  return (
    <ActionForm action={action} resetOnSuccess={false} onDone={clearDraft}>
      <input type="hidden" name="id" value={countId} />
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="[&_th]:h-10 [&_th]:border-b [&_th]:border-line [&_th]:px-3 [&_th]:text-left [&_th]:font-medium [&_th]:text-fg-2">
              <th>Vật tư</th><th className="text-right">Sổ</th><th>Thực</th><th className="text-right">Chênh lệch</th>
            </tr>
          </thead>
          <tbody className="num [&_td]:h-12 [&_td]:border-b [&_td]:border-line [&_td]:px-3">
            {lines.map((l) => {
              const a = parsed(l.materialId);
              const r = a == null ? null : diffRatio(l.bookQty, a);
              const warn = r != null && Math.abs(r) > TOLERANCE;
              return (
                <tr key={l.materialId} className={cn(warn && "bg-warn-soft")}>
                  <td><div className="font-medium">{l.name}</div><div className="text-xs text-fg-2">{l.code}</div></td>
                  <td className="whitespace-nowrap text-right">{fmtNum(locale, l.bookQty, 1)} {l.unit}</td>
                  <td className="w-40">
                    <Input name={`actual.${l.materialId}`} aria-label={`Số thực ${l.name}`} inputMode="decimal" placeholder={fmtNum(locale, l.bookQty, 1)}
                      value={vals[l.materialId] ?? ""} onChange={(e) => update(l.materialId, e.target.value)} className="text-right" />
                  </td>
                  <td className={cn("whitespace-nowrap text-right", warn && "font-semibold text-warn-ink")}>
                    {a == null || r == null ? "—" : <>{a - l.bookQty > 0 ? "+" : ""}{fmtNum(locale, a - l.bookQty, 1)} {l.unit} · {fmtNum(locale, r * 100, 1)}%</>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="sticky bottom-0 mt-4 flex flex-wrap items-center gap-4 border-t border-line bg-surface pt-3">
        <span className="num text-[13px] text-fg-2">Đã đếm {filled}/{lines.length} · {over} dòng lệch &gt; 2% · ô trống = bằng số sổ</span>
        <Submit className="ml-auto">Gửi duyệt</Submit>
      </div>
    </ActionForm>
  );
}
