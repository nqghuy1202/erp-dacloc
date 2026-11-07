"use client";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Copy, Plus, Trash2 } from "lucide-react";
import { ActionForm, Sheet, Submit, type ActionState } from "@/components/ui/client";
import { Button, Empty, Field, Input, Select, Textarea } from "@/components/ui";
import { cn } from "@/components/ui/cn";
import { fmtNum, type Locale } from "@/lib/i18n";

type Act = (prev: ActionState, f: FormData) => Promise<ActionState>;
export type PlanLineIn = { tankId: number; stockDate: string; stockQty: number; harvestDate: string; harvestQty: number };
type Line = { key: number; tankId: string; stockDate: string; stockQty: string; harvestDate: string; harvestQty: string; touched: boolean };

let seq = 1;
const toLine = (l?: PlanLineIn): Line => ({
  key: seq++, tankId: l ? String(l.tankId) : "", stockDate: l?.stockDate ?? "", stockQty: l ? String(l.stockQty) : "",
  harvestDate: l?.harvestDate ?? "", harvestQty: l ? String(l.harvestQty) : "", touched: !!l,
});
const int = (s: string) => { const v = Math.round(Number(s.replace(/[.\s]/g, ""))); return Number.isFinite(v) ? v : 0; };

/** Dời ngày sang tháng đích, giữ ngày trong tháng (kẹp cuối tháng) */
function shift(date: string, fromMonth: string, toMonth: string) {
  const [fy, fm] = fromMonth.split("-").map(Number);
  const [ty, tm] = toMonth.split("-").map(Number);
  const delta = (ty - fy) * 12 + (tm - fm);
  const [y, m, d] = date.split("-").map(Number);
  const idx = y * 12 + (m - 1) + delta;
  const ny = Math.floor(idx / 12), nm = (idx % 12) + 1;
  const last = new Date(Date.UTC(ny, nm, 0)).getUTCDate();
  return `${ny}-${String(nm).padStart(2, "0")}-${String(Math.min(d, last)).padStart(2, "0")}`;
}

function IntentButton({ intent, primary, children, disabled }: { intent: "save" | "submit"; primary?: boolean; children: React.ReactNode; disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" name="intent" value={intent} disabled={pending || disabled} aria-busy={pending}
      className={cn("inline-flex min-h-10 items-center justify-center gap-2 rounded-ctl border px-4 font-medium disabled:opacity-60",
        primary ? "border-accent bg-accent text-accent-fg" : "border-line bg-surface text-fg")}>
      {children}
    </button>
  );
}

