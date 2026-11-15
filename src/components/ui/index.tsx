import type { ComponentProps, ReactNode } from "react";
import { Button as AxButton } from "@astryxdesign/core/Button";
import { Badge as AxBadge } from "@astryxdesign/core/Badge";
import { Card as AxCard } from "@astryxdesign/core/Card";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Heading } from "@astryxdesign/core/Heading";
import { cn } from "./cn";

// Lớp mỏng trên Astryx (design-spec 12 §3, v5): giữ API cũ để các màn không phải đổi, hình do theme `dacloc` quyết.

type Variant = "primary" | "secondary" | "ghost" | "danger";
const AX_VARIANT = { primary: "primary", secondary: "secondary", ghost: "ghost", danger: "destructive" } as const;

export { textOf } from "./text";
import { textOf } from "./text";

const full = (c?: string) => (c && /(^|\s)w-full(\s|$)/.test(c) ? "100%" : undefined);

type BtnProps = {
  variant?: Variant; size?: "sm" | "md" | "lg"; className?: string; children?: ReactNode;
  "aria-label"?: string; "aria-describedby"?: string; title?: string;
};

export function Button({ variant = "secondary", size, className, children, disabled, onClick, type = "button", name, value, form, ...rest }: BtnProps & {
  disabled?: boolean; onClick?: ComponentProps<"button">["onClick"]; type?: "button" | "submit" | "reset"; name?: string; value?: string; form?: string;
}) {
  const label = rest["aria-label"] ?? textOf(children);
  return (
    <AxButton label={label} variant={AX_VARIANT[variant]} size={size} isDisabled={disabled} type={type} name={name} value={value} form={form}
      onClick={onClick as never} tooltip={rest.title} aria-describedby={rest["aria-describedby"]} className={className} width={full(className)}>
      {typeof children === "string" ? undefined : children}
    </AxButton>
  );
}

/** Nút dạng liên kết — Astryx render qua LinkProvider (next/link) đặt ở Providers. */
export function LinkButton({ variant = "secondary", size, className, children, href, ...rest }: BtnProps & { href: string; prefetch?: boolean }) {
  const label = rest["aria-label"] ?? textOf(children);
  return (
    <AxButton href={href} label={label} variant={AX_VARIANT[variant]} size={size} tooltip={rest.title} className={className} width={full(className)}>
      {typeof children === "string" ? undefined : children}
    </AxButton>
  );
}

export function Card({ className, children, id }: { className?: string; children?: ReactNode; id?: string }) {
  return <AxCard padding={0} id={id} className={className}>{children}</AxCard>;
}

export function CardHeader({ title, right, className }: { title: ReactNode; right?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2 px-4 pt-4 md:px-6", className)}>
      <Heading level={2} className="!text-[15px]">{title}</Heading>
      {right ? <div className="ml-auto flex items-center gap-2 text-[13px] text-fg-2">{right}</div> : null}
    </div>
  );
}

export const CardBody = ({ className, ...p }: ComponentProps<"div">) => <div {...p} className={cn("p-4 md:px-6 md:pb-6", className)} />;

export type Tone = "ok" | "warn" | "bad" | "acc" | "neu";
const AX_TONE = { ok: "success", warn: "warning", bad: "error", acc: "green", neu: "neutral" } as const;
export function Badge({ tone = "neu", children, className, icon }: { tone?: Tone; children: ReactNode; className?: string; icon?: ReactNode }) {
  return <AxBadge variant={AX_TONE[tone]} label={children} icon={icon} className={className} />;
}

export function PageHeader({ title, meta, actions, crumb }: { title: ReactNode; meta?: ReactNode; actions?: ReactNode; crumb?: ReactNode }) {
  return (
    <div className="mb-6">
      {crumb ? <div className="mb-2 text-[13px] text-fg-2">{crumb}</div> : null}
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0">
          <Heading level={1}>{title}</Heading>
          {meta ? <div className="mt-1 text-[13px] text-fg-2">{meta}</div> : null}
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">{actions}</div>
      </div>
    </div>
  );
}

/** Trạng thái trống: 1 cụm ngắn + 1 CTA (design-spec 12 ma trận trạng thái). */
export function Empty({ title, action, icon }: { title: string; action?: ReactNode; icon?: ReactNode }) {
  return <div className="py-8"><EmptyState title={title} icon={icon} actions={action} isCompact /></div>;
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

/** Bảng tĩnh (server) cho màn chưa chuyển sang DataTable. Hàng 48px theo Ngoại lệ đã duyệt. */
export function Table({ head, children, className }: { head: ReactNode[]; children: ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr>{head.map((h, i) => <th key={i} className="h-10 whitespace-nowrap border-b border-line px-3 text-left font-semibold text-fg-2">{h}</th>)}</tr>
        </thead>
        <tbody className="num [&_td]:h-12 [&_td]:border-b [&_td]:border-line [&_td]:px-3 [&_td]:whitespace-nowrap [&_tr:last-child_td]:border-b-0 [&_tr:hover]:bg-surface-2">{children}</tbody>
      </table>
    </div>
  );
}

// nợ: Field/Input/Select/Textarea còn là phần tử native (form server action không kiểm soát giá trị); trần: chưa có ô lỗi/trạng thái kiểu Astryx, nâng cấp sang TextInput/Selector (htmlName) khi chuyển từng form ở giai đoạn 2.
const FIELD = "min-h-10 w-full rounded-ctl border border-line-strong bg-surface px-3 text-fg placeholder:text-fg-2 hover:border-fg-2 focus-visible:border-accent disabled:opacity-60";
export function Field({ label, children, hint, error }: { label: string; children: ReactNode; hint?: ReactNode; error?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-semibold text-fg">{label}</span>
      {children}
      {error ? <span className="text-xs font-medium text-bad">{error}</span> : hint ? <span className="text-xs text-fg-2">{hint}</span> : null}
    </label>
  );
}
export const Input = ({ className, ...p }: ComponentProps<"input">) => <input {...p} className={cn(FIELD, className)} />;
export const Select = ({ className, ...p }: ComponentProps<"select">) => <select {...p} className={cn(FIELD, "pr-8", className)} />;
export const Textarea = ({ className, ...p }: ComponentProps<"textarea">) => <textarea {...p} className={cn(FIELD, "py-2", className)} />;

export { Progress } from "./progress";
