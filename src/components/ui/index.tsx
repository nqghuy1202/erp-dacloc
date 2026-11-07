import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "./cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
const VAR: Record<Variant, string> = {
  primary: "bg-accent text-accent-fg border-accent hover:brightness-110",
  secondary: "bg-surface text-fg border-line hover:bg-surface-2",
  ghost: "bg-transparent text-fg border-transparent hover:bg-surface-2",
  danger: "bg-bad text-white border-bad hover:brightness-110",
};
const BTN = "inline-flex items-center justify-center gap-2 rounded-ctl border px-4 min-h-10 font-medium whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed";

export function Button({ variant = "secondary", className, ...p }: ComponentProps<"button"> & { variant?: Variant }) {
  return <button type="button" {...p} className={cn(BTN, VAR[variant], className)} />;
}

export function LinkButton({ variant = "secondary", className, ...p }: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link {...p} className={cn(BTN, VAR[variant], className)} />;
}

export function Card({ className, ...p }: ComponentProps<"div">) {
  return <div {...p} className={cn("bg-surface border border-line rounded-card", className)} />;
}

export function CardHeader({ title, right, className }: { title: ReactNode; right?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2 px-4 pt-4 md:px-6", className)}>
      <h2 className="text-[15px] font-semibold">{title}</h2>
      {right ? <div className="ml-auto flex items-center gap-2 text-[13px] text-fg-2">{right}</div> : null}
    </div>
  );
}

export const CardBody = ({ className, ...p }: ComponentProps<"div">) => <div {...p} className={cn("p-4 md:px-6 md:pb-6", className)} />;

export type Tone = "ok" | "warn" | "bad" | "acc" | "neu";
const TONE: Record<Tone, string> = {
  ok: "bg-ok-soft text-ok-ink", warn: "bg-warn-soft text-warn-ink", bad: "bg-bad-soft text-bad-ink",
  acc: "bg-accent-soft text-accent-ink", neu: "bg-surface-2 text-fg-2",
};
export function Badge({ tone = "neu", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap", TONE[tone], className)}>{children}</span>;
}

export function PageHeader({ title, meta, actions, crumb }: { title: ReactNode; meta?: ReactNode; actions?: ReactNode; crumb?: ReactNode }) {
  return (
    <div className="mb-6">
      {crumb ? <div className="mb-2 text-[13px] text-fg-2">{crumb}</div> : null}
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0">
          <h1 className="text-[22px] font-semibold leading-tight">{title}</h1>
          {meta ? <div className="text-[13px] text-fg-2">{meta}</div> : null}
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">{actions}</div>
      </div>
    </div>
  );
}

export function Empty({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <div className="text-[15px] font-medium text-fg-2">{title}</div>
      {action}
    </div>
  );
}

export function Stat({ label, value, sub, tone }: { label: ReactNode; value: ReactNode; sub?: ReactNode; tone?: "bad" | "ok" }) {
  return (
    <Card className="px-4 py-4 md:px-6">
      <div className="text-[13px] text-fg-2">{label}</div>
      <div className={cn("num mt-1 text-2xl font-semibold", tone === "bad" && "text-bad", tone === "ok" && "text-ok")}>{value}</div>
      {sub ? <div className="mt-1 text-xs text-fg-2">{sub}</div> : null}
    </Card>
  );
}

export function Table({ head, children, className }: { head: ReactNode[]; children: ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr>{head.map((h, i) => <th key={i} className="h-10 whitespace-nowrap border-b border-line px-3 text-left font-medium text-fg-2">{h}</th>)}</tr>
        </thead>
        <tbody className="num [&_td]:h-12 [&_td]:border-b [&_td]:border-line [&_td]:px-3 [&_td]:whitespace-nowrap [&_tr:last-child_td]:border-b-0">{children}</tbody>
      </table>
    </div>
  );
}

const FIELD = "min-h-10 w-full rounded-ctl border border-line bg-surface px-3 text-fg placeholder:text-fg-2 disabled:opacity-60";
export function Field({ label, children, hint, error }: { label: string; children: ReactNode; hint?: ReactNode; error?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-fg-2">{label}</span>
      {children}
      {error ? <span className="text-xs font-medium text-bad">{error}</span> : hint ? <span className="text-xs text-fg-2">{hint}</span> : null}
    </label>
  );
}
export const Input = ({ className, ...p }: ComponentProps<"input">) => <input {...p} className={cn(FIELD, className)} />;
export const Select = ({ className, ...p }: ComponentProps<"select">) => <select {...p} className={cn(FIELD, "pr-8", className)} />;
export const Textarea = ({ className, ...p }: ComponentProps<"textarea">) => <textarea {...p} className={cn(FIELD, "py-2", className)} />;

/** Thanh tiến độ có vạch mốc (design-spec §3 Tiến độ) */
export function Progress({ value, mark, tone = "acc", height = 10, label }: { value: number; mark?: number; tone?: "acc" | "warn" | "ok"; height?: number; label: string }) {
  const fill = tone === "warn" ? "bg-warn" : tone === "ok" ? "bg-ok" : "bg-accent";
  return (
    <div role="img" aria-label={label} className="relative w-full rounded-full bg-surface-2" style={{ height }}>
      <span className={cn("absolute inset-y-0 left-0 rounded-full", fill)} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      {mark != null ? <span className="absolute -inset-y-1.5 w-0.5 bg-fg" style={{ left: `${Math.max(0, Math.min(100, mark))}%` }} /> : null}
    </div>
  );
}
