import { db } from "@/lib/db/client";
import { fmtDate, fmtNum } from "@/lib/i18n";
import { getT, requireActor } from "@/lib/session";
import { materialsAll, recentReceipts } from "@/server/queries-admin";
import { Card, CardBody, CardHeader, Empty, PageHeader, Table } from "@/components/ui";
import { StatusBadge } from "@/components/status";
import { ReceiptForm } from "./form";
import { saveReceipt } from "./actions";

export const metadata = { title: "Phiếu nhập" };
export const dynamic = "force-dynamic";

export default async function ReceiptsPage() {
  const actor = await requireActor(["storekeeper", "director"]);
  const { locale } = await getT();
  const canCreate = actor.role === "storekeeper" || actor.role === "admin";
  const [mats, recent] = await Promise.all([canCreate ? materialsAll(db) : Promise.resolve([]), recentReceipts(db, 20)]);

  return (
    <>
      <PageHeader title="Phiếu nhập" meta={`${recent.length} phiếu gần đây`} crumb="Kho" />

      {canCreate ? (
        <Card className="mb-4">
          <CardHeader title="Phiếu nhập mới" />
          <CardBody>
            {mats.length ? (
              <ReceiptForm action={saveReceipt} locale={locale}
                materials={mats.map((m) => ({ id: m.id, name: m.name, code: m.code, unit: m.unit, banned: m.banned }))} />
            ) : <Empty title="Chưa có danh mục vật tư" />}
          </CardBody>
        </Card>
      ) : null}

      <Card>
        <CardHeader title="Phiếu gần đây" right={<span>{recent.length} phiếu</span>} />
        <CardBody>
          {recent.length ? (
            <Table head={["Mã phiếu", "Ngày", "Nhà cung cấp", "Chứng từ", "Kho", "Số dòng", "Tổng tiền", "Trạng thái"]}>
              {recent.map(({ r, warehouse, lines, total }) => (
                <tr key={r.id}>
                  <td className="font-medium">{r.code}</td>
                  <td>{fmtDate(locale, r.createdAt)}</td>
                  <td className="max-w-56 truncate" title={r.supplier}>{r.supplier}</td>
                  <td>{r.docNo || "—"}</td>
                  <td>{warehouse}</td>
                  <td className="text-right">{fmtNum(locale, lines)}</td>
                  <td className="text-right">{fmtNum(locale, total)} đ</td>
                  <td><StatusBadge status={r.status} locale={locale} /></td>
                </tr>
              ))}
            </Table>
          ) : <Empty title="Chưa có phiếu nhập" />}
        </CardBody>
      </Card>
    </>
  );
}
