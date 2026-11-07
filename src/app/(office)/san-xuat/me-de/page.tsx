import { db } from "@/lib/db/client";
import { fmtDate, fmtNum } from "@/lib/i18n";
import { getT, requireActor } from "@/lib/session";
import { spawnBoard } from "@/server/queries-production";
import { Card, CardBody, CardHeader, Empty, Field, Input, LinkButton, PageHeader, Select, Table } from "@/components/ui";
import { ActionForm, Submit } from "@/components/ui/client";
import { createSpawnAction } from "./actions";
import { CancelBatchSheet, OpenLotSheet } from "./forms";

export const metadata = { title: "Mẻ đẻ" };
export const dynamic = "force-dynamic";

export default async function SpawnPage({ searchParams }: { searchParams: Promise<{ be?: string }> }) {
  const actor = await requireActor(["farm_lead", "director"]);
  const { locale } = await getT();
  const sp = await searchParams;
  const defaultTankId = Number(sp.be) || undefined;
  const { ready, batches, emptyTanks, workers } = await spawnBoard(db, actor);
  const isLead = actor.role === "farm_lead" || actor.role === "admin";

  return (
    <>
      <PageHeader title="Mẻ đẻ" meta={`${fmtNum(locale, ready.length)} đàn sẵn sàng · ${fmtNum(locale, batches.length)} mẻ đang mở`} />

      <div className="mb-4 grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader title="Đàn sẵn sàng" />
          <CardBody>
            {ready.length ? (
              <Table head={["Mã đàn", "Trại", "Dòng", <span key="f" className="block text-right">Số cái</span>, "Ngày nhận"]}>
                {ready.map(({ b, farmName }) => (
                  <tr key={b.id}>
                    <td className="font-mono font-medium">{b.code}</td>
                    <td>{farmName}</td>
                    <td>{b.line || "—"}</td>
                    <td className="text-right">{fmtNum(locale, b.females)}</td>
                    <td>{fmtDate(locale, b.receivedAt)}</td>
                  </tr>
                ))}
              </Table>
            ) : (
              <Empty title="Chưa có đàn sẵn sàng" action={<LinkButton href="/san-xuat/bo-me">Đàn bố mẹ</LinkButton>} />
            )}
          </CardBody>
        </Card>

        {isLead && ready.length ? (
          <Card>
            <CardHeader title="Tạo mẻ đẻ" />
            <CardBody>
              <ActionForm action={createSpawnAction} className="flex flex-col gap-4">
                <Field label="Đàn">
                  <Select name="broodstockId" required defaultValue={ready.length === 1 ? String(ready[0].b.id) : ""}>
                    {ready.length > 1 ? <option value="" disabled>Chọn đàn</option> : null}
                    {ready.map(({ b, farmName }) => <option key={b.id} value={b.id}>{b.code} · {farmName} · {fmtNum(locale, b.females)} cái</option>)}
                  </Select>
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Số cái cho đẻ"><Input type="number" name="femalesSpawned" inputMode="numeric" min={1} step={1} required className="num text-right" /></Field>
                  <Field label="Số Nauplius"><Input type="number" name="nauplius" inputMode="numeric" min={1} max={1_000_000_000} step={1} required className="num text-right" /></Field>
                </div>
                <Submit className="w-full">Tạo mẻ đẻ</Submit>
              </ActionForm>
            </CardBody>
          </Card>
        ) : null}
      </div>

      <Card>
        <CardHeader title="Mẻ đang mở" />
        <CardBody>
          {batches.length ? (
            <Table head={["Mã mẻ", "Đàn", "Ngày đẻ", <span key="n" className="block text-right">Nauplius</span>, <span key="r" className="block text-right">Còn lại</span>, ""]}>
              {batches.map(({ batch, broodCode, farmName }) => (
                <tr key={batch.id}>
                  <td className="font-mono font-medium">{batch.code}</td>
                  <td><span className="font-mono">{broodCode}</span><span className="ml-2 text-xs text-fg-2">{farmName}</span></td>
                  <td>{fmtDate(locale, batch.spawnedAt)}</td>
                  <td className="text-right">{fmtNum(locale, batch.nauplius)}</td>
                  <td className="text-right font-medium">{fmtNum(locale, batch.remaining)}</td>
                  <td>
                    {isLead ? (
                      <div className="flex justify-end gap-2">
                        {emptyTanks.length
                          ? <OpenLotSheet batchId={batch.id} batchCode={batch.code} remaining={batch.remaining} tanks={emptyTanks} workers={workers} defaultTankId={defaultTankId} />
                          : <span className="self-center text-xs text-fg-2">Không có bể trống</span>}
                        <CancelBatchSheet batchId={batch.id} batchCode={batch.code} remaining={batch.remaining} />
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))}
            </Table>
          ) : <Empty title="Chưa có mẻ đang mở" />}
        </CardBody>
      </Card>
    </>
  );
}
