"use client";
import { useEffect } from "react";

export default function OfficeError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-card border border-line bg-surface p-6">
      <div className="text-[15px] font-semibold">Không tải được dữ liệu</div>
      <div className="text-[13px] text-fg-2">Kiểm tra kết nối rồi thử lại. Mã lỗi: {error.digest ?? "—"}</div>
      <button type="button" onClick={reset} className="min-h-10 rounded-ctl border border-accent bg-accent px-4 font-medium text-accent-fg">Thử lại</button>
    </div>
  );
}
