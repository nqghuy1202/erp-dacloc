"use client";
import { useCallback, useRef } from "react";
import { ListPlus, PackageCheck } from "lucide-react";
import { ActionForm, Sheet, Submit } from "@/components/ui/client";
import { Field, Input } from "@/components/ui";
import { addTaskAction, harvestAction } from "./actions";

/** onDone ổn định: ActionForm chạy lại effect khi onDone đổi tham chiếu → tránh toast lặp */
function useStable(fn: () => void) {
  const ref = useRef(fn);
  ref.current = fn;
  return useCallback(() => ref.current(), []);
}

function CloseOnDone({ close, children, action }: { close: () => void; children: React.ReactNode; action: typeof addTaskAction }) {
  const done = useStable(close);
  return <ActionForm action={action} onDone={done} className="flex flex-col gap-4">{children}</ActionForm>;
}

export function AddTaskSheet({ lotId, today }: { lotId: number; today: string }) {
  return (
    <Sheet title="Thêm việc" variant="secondary" trigger={<><ListPlus size={16} aria-hidden />Thêm việc</>}>
      {(close) => (
        <CloseOnDone close={close} action={addTaskAction}>
          <input type="hidden" name="lotId" value={lotId} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ngày"><Input type="date" name="day" defaultValue={today} min={today} required /></Field>
            <Field label="Giờ"><Input type="time" name="slot" required /></Field>
          </div>
          <Field label="Việc"><Input name="title" required maxLength={120} autoComplete="off" /></Field>
          <Submit className="w-full">Thêm việc</Submit>
        </CloseOnDone>
      )}
    </Sheet>
  );
}

export function HarvestSheet({ lotId, lotCode, tankCode, estimated, summary }: { lotId: number; lotCode: string; tankCode: string; estimated: number; summary: string }) {
  return (
    <Sheet title={`Thu hoạch ${lotCode}`} trigger={<><PackageCheck size={16} aria-hidden />Thu hoạch</>}>
      {() => (
        <ActionForm action={harvestAction} className="flex flex-col gap-4" resetOnSuccess={false}>
          <input type="hidden" name="lotId" value={lotId} />
          <p className="num text-[13px] text-fg-2">{summary}</p>
          <Field label="Số đếm thực (con)" hint={`Bể ${tankCode} chuyển sang Chờ vệ sinh`}>
            <Input type="number" name="countedQty" inputMode="numeric" min={1} step={1} defaultValue={estimated} required className="num text-right" />
          </Field>
          <Submit className="w-full">Thu hoạch</Submit>
        </ActionForm>
      )}
    </Sheet>
  );
}
