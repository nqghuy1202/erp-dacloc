"use client";
import { useActionState } from "react";
import { login } from "../actions";
// Màn đăng nhập là cửa vào chung của cả công nhân (điện thoại yếu) → dùng nút nhẹ của hiện trường, không kéo JS Astryx.
import { FieldSubmit } from "@/components/field/client";

export function LoginForm({ labels }: { labels: { title: string; empCode: string; password: string; submit: string } }) {
  const [state, action] = useActionState(login, {});
  return (
    <form action={action} className="flex flex-col gap-4 rounded-card border border-line bg-surface p-6 shadow-sm">
      <h1 className="text-[22px] font-semibold">{labels.title}</h1>
      <label className="flex flex-col gap-1.5"><span className="text-[13px] font-semibold text-fg">{labels.empCode}</span>
        <input id="empCode" name="empCode" required autoComplete="username" autoCapitalize="none" className="min-h-12 rounded-ctl border border-line-strong bg-surface px-3 text-base hover:border-fg-2 focus-visible:border-accent" /></label>
      <label className="flex flex-col gap-1.5"><span className="text-[13px] font-semibold text-fg">{labels.password}</span>
        <input id="password" name="password" type="password" required autoComplete="current-password" className="min-h-12 rounded-ctl border border-line-strong bg-surface px-3 text-base hover:border-fg-2 focus-visible:border-accent" /></label>
      {state.error ? <p role="alert" className="rounded-ctl bg-bad-soft px-3 py-2 text-[13px] font-medium text-bad-ink">{state.error}</p> : null}
      <FieldSubmit>{labels.submit}</FieldSubmit>
    </form>
  );
}
