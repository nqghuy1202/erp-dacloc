import { Search } from "lucide-react";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui/fields";

/** Ô tra mã lô / token QR — GET về /truy-xuat?q= rồi chuyển sang trang chi tiết */
export function TraceSearch({ defaultValue = "", autoFocus = false }: { defaultValue?: string; autoFocus?: boolean }) {
  return (
    <form action="/truy-xuat" method="get" role="search" className="flex w-full max-w-xl flex-wrap gap-2">
      <div className="min-w-0 flex-1">
        <Input name="q" aria-label="Mã lô thành phẩm hoặc mã QR" defaultValue={defaultValue} required maxLength={300} autoFocus={autoFocus} autoComplete="off"
          placeholder="TP-2611-ABCD hoặc mã QR" />
      </div>
      <Button type="submit" variant="primary"><Search size={16} aria-hidden />Tra cứu</Button>
    </form>
  );
}
