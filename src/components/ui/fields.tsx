"use client";
import { createContext, useContext, useEffect, useId, useRef, useState, type ChangeEvent, type ComponentProps, type ReactNode } from "react";
import { TextInput } from "@astryxdesign/core/TextInput";
import { TextArea } from "@astryxdesign/core/TextArea";
import { Selector } from "@astryxdesign/core/Selector";
import { cn } from "./cn";
import { readOptions } from "./options";

// Ô nhập dùng chung trên Astryx (design-spec 12 §3, v5) — GIỮ API cũ (name/defaultValue/value/onChange kiểu sự kiện)
// để form server action không phải đổi: giá trị gửi qua `htmlName` (Astryx render input/hidden input có name).
// Ngày/số/giờ/tệp giữ ô native: bàn phím số + lịch hệ điều hành tốt hơn trên điện thoại, và ràng buộc min/max/step của trình duyệt.

type Ctx = { label: string; describedBy?: string; invalid?: boolean };
const FieldCtx = createContext<Ctx | null>(null);

/** Nhãn + gợi ý/lỗi cho đúng một ô bên trong. Nhãn hiển thị ở đây; ô Astryx nhận cùng nhãn (ẩn) làm tên trợ năng. */
export function Field({ label, children, hint, error }: { label: string; children: ReactNode; hint?: ReactNode; error?: string }) {
  const id = useId();
  const note = error || hint ? `${id}-note` : undefined;
  return (
    <FieldCtx.Provider value={{ label, describedBy: note, invalid: !!error }}>
      <div className="flex flex-col gap-1.5">
        <span aria-hidden className="text-[13px] font-semibold text-fg">{label}</span>
        {children}
        {error ? <span id={note} className="text-xs font-medium text-bad">{error}</span> : hint ? <span id={note} className="text-xs text-fg-2">{hint}</span> : null}
      </div>
    </FieldCtx.Provider>
  );
}

/** Nhãn trợ năng: theo Field, rồi aria-label, rồi placeholder. */
function useLabel(p: { "aria-label"?: string; placeholder?: string; name?: string }) {
  const ctx = useContext(FieldCtx);
  return { ctx, label: ctx?.label ?? p["aria-label"] ?? p.placeholder ?? p.name ?? "" };
}

/** Giữ giá trị cho ô không kiểm soát và trả về giá trị ban đầu khi form bị reset (ActionForm reset sau khi lưu). */
function useUncontrolled(initial: string) {
  const [v, setV] = useState(initial);
  const anchor = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const form = anchor.current?.closest("form");
    if (!form) return;
    const reset = () => setV(initial);
    form.addEventListener("reset", reset);
    return () => form.removeEventListener("reset", reset);
  }, [initial]);
  return { v, setV, anchor: <span ref={anchor} hidden /> };
}

/** Gọi onChange kiểu sự kiện cũ (`e.target.value`) từ callback giá trị của Astryx. */
const fakeEvent = <T,>(value: string) => ({ target: { value }, currentTarget: { value } }) as unknown as ChangeEvent<T>;

const NATIVE = new Set(["date", "number", "time", "file", "datetime-local", "month", "hidden", "checkbox", "radio"]);
const FIELD = "min-h-10 w-full rounded-ctl border border-line-strong bg-surface px-3 text-fg placeholder:text-fg-2 hover:border-fg-2 focus-visible:border-accent disabled:opacity-60 aria-[invalid=true]:border-bad";
const TEXT_TYPES = new Set(["text", "password", "email", "search", "tel", "url"]);

export function Input(p: ComponentProps<"input">) {
  const { ctx, label } = useLabel(p);
  const type = p.type ?? "text";
  const { v, setV, anchor } = useUncontrolled(p.defaultValue == null ? "" : String(p.defaultValue));
  if (NATIVE.has(type) || !TEXT_TYPES.has(type)) {
    return <input {...p} aria-label={p["aria-label"] ?? ctx?.label} aria-describedby={ctx?.describedBy} aria-invalid={p["aria-invalid"] ?? (ctx?.invalid || undefined)} className={cn(FIELD, p.className)} />;
  }
  const controlled = p.value !== undefined;
  const { name, required, maxLength, minLength, pattern, autoComplete, autoCapitalize, inputMode, placeholder, disabled, readOnly, className, onChange, id } = p;
  // thuộc tính native (maxLength/pattern/required…) đi qua rest props tới thẻ <input> của Astryx → trình duyệt vẫn kiểm tra
  const native = { required, maxLength, minLength, pattern, autoComplete, id, "aria-describedby": ctx?.describedBy } as Record<string, unknown>;
  return (
    <>
      {anchor}
      <TextInput label={label} isLabelHidden type={type as "text"} value={controlled ? String(p.value ?? "") : v} htmlName={name}
        onChange={(val) => { if (!controlled) setV(val); onChange?.(fakeEvent<HTMLInputElement>(val)); }}
        isRequired={!!required} isDisabled={disabled} isReadOnly={readOnly} placeholder={placeholder} inputMode={inputMode}
        autoCapitalize={autoCapitalize as "off"} status={ctx?.invalid || p["aria-invalid"] ? { type: "error" } : undefined}
        width="100%" controlClassName={cn(className?.includes("text-right") && "[&_input]:text-right", className?.includes("uppercase") && "[&_input]:uppercase")}
        {...native} />
    </>
  );
}

export function Textarea(p: ComponentProps<"textarea">) {
  const { ctx, label } = useLabel(p);
  const { v, setV, anchor } = useUncontrolled(p.defaultValue == null ? "" : String(p.defaultValue));
  const controlled = p.value !== undefined;
  return (
    <>
      {anchor}
      <TextArea label={label} isLabelHidden value={controlled ? String(p.value ?? "") : v} htmlName={p.name}
        onChange={(val) => { if (!controlled) setV(val); p.onChange?.(fakeEvent<HTMLTextAreaElement>(val)); }}
        isRequired={!!p.required} isDisabled={p.disabled} placeholder={p.placeholder} rows={p.rows}
        maxLength={p.maxLength} htmlMaxLength={p.maxLength} status={ctx?.invalid ? { type: "error" } : undefined}
        aria-describedby={ctx?.describedBy} />
    </>
  );
}

export function Select(p: ComponentProps<"select">) {
  const { ctx, label } = useLabel(p);
  const { options, placeholder, count } = readOptions(p.children, !!p.required);
  const { v, setV, anchor } = useUncontrolled(p.defaultValue == null ? "" : String(p.defaultValue));
  const controlled = p.value !== undefined;
  const value = controlled ? String(p.value ?? "") : v;
  return (
    <>
      {anchor}
      <Selector label={label} isLabelHidden options={options as never} value={value === "" && placeholder !== undefined && !options.some((o) => !("type" in o) && o.value === "") ? undefined : value}
        placeholder={placeholder ?? "Chọn…"} htmlName={p.name} hasSearch={count > 8} searchPlaceholder="Tìm…" emptySearchText="Không có kết quả"
        onChange={(val) => { const s = val == null ? "" : String(val); if (!controlled) setV(s); p.onChange?.(fakeEvent<HTMLSelectElement>(s)); }}
        isRequired={!!p.required} isDisabled={p.disabled} presentation="adaptive"
        status={ctx?.invalid ? { type: "error" } : undefined} width="100%" containerClassName={p.className} />
    </>
  );
}
