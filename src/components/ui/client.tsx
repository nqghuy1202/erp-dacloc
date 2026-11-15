"use client";
// Điều khiển dựng trên Astryx cho vùng văn phòng. Hiện trường dùng src/components/field/{ui,client}.tsx (nhẹ).
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Moon, RotateCcw, Sun } from "lucide-react";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Button as AxButton } from "@astryxdesign/core/Button";
import { IconButton } from "@astryxdesign/core/IconButton";
import { AlertDialog } from "@astryxdesign/core/AlertDialog";
import { Drawer, DrawerHeader } from "@astryxdesign/core/Drawer";
import { useEffectiveDark, useThemeMode } from "@/components/theme-mode";
import { textOf } from "./text";

export { ActionForm, Toaster, toast, type ActionState } from "./form";

export function Submit({ children, variant = "primary", className, disabled }: { children: ReactNode; variant?: "primary" | "secondary" | "danger"; className?: string; disabled?: boolean }) {
  const { pending } = useFormStatus();
  const v = variant === "danger" ? "destructive" : variant;
  return (
    <AxButton type="submit" label={textOf(children)} variant={v} isLoading={pending} isDisabled={disabled} className={className}
      width={className?.includes("w-full") ? "100%" : undefined}>
      {typeof children === "string" ? undefined : children}
    </AxButton>
  );
}

/**
 * Nút gửi cho hành động KHÔNG đảo được (design-spec 12 §3): bấm → AlertDialog nêu hậu quả bằng số → xác nhận mới gửi form.
 * Dùng trong form (ActionForm); kiểm ô bắt buộc trước khi mở hộp; hộp đóng khi server trả kết quả (lỗi hiện dưới form).
 */
export function ConfirmSubmit({ children, title, description, actionLabel, variant = "primary", className, disabled }: {
  children: ReactNode; title: string; description: string; actionLabel?: string; variant?: "primary" | "danger"; className?: string; disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const anchor = useRef<HTMLSpanElement>(null);
  const { pending } = useFormStatus();
  const was = useRef(false);
  useEffect(() => { if (was.current && !pending) setOpen(false); was.current = pending; }, [pending]);
  const form = () => anchor.current?.closest("form") ?? null;
  const ask = () => { const f = form(); if (f && !f.checkValidity()) { f.reportValidity(); return; } setOpen(true); };
  return (
    <>
      <span ref={anchor} hidden />
      <AxButton label={textOf(children)} variant={variant === "danger" ? "destructive" : "primary"} isDisabled={disabled} onClick={ask} className={className}
        width={className?.includes("w-full") ? "100%" : undefined}>
        {typeof children === "string" ? undefined : children}
      </AxButton>
      <AlertDialog isOpen={open} onOpenChange={(o) => { if (!pending) setOpen(o); }} title={title} description={description}
        actionLabel={actionLabel ?? textOf(children)} cancelLabel="Quay lại" actionVariant={variant === "danger" ? "destructive" : "primary"}
        isActionLoading={pending} onAction={() => form()?.requestSubmit()} />
    </>
  );
}

/** Sheet = Astryx Drawer bên phải (desktop) / gần toàn màn (mobile), purpose "form": bấm ra ngoài không mất dữ liệu đã nhập.
 *  Nội dung chỉ dựng khi mở (form mới mỗi lần mở — giữ hành vi cũ). */
export function Sheet({ trigger, title, children, variant = "primary", triggerClass }: { trigger: ReactNode; title: string; children: (close: () => void) => ReactNode; variant?: "primary" | "secondary"; triggerClass?: string }) {
  const [open, setOpen] = useState(false);
  const [n, setN] = useState(0); // tăng mỗi lần mở → form mới (giữ nội dung trong lúc đóng để Drawer chạy hiệu ứng thoát)
  const close = () => setOpen(false);
  return (
    <>
      <AxButton label={textOf(trigger) || title} variant={variant} onClick={() => { setN((x) => x + 1); setOpen(true); }} className={triggerClass}>
        {typeof trigger === "string" ? undefined : trigger}
      </AxButton>
      <Drawer isOpen={open} onOpenChange={setOpen} label={title} width={520} purpose="form" experimental={{ isFullWidthOnMobile: true }}>
        <DrawerHeader title={title} onOpenChange={setOpen} hasDivider />
        <div key={n} className="py-4">{n > 0 ? children(close) : null}</div>
      </Drawer>
    </>
  );
}

/** Nút icon đổi sáng/tối cho thanh header; nhãn nêu hành động sẽ xảy ra. Chưa chọn thì theo hệ điều hành. */
export function ThemeIconButton({ toDark, toLight }: { toDark: string; toLight: string }) {
  const { setMode } = useThemeMode();
  const dark = useEffectiveDark();
  const label = dark ? toLight : toDark;
  return <IconButton label={label} tooltip={label} variant="ghost" size="lg" icon={dark ? <Sun size={20} aria-hidden /> : <Moon size={20} aria-hidden />} onClick={() => setMode(dark ? "light" : "dark")} />;
}


/** Ma trận trạng thái — lỗi tải: thông báo + Thử lại (dùng trong các error.tsx của vùng văn phòng). */
export function ErrorState({ reset, digest }: { reset: () => void; digest?: string }) {
  return (
    <div role="alert" className="rounded-card border border-line bg-surface py-8">
      <EmptyState title="Không tải được dữ liệu" description={`Kiểm tra kết nối rồi thử lại.${digest ? ` Mã lỗi: ${digest}` : ""}`} isCompact
        actions={<AxButton label="Thử lại" variant="primary" icon={<RotateCcw size={16} aria-hidden />} onClick={reset} />} />
    </div>
  );
}
