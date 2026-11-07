"use client";
import { Lock, LockOpen, UserPlus } from "lucide-react";
import { ActionForm, Sheet, Submit, type ActionState } from "@/components/ui/client";
import { Field, Input, Select } from "@/components/ui";

type Act = (prev: ActionState, f: FormData) => Promise<ActionState>;
type Farm = { id: number; name: string; code: string };

function FarmChecks({ farms, selected }: { farms: Farm[]; selected?: number[] }) {
  if (!farms.length) return <div className="text-[13px] text-fg-2">Chưa có trại</div>;
  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="mb-1 text-[13px] font-medium text-fg-2">Trại được phép</legend>
      {farms.map((f) => (
        <label key={f.id} className="flex min-h-10 items-center gap-3 rounded-ctl px-2 hover:bg-surface-2">
          <input type="checkbox" name="farmIds" value={f.id} defaultChecked={selected?.includes(f.id)} className="h-5 w-5 accent-accent" />
          <span className="text-[14px]">{f.name} <span className="text-fg-2">· {f.code}</span></span>
        </label>
      ))}
    </fieldset>
  );
}

export function NewUserSheet({ action, farms, roles }: { action: Act; farms: Farm[]; roles: [string, string][] }) {
  return (
    <Sheet title="Thêm người dùng" trigger={<><UserPlus size={16} />Thêm người dùng</>}>
      {(close) => (
        <ActionForm action={action} onDone={close} className="flex flex-col gap-4">
          <Field label="Mã nhân viên"><Input name="empCode" required minLength={2} maxLength={20} pattern="[A-Za-z0-9_\-]+" autoCapitalize="characters" autoComplete="off" className="uppercase" /></Field>
          <Field label="Họ tên"><Input name="name" required maxLength={80} autoComplete="off" /></Field>
          <Field label="Vai trò">
            <Select name="role" required defaultValue="">
              <option value="">Chọn vai trò</option>
              {roles.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
          </Field>
          <Field label="Mật khẩu ban đầu" hint="Tối thiểu 8 ký tự"><Input name="password" type="password" required minLength={8} maxLength={72} autoComplete="new-password" /></Field>
          <FarmChecks farms={farms} />
          <Submit>Thêm người dùng</Submit>
        </ActionForm>
      )}
    </Sheet>
  );
}

export function FarmsSheet({ action, userId, name, farms, selected }: { action: Act; userId: number; name: string; farms: Farm[]; selected: number[] }) {
  return (
    <Sheet title={`Trại của ${name}`} variant="secondary" trigger="Sửa trại">
      {(close) => (
        <ActionForm action={action} onDone={close} resetOnSuccess={false} className="flex flex-col gap-4">
          <input type="hidden" name="userId" value={userId} />
          <FarmChecks farms={farms} selected={selected} />
          <Submit>Lưu</Submit>
        </ActionForm>
      )}
    </Sheet>
  );
}

export function ActiveToggle({ action, userId, active, name }: { action: Act; userId: number; active: boolean; name: string }) {
  return (
    <ActionForm action={action}>
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="active" value={active ? "0" : "1"} />
      <Submit variant="secondary" className="min-w-28">
        {active ? <Lock size={16} /> : <LockOpen size={16} />}<span className="sr-only">{name}: </span>{active ? "Khoá" : "Mở khoá"}
      </Submit>
    </ActionForm>
  );
}
