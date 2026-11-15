"use client";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { ActionForm, ConfirmSubmit, Sheet, type ActionState } from "@/components/ui/client";
import { Field, Input, Textarea } from "@/components/ui/fields";

type Act = (prev: ActionState, f: FormData) => Promise<ActionState>;

export function FinalizeForm({ action, code, subject, indicators, lab }: {
  action: Act; code: string; subject: string; indicators: string[]; lab: string;
}) {
  const router = useRouter();
  const free = indicators.length === 0;
  const rows = free ? ["Kết quả chung"] : indicators;
  const onDone = useCallback((s: ActionState) => {
    const inc = (s as ActionState & { data?: { incident?: string | null } }).data?.incident;
    router.push(inc ? `/xet-nghiem?inc=${encodeURIComponent(inc)}` : "/xet-nghiem");
  }, [router]);
  return (
    <ActionForm action={action} resetOnSuccess={false} onDone={onDone} className="flex flex-col gap-6">
      <fieldset className="flex flex-col">
        <legend className="mb-2 text-[13px] font-medium text-fg-2">Kết quả từng chỉ tiêu</legend>
        {rows.map((ind, i) => (
          <div key={ind} className="grid grid-cols-1 items-center gap-2 border-t border-line py-3 first:border-t-0 sm:grid-cols-[minmax(0,1fr)_auto]">
            {free
              ? <Input name="ind" defaultValue={ind} required maxLength={60} aria-label="Tên chỉ tiêu" />
              : <span className="font-medium">{ind}</span>}
            <div role="radiogroup" aria-label={`Kết quả ${ind}`} className="inline-flex gap-1 rounded-ctl bg-surface-2 p-1 text-[13px]">
              {([["neg", "Âm tính"], ["pos", "Dương tính"]] as const).map(([v, label]) => (
                <label key={v} className="relative inline-flex min-h-10 cursor-pointer items-center rounded-md px-4 font-medium text-fg-2 has-[:checked]:bg-surface has-[:checked]:text-fg has-[:checked]:shadow-sm has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent">
                  <input type="radio" name={free ? `r:__${i}` : `r:${ind}`} value={v} defaultChecked={v === "neg"} className="sr-only" />
                  {v === "pos" ? <span className="mr-2 h-2 w-2 rounded-full bg-bad-fill" aria-hidden /> : <span className="mr-2 h-2 w-2 rounded-full bg-ok-fill" aria-hidden />}
                  {label}
                </label>
              ))}
            </div>
          </div>
        ))}
      </fieldset>
      <div className="max-w-md"><Field label="Nơi xét nghiệm"><Input name="lab" defaultValue={lab} maxLength={80} /></Field></div>
      <div>
        <ConfirmSubmit title={`Chốt phiếu ${code}`} actionLabel="Chốt phiếu"
          description={`Kết quả cho ${subject} sẽ có hiệu lực ngay. Phiếu đã chốt không sửa được.`}>Chốt phiếu</ConfirmSubmit>
      </div>
    </ActionForm>
  );
}

export function VoidForm({ action, code }: { action: Act; code: string }) {
  return (
    <Sheet title={`Huỷ phiếu ${code}`} variant="secondary" trigger="Huỷ phiếu">
      {(close) => (
        <ActionForm action={action} resetOnSuccess={false} onDone={close} className="flex flex-col gap-4">
          <Field label="Lý do huỷ"><Textarea name="reason" required maxLength={500} rows={3} /></Field>
          <ConfirmSubmit variant="danger" className="w-full" title={`Huỷ phiếu ${code}`} actionLabel="Huỷ phiếu"
            description="Phiếu huỷ không khôi phục được; cần lập phiếu mới nếu xét nghiệm lại.">Huỷ phiếu</ConfirmSubmit>
        </ActionForm>
      )}
    </Sheet>
  );
}
