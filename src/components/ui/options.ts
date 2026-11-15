import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import { textOf } from "./text";

type Opt = { value: string; label: string; disabled?: boolean };
type Section = { type: "section"; title: string; options: Opt[] };
/** Đọc <option>/<optgroup> con thành options của Selector. Option rỗng đầu tiên (value="") = chữ gợi ý;
 *  ô bắt buộc (`required`) thì option rỗng KHÔNG chọn được (chỉ làm chữ gợi ý). */
export function readOptions(children: ReactNode, required = false) {
  let placeholder: string | undefined;
  const out: (Opt | Section)[] = [];
  const opt = (el: ReactElement<{ value?: string | number; disabled?: boolean; children?: ReactNode }>): Opt => ({ value: String(el.props.value ?? textOf(el.props.children)), label: textOf(el.props.children), disabled: el.props.disabled });
  Children.forEach(children, (c) => {
    if (!isValidElement(c)) return;
    if (c.type === "option") {
      const o = opt(c as never);
      if (o.value === "" && placeholder === undefined && (o.disabled || required || out.length === 0)) { placeholder = o.label; if (o.disabled || required) return; }
      out.push(o);
    } else if (c.type === "optgroup") {
      const g = c as ReactElement<{ label: string; children?: ReactNode }>;
      const opts: Opt[] = [];
      Children.forEach(g.props.children, (x) => { if (isValidElement(x) && x.type === "option") opts.push(opt(x as never)); });
      out.push({ type: "section", title: g.props.label, options: opts });
    }
  });
  const count = out.reduce((n, o) => n + ("type" in o ? o.options.length : 1), 0);
  return { options: out, placeholder, count };
}

