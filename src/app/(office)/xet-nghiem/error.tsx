"use client";
import { ErrorState } from "@/components/ui/client";

/** Ma trận trạng thái: lỗi tải → Thử lại */
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return <ErrorState reset={reset} />;
}
