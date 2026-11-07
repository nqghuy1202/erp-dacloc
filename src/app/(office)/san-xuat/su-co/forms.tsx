"use client";
import { useCallback, useRef, useState } from "react";
import { ActionForm, Sheet, Submit } from "@/components/ui/client";
import { Field, Textarea } from "@/components/ui";
import { resolveAction } from "./actions";

const OPTIONS = [["monitor", "Theo dõi thêm"], ["treat", "Xử lý nước / thuốc"], ["cull", "Huỷ lô"]] as const;
const nf = new Intl.NumberFormat("vi-VN");

function ResolveForm({ incidentId, lotCode, estimated, close }: { incidentId: number; lotCode: string; estimated: number; close: () => void }) {
  const [action, setAction] = useState<string>("monitor");
  const ref = useRef(close);
  ref.current = close;
  const done = useCallback(() => ref.current(), []);
  const cull = action === "cull";
  return (
    <ActionForm action={resolveAction} onDone={done} className="flex flex-col gap-4">
      <input type="hidden" name="incidentId" value={incidentId} />
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-[13px] font-medium text-fg-2">Hành động</legend>
        {OPTIONS.map(([v, l]) => (
          <label key={v} className="flex min-h-10 items-center gap-3 rounded-ctl border border-line px-3 has-[:checked]:border-accent has-[:checked]:bg-accent-soft">
            <input type="radio" name="action" value={v} checked={action === v} onChange={() => setAction(v)} className="h-4 w-4 accent-accent" />
            <span className="text-[14px] font-medium">{l}</span>
          </label>
        ))}
      </fieldset>
      {cull ? <p role="alert" className="num rounded-ctl bg-bad-soft px-3 py-2 text-[13px] font-medium text-bad-ink">Huỷ lô {lotCode} — {nf.format(estimated)} con</p> : null}
      <Field label={cull ? "Lý do huỷ" : "Ghi chú"}><Textarea name="note" rows={3} maxLength={500} required={cull} /></Field>
      <Submit variant={cull ? "danger" : "primary"} className="w-full">{cull ? "Huỷ lô" : "Đóng sự cố"}</Submit>
    </ActionForm>
  );
}

export function ResolveSheet(p: { incidentId: number; lotCode: string; estimated: number }) {
  return (
    <Sheet title="Xử lý sự cố" variant="secondary" trigger="Xử lý sự cố">
      {(close) => <ResolveForm {...p} close={close} />}
    </Sheet>
  );
}
