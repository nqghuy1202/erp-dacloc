"use client";
// Điều khiển dựng trên Astryx cho vùng văn phòng. Hiện trường dùng src/components/field/{ui,client}.tsx (nhẹ).
import { useRef, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Moon, Sun, X } from "lucide-react";
import { Button as AxButton } from "@astryxdesign/core/Button";
import { IconButton } from "@astryxdesign/core/IconButton";
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

/** Sheet bên phải (desktop) / toàn màn (mobile) bằng <dialog> native */
export function Sheet({ trigger, title, children, variant = "primary", triggerClass }: { trigger: ReactNode; title: string; children: (close: () => void) => ReactNode; variant?: "primary" | "secondary"; triggerClass?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const close = () => { ref.current?.close(); setOpen(false); };
  return (
    <>
      <AxButton label={textOf(trigger) || title} variant={variant} onClick={() => { setOpen(true); ref.current?.showModal(); }} className={triggerClass}>
        {typeof trigger === "string" ? undefined : trigger}
      </AxButton>
      <dialog ref={ref} onClose={() => setOpen(false)} className="m-0 ml-auto h-full max-h-none w-full max-w-[520px] bg-surface p-0 text-fg shadow-xl sm:rounded-l-card">
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-2 border-b border-line px-6 py-4">
            <h2 className="text-lg font-semibold">{title}</h2>
            <IconButton label="Đóng" icon={<X size={18} aria-hidden />} variant="ghost" onClick={close} className="ml-auto" />
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-4">{open ? children(close) : null}</div>
        </div>
      </dialog>
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

