"use client";
import { useState } from "react";
import { Plus, Send, Trash2 } from "lucide-react";
import { ActionForm, Sheet, Submit, type ActionState } from "@/components/ui/client";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";
import { fmtNum, type Locale } from "@/lib/i18n";

type Act = (prev: ActionState, f: FormData) => Promise<ActionState>;
type Mat = { id: number; name: string; unit: string };
type Farm = { id: number; name: string };

let seq = 1;
type Line = { key: number; materialId: string; qty: string };
const blank = (): Line => ({ key: seq++, materialId: "", qty: "" });

export function NewRequestSheet({ action, farms, materials }: { action: Act; farms: Farm[]; materials: Mat[] }) {
  return (
    <Sheet title="Gửi yêu cầu vật tư" trigger={<><Send size={16} />Gửi yêu cầu</>}>
      {(close) => <NewRequestForm action={action} farms={farms} materials={materials} onDone={close} />}
    </Sheet>
  );
}

function NewRequestForm({ action, farms, materials, onDone }: { action: Act; farms: Farm[]; materials: Mat[]; onDone: () => void }) {
  const [lines, setLines] = useState<Line[]>(() => [blank()]);
  const [farmId, setFarmId] = useState(farms.length === 1 ? String(farms[0].id) : "");
  const [note, setNote] = useState("");
  const set = (key: number, patch: Partial<Line>) => setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  const payload = lines.filter((l) => l.materialId).map((l) => ({ materialId: Number(l.materialId), qty: Number(l.qty.replace(",", ".")) }));
  const unit = (id: string) => materials.find((m) => String(m.id) === id)?.unit ?? "";
  return (
    <ActionForm action={action} onDone={onDone} className="flex flex-col gap-4">
      {farms.length > 1 ? (
        <Field label="Trại">
          <Select name="farmId" required value={farmId} onChange={(e) => setFarmId(e.target.value)}>
            <option value="">Chọn trại</option>
            {farms.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </Select>
        </Field>
      ) : <input type="hidden" name="farmId" value={farmId} />}
      <input type="hidden" name="lines" value={JSON.stringify(payload)} />
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 text-[13px] font-medium text-fg-2">Vật tư</legend>
        {lines.map((l, i) => (
          <div key={l.key} className="grid grid-cols-[minmax(0,1fr)_112px_40px] items-center gap-2">
            <Select aria-label={`Vật tư dòng ${i + 1}`} required value={l.materialId} onChange={(e) => set(l.key, { materialId: e.target.value })}>
              <option value="">Chọn vật tư</option>
              {materials.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}
            </Select>
            <div className="flex items-center gap-1">
              <Input aria-label={`Số lượng dòng ${i + 1}`} inputMode="decimal" required value={l.qty} onChange={(e) => set(l.key, { qty: e.target.value })} className="text-right" />
              <span className="w-6 text-xs text-fg-2">{unit(l.materialId)}</span>
            </div>
            <Button variant="ghost" aria-label={`Xoá dòng ${i + 1}`} className="w-10 px-0" disabled={lines.length === 1}
              onClick={() => setLines((ls) => ls.filter((x) => x.key !== l.key))}><Trash2 size={16} /></Button>
          </div>
        ))}
        <div><Button onClick={() => setLines((ls) => [...ls, blank()])}><Plus size={16} />Thêm vật tư</Button></div>
      </fieldset>
      <Field label="Ghi chú"><Textarea name="note" rows={3} maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
      <Submit disabled={!payload.length || !farmId}>Gửi yêu cầu</Submit>
    </ActionForm>
  );
}

export function CancelRequestButton({ action, id }: { action: Act; id: number }) {
  return (
    <ActionForm action={action}>
      <input type="hidden" name="id" value={id} />
      <Submit variant="secondary">Huỷ</Submit>
    </ActionForm>
  );
}

type IssueLine = { materialId: number; name: string; unit: string; qty: number; issued: number; available: number };

export function IssueSheet({ action, id, code, farmName, lines, primary, locale }: {
  action: Act; id: number; code: string; farmName: string; lines: IssueLine[]; primary: boolean; locale: Locale;
}) {
  return (
    <Sheet title={`Cấp phát ${code}`} variant={primary ? "primary" : "secondary"} trigger="Cấp phát">
      {(close) => (
        <ActionForm action={action} onDone={close} className="flex flex-col gap-4" resetOnSuccess={false}>
          <input type="hidden" name="id" value={id} />
          <div className="text-[13px] text-fg-2">{farmName}</div>
          {lines.map((l) => {
            const remain = Math.max(0, l.qty - l.issued);
            return (
              <Field key={l.materialId} label={`${l.name} · còn ${fmtNum(locale, remain, 1)} ${l.unit}`}
                hint={`Kho tổng còn ${fmtNum(locale, l.available, 1)} ${l.unit}`}
                error={l.available < remain ? "Kho tổng không đủ để cấp đủ" : undefined}>
                <Input name={`issue.${l.materialId}`} inputMode="decimal" defaultValue={remain ? String(Math.min(remain, Math.max(0, l.available))) : "0"}
                  disabled={remain <= 0} className="text-right" />
              </Field>
            );
          })}
          <Submit>Cấp phát</Submit>
        </ActionForm>
      )}
    </Sheet>
  );
}

export function RejectSheet({ action, id, code }: { action: Act; id: number; code: string }) {
  return (
    <Sheet title={`Từ chối ${code}`} variant="secondary" trigger="Từ chối">
      {(close) => (
        <ActionForm action={action} onDone={close} className="flex flex-col gap-4">
          <input type="hidden" name="id" value={id} />
          <Field label="Lý do từ chối"><Textarea name="reason" rows={3} required maxLength={300} /></Field>
          <Submit variant="danger">Từ chối yêu cầu</Submit>
        </ActionForm>
      )}
    </Sheet>
  );
}
