"use client";
import { useCallback, useRef } from "react";
import { Plus } from "lucide-react";
import { ActionForm, Sheet, Submit } from "@/components/ui/client";
import { Field, Input, Select } from "@/components/ui";
import { receiveBroodstockAction } from "./actions";

function Form({ close, farms, species }: { close: () => void; farms: { id: number; name: string }[]; species: { id: number; name: string }[] }) {
  const ref = useRef(close);
  ref.current = close;
  const done = useCallback(() => ref.current(), []);
  return (
    <ActionForm action={receiveBroodstockAction} onDone={done} className="flex flex-col gap-4">
      <Field label="Trại">
        <Select name="farmId" required defaultValue={farms.length === 1 ? String(farms[0].id) : ""}>
          {farms.length > 1 ? <option value="" disabled>Chọn trại</option> : null}
          {farms.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
        </Select>
      </Field>
      <Field label="Loài">
        <Select name="speciesId" required defaultValue={species.length === 1 ? String(species[0].id) : ""}>
          {species.length > 1 ? <option value="" disabled>Chọn loài</option> : null}
          {species.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
      </Field>
      <Field label="Nguồn"><Input name="source" required maxLength={120} autoComplete="off" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Xuất xứ"><Input name="origin" maxLength={120} autoComplete="off" /></Field>
        <Field label="Dòng"><Input name="line" maxLength={60} autoComplete="off" /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Số đực"><Input type="number" name="males" inputMode="numeric" min={0} max={100000} step={1} required className="num text-right" /></Field>
        <Field label="Số cái"><Input type="number" name="females" inputMode="numeric" min={1} max={100000} step={1} required className="num text-right" /></Field>
      </div>
      <Field label="Giấy kiểm dịch"><Input name="quarantineDoc" maxLength={120} autoComplete="off" /></Field>
      <Submit className="w-full">Tiếp nhận đàn</Submit>
    </ActionForm>
  );
}

export function ReceiveSheet({ farms, species, variant = "primary" }: { farms: { id: number; name: string }[]; species: { id: number; name: string }[]; variant?: "primary" | "secondary" }) {
  return (
    <Sheet title="Tiếp nhận đàn" variant={variant} trigger={<><Plus size={16} aria-hidden />Tiếp nhận đàn</>}>
      {(close) => <Form close={close} farms={farms} species={species} />}
    </Sheet>
  );
}
