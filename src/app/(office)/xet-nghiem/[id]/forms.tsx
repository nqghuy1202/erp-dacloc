"use client";
import { useCallback, useEffect, useRef, type ReactNode, type RefObject } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { AlertTriangle, X } from "lucide-react";
import { ActionForm, Submit, type ActionState } from "@/components/ui/client";

type Act = (prev: ActionState, f: FormData) => Promise<ActionState>;

/** Đóng dialog khi submit xong: lỗi hiện ngay dưới form, dữ liệu đã nhập giữ nguyên */
function CloseOnSettle({ dialog }: { dialog: RefObject<HTMLDialogElement | null> }) {
  const { pending } = useFormStatus();
  const was = useRef(false);
  useEffect(() => {
    if (was.current && !pending) dialog.current?.close();
    was.current = pending;
  }, [pending, dialog]);
  return null;
}

/** AlertDialog native: xác nhận hành động không đảo được (design-spec §3) */
function ConfirmDialog({ trigger, title, body, confirm, variant = "primary", children }: {
  trigger: ReactNode; title: string; body: ReactNode; confirm: string; variant?: "primary" | "danger"; children?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const btn = variant === "danger" ? "bg-bad text-white border-bad" : "bg-accent text-accent-fg border-accent";
  return (
    <>
      <button type="button" onClick={() => ref.current?.showModal()} className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-ctl border px-4 font-medium ${variant === "danger" ? "border-line bg-surface text-bad-ink hover:bg-bad-soft" : btn}`}>{trigger}</button>
      <dialog ref={ref} aria-labelledby="confirm-title" className="w-full max-w-md rounded-card border border-line bg-surface p-0 text-fg">
        <div className="flex flex-col gap-4 p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="mt-0.5 shrink-0 text-warn-ink" aria-hidden />
            <h2 id="confirm-title" className="text-lg font-semibold">{title}</h2>
            <button type="button" onClick={() => ref.current?.close()} aria-label="Đóng" className="-mr-2 -mt-2 ml-auto grid h-10 w-10 place-items-center rounded-ctl hover:bg-surface-2"><X size={18} /></button>
          </div>
          <div className="text-[14px] text-fg-2">{body}</div>
          {children}
          <CloseOnSettle dialog={ref} />
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" onClick={() => ref.current?.close()} className="inline-flex min-h-10 items-center rounded-ctl border border-line bg-surface px-4 font-medium hover:bg-surface-2">Quay lại</button>
            <Submit variant={variant}>{confirm}</Submit>
          </div>
        </div>
      </dialog>
    </>
  );
}

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
              ? <input name="ind" defaultValue={ind} required maxLength={60} aria-label="Tên chỉ tiêu" className="min-h-10 rounded-ctl border border-line bg-surface px-3" />
              : <span className="font-medium">{ind}</span>}
            <div role="radiogroup" aria-label={`Kết quả ${ind}`} className="inline-flex gap-1 rounded-ctl bg-surface-2 p-1 text-[13px]">
              {([["neg", "Âm tính"], ["pos", "Dương tính"]] as const).map(([v, label]) => (
                <label key={v} className="relative inline-flex min-h-10 cursor-pointer items-center rounded-md px-4 font-medium text-fg-2 has-[:checked]:bg-surface has-[:checked]:text-fg has-[:checked]:shadow-sm has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent">
                  <input type="radio" name={free ? `r:__${i}` : `r:${ind}`} value={v} defaultChecked={v === "neg"} className="sr-only" />
                  {v === "pos" ? <span className="mr-2 h-2 w-2 rounded-full bg-bad" aria-hidden /> : <span className="mr-2 h-2 w-2 rounded-full bg-ok" aria-hidden />}
                  {label}
                </label>
              ))}
            </div>
          </div>
        ))}
      </fieldset>
      <label className="flex max-w-md flex-col gap-1.5">
        <span className="text-[13px] font-medium text-fg-2">Nơi xét nghiệm</span>
        <input name="lab" defaultValue={lab} maxLength={80} className="min-h-10 w-full rounded-ctl border border-line bg-surface px-3 text-fg" />
      </label>
      <div>
        <ConfirmDialog trigger="Chốt phiếu" title={`Chốt phiếu ${code}`} confirm="Chốt phiếu"
          body={<>Kết quả cho {subject} sẽ có hiệu lực ngay. Phiếu đã chốt không sửa được.</>} />
      </div>
    </ActionForm>
  );
}

export function VoidForm({ action, code }: { action: Act; code: string }) {
  return (
    <ActionForm action={action} resetOnSuccess={false}>
      <ConfirmDialog trigger="Huỷ phiếu" variant="danger" title={`Huỷ phiếu ${code}`} confirm="Huỷ phiếu"
        body="Phiếu huỷ không khôi phục được; cần lập phiếu mới nếu xét nghiệm lại.">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-fg-2">Lý do huỷ</span>
          <textarea name="reason" required maxLength={500} rows={3} className="w-full rounded-ctl border border-line bg-surface px-3 py-2 text-fg" />
        </label>
      </ConfirmDialog>
    </ActionForm>
  );
}
