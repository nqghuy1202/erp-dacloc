import { Search } from "lucide-react";

/** Ô tra mã lô / token QR — GET về /truy-xuat?q= rồi chuyển sang trang chi tiết */
export function TraceSearch({ defaultValue = "", autoFocus = false }: { defaultValue?: string; autoFocus?: boolean }) {
  return (
    <form action="/truy-xuat" method="get" role="search" className="flex w-full max-w-xl flex-wrap gap-2">
      <label className="min-w-0 flex-1">
        <span className="sr-only">Mã lô thành phẩm hoặc mã QR</span>
        <input name="q" defaultValue={defaultValue} required maxLength={300} autoFocus={autoFocus} autoComplete="off"
          placeholder="TP-2611-ABCD hoặc mã QR"
          className="min-h-10 w-full rounded-ctl border border-line bg-surface px-3 text-fg placeholder:text-fg-2" />
      </label>
      <button type="submit" className="inline-flex min-h-10 items-center gap-2 rounded-ctl border border-accent bg-accent px-4 font-medium text-accent-fg hover:brightness-110">
        <Search size={16} aria-hidden />Tra cứu
      </button>
    </form>
  );
}