export function PlanEditor({ action, farmId, month, tanks, initial, prev, prevMonth, survival, locale }: {
  action: Act; farmId: number; month: string; tanks: { id: number; code: string }[]; initial: PlanLineIn[];
  prev: PlanLineIn[]; prevMonth: string; survival: number; locale: Locale;
}) {
  const [lines, setLines] = useState<Line[]>(() => initial.map(toLine));
  const set = (key: number, patch: Partial<Line>) => setLines((ls) => ls.map((l) => {
    if (l.key !== key) return l;
    const next = { ...l, ...patch };
    if ("stockQty" in patch && !next.touched) next.harvestQty = next.stockQty ? String(Math.round(int(next.stockQty) * survival)) : "";
    return next;
  }));
  const add = () => setLines((ls) => [...ls, toLine()]);
  const copyPrev = () => setLines(prev.map((l) => toLine({ ...l, stockDate: shift(l.stockDate, prevMonth, month), harvestDate: shift(l.harvestDate, prevMonth, month) })));
  const payload = lines.filter((l) => l.tankId).map((l) => ({
    tankId: Number(l.tankId), stockDate: l.stockDate, stockQty: int(l.stockQty), harvestDate: l.harvestDate, harvestQty: int(l.harvestQty),
  }));
  const total = payload.reduce((a, l) => a + l.harvestQty, 0);
  const mm = month.slice(5, 7);
  const copyBtn = prev.length ? <Button onClick={copyPrev}><Copy size={16} />Sao chép tháng trước</Button> : null;

  return (
    <ActionForm action={action} resetOnSuccess={false} className="flex flex-col gap-4">
      <input type="hidden" name="farmId" value={farmId} />
      <input type="hidden" name="month" value={month} />
      <input type="hidden" name="lines" value={JSON.stringify(payload)} />

      <div className="sticky top-0 z-10 -mx-4 flex flex-wrap items-center gap-4 border-b border-line bg-surface px-4 py-3 md:-mx-6 md:px-6">
        <div>
          <div className="text-[13px] text-fg-2">Tổng thu dự kiến · {payload.length} lô</div>
          <div className="num text-[22px] font-semibold">{fmtNum(locale, total)} PL</div>
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          {lines.length ? copyBtn : null}
          <IntentButton intent="save" disabled={!payload.length}>Lưu nháp</IntentButton>
          <IntentButton intent="submit" primary disabled={!payload.length}>Gửi duyệt</IntentButton>
        </div>
      </div>

      {!lines.length ? (
        <Empty title={`Chưa có kế hoạch tháng ${mm}`} action={<div className="flex flex-wrap justify-center gap-2">{copyBtn}<Button onClick={add}><Plus size={16} />Thêm lô</Button></div>} />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="[&_th]:h-10 [&_th]:border-b [&_th]:border-line [&_th]:px-2 [&_th]:text-left [&_th]:font-medium [&_th]:text-fg-2">
                  <th>Bể</th><th>Ngày thả</th><th>Số thả</th><th>Ngày thu</th><th>Số thu dự kiến</th><th><span className="sr-only">Xoá</span></th>
                </tr>
              </thead>
              <tbody className="num [&_td]:border-b [&_td]:border-line [&_td]:px-2 [&_td]:py-2">
                {lines.map((l, i) => {
                  const badDate = l.stockDate && l.harvestDate && l.harvestDate < l.stockDate;
                  return (
                    <tr key={l.key}>
                      <td className="min-w-32">
                        <Select aria-label={`Bể dòng ${i + 1}`} required value={l.tankId} onChange={(e) => set(l.key, { tankId: e.target.value })}>
                          <option value="">Chọn bể</option>
                          {tanks.map((t) => <option key={t.id} value={t.id}>{t.code}</option>)}
                        </Select>
                      </td>
                      <td className="min-w-36"><Input type="date" aria-label={`Ngày thả dòng ${i + 1}`} required value={l.stockDate} onChange={(e) => set(l.key, { stockDate: e.target.value })} /></td>
                      <td className="min-w-32"><Input aria-label={`Số thả dòng ${i + 1}`} inputMode="numeric" required value={l.stockQty} onChange={(e) => set(l.key, { stockQty: e.target.value })} className="text-right" /></td>
                      <td className="min-w-36">
                        <Input type="date" aria-label={`Ngày thu dòng ${i + 1}`} required value={l.harvestDate} aria-invalid={badDate || undefined}
                          onChange={(e) => set(l.key, { harvestDate: e.target.value })} className={cn(badDate && "border-bad")} />
                        {badDate ? <div className="mt-1 text-xs font-medium text-bad">Trước ngày thả</div> : null}
                      </td>
                      <td className="min-w-32"><Input aria-label={`Số thu dòng ${i + 1}`} inputMode="numeric" required value={l.harvestQty} onChange={(e) => set(l.key, { harvestQty: e.target.value, touched: true })} className="text-right" /></td>
                      <td><Button variant="ghost" aria-label={`Xoá dòng ${i + 1}`} className="w-10 px-0" onClick={() => setLines((ls) => ls.filter((x) => x.key !== l.key))}><Trash2 size={16} /></Button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div><Button onClick={add}><Plus size={16} />Thêm lô</Button></div>
        </>
      )}
    </ActionForm>
  );
}

export function ApproveButton({ action, planId, primary }: { action: Act; planId: number; primary: boolean }) {
  return (
    <ActionForm action={action}>
      <input type="hidden" name="planId" value={planId} />
      <input type="hidden" name="decision" value="approve" />
      <Submit variant={primary ? "primary" : "secondary"}>Duyệt</Submit>
    </ActionForm>
  );
}

export function ReturnSheet({ action, planId, title }: { action: Act; planId: number; title: string }) {
  return (
    <Sheet title={`Trả lại ${title}`} variant="secondary" trigger="Trả lại">
      {(close) => (
        <ActionForm action={action} onDone={close} className="flex flex-col gap-4">
          <input type="hidden" name="planId" value={planId} />
          <input type="hidden" name="decision" value="return" />
          <Field label="Lý do trả lại"><Textarea name="reason" rows={3} required maxLength={300} /></Field>
          <Submit variant="danger">Trả lại kế hoạch</Submit>
        </ActionForm>
      )}
    </Sheet>
  );
}
