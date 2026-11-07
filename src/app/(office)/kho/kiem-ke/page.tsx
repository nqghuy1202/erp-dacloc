import Link from "next/link";
import { db } from "@/lib/db/client";
import { fmtDate } from "@/lib/i18n";
import { getT, requireActor } from "@/lib/session";
import { countList, warehousesInScope } from "@/server/queries-admin";
import { Card, CardBody, Empty, PageHeader, Table } from "@/components/ui";
import { StatusBadge } from "@/components/status";
import { StartCountSheet } from "./forms";
import { startCountAction } from "./actions";

export const metadata = { title: "Kiểm kê" };
export const dynamic = "force-dynamic";

export default async function CountsPage() {
  const actor = await requireActor(["storekeeper", "farm_lead", "director"]);
  const { locale } = await getT();
  const canStart = actor.role === "storekeeper" || actor.role === "admin";
  const [list, whs] = await Promise.all([countList(db, actor), canStart ? warehousesInScope(db, actor) : Promise.resolve([])]);
  const pending = list.filter((x) => x.c.status === "pending_approval").length;
  const start = canStart && whs.length ? <StartCountSheet action={startCountAction} warehouses={whs.map((w) => ({ id: w.id, name: w.name }))} /> : null;

  return (
    <>
      <PageHeader title="Kiểm kê" crumb="Kho" meta={`${list.length} biên bản · ${pending} chờ duyệt`} actions={start} />
      <Card>
        <CardBody>
          {list.length ? (
            <Table head={["Mã biên bản", "Kho", "Ngày mở", "Ngày duyệt", "Trạng thái"]}>
              {list.map(({ c, warehouse }) => (
                <tr key={c.id}>
                  <td><Link href={`/kho/kiem-ke/${c.id}`} className="font-medium text-accent-ink underline-offset-2 hover:underline">{c.code}</Link></td>
                  <td>{warehouse}</td>
                  <td>{fmtDate(locale, c.createdAt)}</td>
                  <td>{fmtDate(locale, c.approvedAt)}</td>
                  <td><StatusBadge status={c.status} locale={locale} /></td>
                </tr>
              ))}
            </Table>
          ) : <Empty title="Chưa có đợt kiểm kê" />}
        </CardBody>
      </Card>
    </>
  );
}
