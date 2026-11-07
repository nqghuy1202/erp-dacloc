"use client";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { ActionForm, Submit, type ActionState } from "@/components/ui/client";
import { Button, Field, Input, Select } from "@/components/ui";
import { fmtNum, type Locale } from "@/lib/i18n";

type Mat = { id: number; name: string; code: string; unit: string; banned: boolean };
type Line = { key: number; materialId: string; qty: string; unitCost: string; supplierLot: string; expiry: string };
type Act = (prev: ActionState, f: FormData) => Promise<ActionState>;

let seq = 1;
const blank = (): Line => ({ key: seq++, materialId: "", qty: "", unitCost: "", supplierLot: "", expiry: "" });
const n = (s: string) => { const v = Number(s.replace(",", ".")); return Number.isFinite(v) ? v : 0; };

export function ReceiptForm({ action, materials, locale }: { action: Act; materials: Mat[]; locale: Locale }) {
  const router = useRouter();
  const [lines, setLines] = useState<Line[]>(() => [blank()]);
  const [head, setHead] = useState({ supplier: "", docNo: "" });
  const set = (key: number, patch: Partial<Line>) => setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  const total = lines.reduce((a, l) => a + n(l.qty) * n(l.unitCost), 0);
  const unit = (id: string) => materials.find((m) => String(m.id) === id)?.unit ?? "";
  const payload = lines.filter((l) => l.materialId).map((l) => ({
    materialId: Number(l.materialId), qty: n(l.qty), unitCost: n(l.unitCost), supplierLot: l.supplierLot, expiry: l.expiry,
  }));

  const onDone = useCallback((s: ActionState) => {
    const ids = ((s as { data?: { materialIds?: number[] } }).data?.materialIds ?? []).join(",");
    setLines([blank()]);
    setHead({ supplier: "", docNo: "" });
    router.push(ids ? `/kho?hl=${ids}` : "/kho");
  }, [router]);

  return (
    <ActionForm action={action} onDone={onDone} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nhà cung cấp"><Input name="supplier" required maxLength={120} autoComplete="organization" value={head.supplier} onChange={(e) => setHead((h) => ({ ...h, supplier: e.target.value }))} /></Field>
        <Field label="Số chứng từ"><Input name="docNo" maxLength={60} value={head.docNo} onChange={(e) => setHead((h) => ({ ...h, docNo: e.target.value }))} /></Field>
      </div>
      <input type="hidden" name="lines" value={JSON.stringify(payload)} />

      <div className="max-h-[60vh] overflow-auto rounded-ctl border border-line">
        <table className="w-full border-collapse text-[13px]">
          <thead className="sticky top-0 bg-surface">
            <tr className="[&_th]:h-10 [&_th]:border-b [&_th]:border-line [&_th]:px-3 [&_th]:text-left [&_th]:font-medium [&_th]:text-fg-2">
              <th>Vật tư</th><th>Số lượng</th><th>Đơn giá (đ)</th><th>Lô NCC</th><th>Hạn dùng</th><th className="text-right">Thành tiền</th><th><span className="sr-only">Xoá</span></th>
            </tr>
          </thead>
          <tbody className="num [&_td]:border-b [&_td]:border-line [&_td]:px-2 [&_td]:py-2">
            {lines.map((l, i) => (
              <tr key={l.key}>
                <td className="min-w-48">
                  <Select aria-label={`Vật tư dòng ${i + 1}`} value={l.materialId} onChange={(e) => set(l.key, { materialId: e.target.value })} required>
                    <option value="">Chọn vật tư</option>
                    {materials.map((m) => (
                      <option key={m.id} value={m.id} disabled={m.banned}>{m.name} ({m.unit}){m.banned ? " · Cấm dùng" : ""}</option>
                    ))}
                  </Select>
                </td>
                <td className="min-w-28">
                  <div className="flex items-center gap-1">
                    <Input aria-label={`Số lượng dòng ${i + 1}`} inputMode="decimal" value={l.qty} onChange={(e) => set(l.key, { qty: e.target.value })} required className="text-right" />
                    <span className="text-xs text-fg-2">{unit(l.materialId)}</span>
                  </div>
                </td>
                <td className="min-w-32"><Input aria-label={`Đơn giá dòng ${i + 1}`} inputMode="numeric" value={l.unitCost} onChange={(e) => set(l.key, { unitCost: e.target.value })} required className="text-right" /></td>
                <td className="min-w-28"><Input aria-label={`Lô NCC dòng ${i + 1}`} value={l.supplierLot} maxLength={60} onChange={(e) => set(l.key, { supplierLot: e.target.value })} /></td>
                <td className="min-w-36"><Input aria-label={`Hạn dùng dòng ${i + 1}`} type="date" value={l.expiry} onChange={(e) => set(l.key, { expiry: e.target.value })} /></td>
                <td className="whitespace-nowrap text-right">{fmtNum(locale, n(l.qty) * n(l.unitCost))} đ</td>
                <td>
                  <Button variant="ghost" aria-label={`Xoá dòng ${i + 1}`} className="w-10 px-0" disabled={lines.length === 1}
                    onClick={() => setLines((ls) => ls.filter((x) => x.key !== l.key))}><Trash2 size={16} /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div><Button onClick={() => setLines((ls) => [...ls, blank()])}><Plus size={16} />Thêm dòng vật tư</Button></div>

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-4 border-t border-line bg-surface px-4 py-3 md:-mx-6 md:px-6">
        <div>
          <div className="text-[13px] text-fg-2">Tổng tiền · {payload.length} dòng</div>
          <div className="num text-[22px] font-semibold">{fmtNum(locale, total)} đ</div>
        </div>
        <Submit className="ml-auto" disabled={!payload.length}>Chốt phiếu nhập</Submit>
      </div>
    </ActionForm>
  );
}
