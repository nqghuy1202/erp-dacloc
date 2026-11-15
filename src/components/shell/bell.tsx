import Link from "next/link";
import { Bell as BellIcon } from "lucide-react";

/** Cảnh báo khẩn: số trên chuông (design-spec §0b.6). `label` đã dịch, vd "3 thông báo chưa đọc". */
export function Bell({ count, label, href = "/thong-bao" }: { count: number; label: string; href?: string }) {
  return (
    <Link href={href} aria-label={label} title={label} className="relative grid h-11 w-11 shrink-0 place-items-center rounded-ctl text-fg hover:bg-[var(--color-overlay-hover)]">
      <BellIcon size={20} aria-hidden />
      {count > 0 ? <span aria-hidden className="num absolute right-0.5 top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-bad-fill px-1 text-[11px] font-bold text-white">{count > 99 ? "99+" : count}</span> : null}
    </Link>
  );
}
