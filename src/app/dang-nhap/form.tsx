"use client";
import { useActionState } from "react";
import { login } from "../actions";
import { Submit } from "@/components/ui/client";

export function LoginForm({ labels }: { labels: { title: string; empCode: string; password: string; submit: string } }) {
  const [state, action] = useActionState(login, {});
  return (
    <form action={action} className="flex flex-col gap-4 rounded-card border border-line bg-surface p-6">
      <h1 className="text-[22px] font-semibold">{labels.title}</h1>
      <label className="flex flex-col gap-1.5"><span className="text-[13px] font-medium text-fg-2">{labels.empCode}</span>
        <input id="empCode" name="empCode" required autoComplete="username" autoCapitalize="characters" className="min-h-12 rounded-ctl border border-line bg-surface px-3 text-base uppercase" /></label>
      <label className="flex flex-col gap-1.5"><span className="text-[13px] font-medium text-fg-2">{labels.password}</span>
        <input id="password" name="password" type="password" required autoComplete="current-password" className="min-h-12 rounded-ctl border border-line bg-surface px-3 text-base" /></label>
      {state.error ? <p role="alert" className="rounded-ctl bg-bad-soft px-3 py-2 text-[13px] font-medium text-bad-ink">{state.error}</p> : null}
      <Submit className="min-h-12 text-base">{labels.submit}</Submit>
    </form>
  );
}
