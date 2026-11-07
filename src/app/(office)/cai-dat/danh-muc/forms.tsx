"use client";
import { useActionState, useEffect } from "react";
import { Download, Plus, Upload } from "lucide-react";
import { ActionForm, Sheet, Submit, toast, type ActionState } from "@/components/ui/client";
import { Badge, Field, Input, Select, Table, Textarea } from "@/components/ui";

type Act = (prev: ActionState, f: FormData) => Promise<ActionState>;
type ImportErr = { row: number; code?: string; reason: "duplicate_code" | "invalid_row" | "unknown_farm" };
type Result = { saved: number; errors: ImportErr[] };

const REASON: Record<ImportErr["reason"], string> = {
  duplicate_code: "Trùng mã", invalid_row: "Thiếu hoặc sai dữ liệu", unknown_farm: "Không có mã trại",
};

/** Import CSV: file hoặc dán; hiện "N dòng đã lưu · M dòng lỗi" + bảng lỗi (dòng tính cả tiêu đề) */
export function ImportForm({ action, columns, primary, template }: { action: Act; columns: string; primary?: boolean; template?: string }) {
  const [state, formAction] = useActionState(action, {} as ActionState);
  const result = (state as { data?: Result }).data;
  useEffect(() => { if (state.ok && state.message) toast(state.message); }, [state]);
  const errCsv = result?.errors.length
    ? `dong,ma,ly_do\n${result.errors.map((e) => `${e.row + 1},${e.code ?? ""},${REASON[e.reason]}`).join("\n")}\n`
    : "";
  return (
    <div className="flex flex-col gap-4">
      <form action={formAction} className="grid gap-4 md:grid-cols-2">
        <Field label="File CSV" hint={`Cột: ${columns}`}>
          <Input type="file" name="file" accept=".csv,text/csv" className="py-2" />
        </Field>
        <Field label="Hoặc dán nội dung">
          <Textarea name="text" rows={3} placeholder={columns} className="font-mono text-xs" />
        </Field>
        <div className="flex flex-wrap items-center gap-2 md:col-span-2">
          <Submit variant={primary ? "primary" : "secondary"}><Upload size={16} />Import file</Submit>
          {template ? <a href={template} download className="inline-flex min-h-10 items-center gap-2 px-2 text-[13px] font-medium text-accent-ink hover:underline"><Download size={16} />Tải file mẫu</a> : null}
        </div>
        {state.error ? <p role="alert" className="rounded-ctl bg-bad-soft px-3 py-2 text-[13px] font-medium text-bad-ink md:col-span-2">{state.error}</p> : null}
      </form>
      {result ? (
        <div role="status" className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2 text-[13px] font-medium">
            <Badge tone="ok">{result.saved} dòng đã lưu</Badge>
            <Badge tone={result.errors.length ? "bad" : "neu"}>{result.errors.length} dòng lỗi</Badge>
            {errCsv ? (
              <a href={`data:text/csv;charset=utf-8,${encodeURIComponent(`﻿${errCsv}`)}`} download="dong-loi-import.csv"
                className="inline-flex min-h-10 items-center gap-2 px-2 text-accent-ink hover:underline"><Download size={16} />Tải dòng lỗi</a>
            ) : null}
          </div>
          {result.errors.length ? (
            <Table head={["Dòng", "Mã", "Lý do"]}>
              {result.errors.map((e) => (
                <tr key={`${e.row}-${e.code}`}><td className="text-right">{e.row + 1}</td><td>{e.code || "—"}</td><td>{REASON[e.reason]}</td></tr>
              ))}
            </Table>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function FarmSheet({ action }: { action: Act }) {
  return (
    <Sheet title="Thêm trại" variant="secondary" trigger={<><Plus size={16} />Thêm trại</>}>
      {(close) => (
        <ActionForm action={action} onDone={close} className="flex flex-col gap-4">
          <Field label="Mã trại"><Input name="code" required maxLength={20} autoCapitalize="characters" className="uppercase" /></Field>
          <Field label="Tên trại"><Input name="name" required maxLength={80} /></Field>
          <Field label="Loại trại">
            <Select name="kind" defaultValue="hatchery">
              <option value="hatchery">Trại ương</option>
              <option value="broodstock">Trại bố mẹ</option>
            </Select>
          </Field>
          <Submit>Thêm trại</Submit>
        </ActionForm>
      )}
    </Sheet>
  );
}

export function BannedToggle({ action, materialId, banned, name }: { action: Act; materialId: number; banned: boolean; name: string }) {
  return (
    <ActionForm action={action}>
      <input type="hidden" name="materialId" value={materialId} />
      <input type="hidden" name="banned" value={banned ? "0" : "1"} />
      <Submit variant="secondary" className="min-w-28">
        <span className="sr-only">{name}: </span>{banned ? "Bỏ cấm" : "Gắn cấm"}
      </Submit>
    </ActionForm>
  );
}
