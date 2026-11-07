import Link from "next/link";
import { Bell as BellIcon } from "lucide-react";

/** Cảnh báo khẩn: số trên chuông (design-spec §0b.6) */
export function Bell({ count, href = "/thong-bao" }: { count: number; href?: string }) {
  return (
    <Link href={href} aria-label={`${count} thông báo chưa đọc`} className="relative ml-auto grid h-10 w-10 shrink-0 place-items-center rounded-ctl border border-line bg-surface text-fg">
      <BellIcon size={18} />
      {count > 0 ? <span className="num absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-bad px-1 text-[11px] font-bold text-white">{count > 99 ? "99+" : count}</span> : null}
    </Link>
  );
}
