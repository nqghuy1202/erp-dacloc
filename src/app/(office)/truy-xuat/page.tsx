import { redirect } from "next/navigation";
import { requireActor } from "@/lib/session";
import { Card, CardBody, PageHeader } from "@/components/ui";
import { TraceSearch } from "./search-form";

export const metadata = { title: "Truy xuất" };
export const dynamic = "force-dynamic";

/** Nhận mã lô, token, hoặc nguyên URL QR (…/truy-xuat/<token>) */
function keyOf(q: string) {
  const s = q.trim();
  const m = s.match(/\/truy-xuat\/([^/?#\s]+)/);
  let k = m ? m[1] : s;
  try { k = decodeURIComponent(k); } catch { /* giữ nguyên chuỗi gõ vào */ }
  return k.slice(0, 200);
}

export default async function TraceSearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireActor();
  const q = (await searchParams).q;
  const key = q ? keyOf(q) : "";
  if (key) redirect(`/truy-xuat/${encodeURIComponent(key)}`);
  return (
    <>
      <PageHeader title="Truy xuất" />
      <Card><CardBody><TraceSearch autoFocus /></CardBody></Card>
    </>
  );
}
