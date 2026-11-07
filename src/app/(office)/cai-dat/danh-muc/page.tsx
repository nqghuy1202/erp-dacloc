import { db } from "@/lib/db/client";
import { fmtNum } from "@/lib/i18n";
import { getT, requireActor } from "@/lib/session";
import { farmsWithTankCount, materialsAll, speciesCatalog } from "@/server/queries-admin";
import { Badge, Card, CardBody, CardHeader, Empty, PageHeader, Table } from "@/components/ui";
import { BannedToggle, FarmSheet, ImportForm } from "./forms";
import { createFarmAction, importMaterialsAction, importTanksAction, setBannedAction } from "./actions";

export const metadata = { title: "Danh mục" };
export const dynamic = "force-dynamic";

const GROUP: Record<string, string> = { feed: "Thức ăn", chemical: "Hoá chất", drug: "Thuốc", probiotic: "Vi sinh", other: "Khác" };
const PARAMS: [string, string][] = [["ph", "pH"], ["temp", "Nhiệt độ °C"], ["salinity", "Độ mặn ‰"], ["do", "DO mg/L"]];

export default async function CatalogPage() {
  await requireActor(["admin"]);
  const { locale } = await getT();
  const [farms, mats, catalog] = await Promise.all([farmsWithTankCount(db), materialsAll(db), speciesCatalog(db)]);
  const tankTotal = farms.reduce((a, f) => a + f.tanks, 0);
  const range = (min: number, max: number) => `${fmtNum(locale, min, 1)}–${fmtNum(locale, max, 1)}`;

  return (
    <>
      <PageHeader title="Danh mục" crumb="Cài đặt" meta={`${farms.length} trại · ${tankTotal} bể · ${mats.length} vật tư · ${catalog.length} loài`} />

      <div className="mb-4 grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader title="Trại" right={<FarmSheet action={createFarmAction} />} />
          <CardBody>
            {farms.length ? (
              <Table head={["Mã", "Tên trại", "Loại", "Số bể"]}>
                {farms.map(({ f, tanks }) => (
                  <tr key={f.id}>
                    <td className="font-medium">{f.code}</td><td>{f.name}</td>
                    <td>{f.kind === "broodstock" ? "Trại bố mẹ" : "Trại ương"}</td>
                    <td className="text-right">{fmtNum(locale, tanks)}</td>
                  </tr>
                ))}
              </Table>
            ) : <Empty title="Chưa có trại" />}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Import bể" right={<span>{fmtNum(locale, tankTotal)} bể</span>} />
          <CardBody>
            <ImportForm action={importTanksAction} columns="farmCode,code,volumeM3" primary template="/mau-import-be.csv" />
          </CardBody>
        </Card>
      </div>

      <Card className="mb-4">
        <CardHeader title="Vật tư" right={<span>{mats.filter((m) => m.banned).length} cấm dùng</span>} />
        <CardBody className="flex flex-col gap-6">
          {mats.length ? (
            <Table head={["Mã", "Tên vật tư", "Đơn vị", "Nhóm", "Tối thiểu", "Trạng thái", ""]}>
              {mats.map((m) => (
                <tr key={m.id}>
                  <td className="font-medium">{m.code}</td>
                  <td className="max-w-64 truncate" title={m.name}>{m.name}</td>
                  <td>{m.unit}</td>
                  <td>{GROUP[m.group] ?? m.group}</td>
                  <td className="text-right">{fmtNum(locale, m.minStock)} {m.unit}</td>
                  <td>{m.banned ? <Badge tone="bad">Cấm dùng</Badge> : <Badge tone="ok">Được dùng</Badge>}</td>
                  <td><div className="flex justify-end"><BannedToggle action={setBannedAction} materialId={m.id} banned={m.banned} name={m.name} /></div></td>
                </tr>
              ))}
            </Table>
          ) : <Empty title="Chưa có vật tư" />}
          <div className="border-t border-line pt-4">
            <h3 className="mb-3 text-[13px] font-semibold">Import vật tư</h3>
            <ImportForm action={importMaterialsAction} columns="code,name,unit,group,minStock,banned" />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Loài & giai đoạn" />
        <CardBody className="flex flex-col gap-6">
          {catalog.length ? catalog.map(({ species: s, stages }) => (
            <section key={s.id} aria-label={s.nameVi}>
              <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                <h3 className="text-[15px] font-semibold">{locale === "en" ? s.nameEn : s.nameVi}</h3>
                <span className="num text-[13px] text-fg-2">
                  Tỷ lệ sống chuẩn {fmtNum(locale, s.standardSurvival * 100)}% · PCR hiệu lực {s.pcrValidDays} ngày · {s.requiredDiseases.join(", ") || "—"}
                </span>
              </div>
              {stages.length ? (
                <Table head={["#", "Giai đoạn", "Số ngày", ...PARAMS.map((p) => p[1]), "Hao hụt tối đa"]}>
                  {stages.map(({ stage: st, thresholds }) => (
                    <tr key={st.id}>
                      <td className="text-right">{st.seq}</td>
                      <td className="font-medium">{st.name}{st.seq === s.harvestMinStageSeq ? <Badge tone="acc" className="ml-2">Thu từ đây</Badge> : null}</td>
                      <td className="text-right">{st.days}</td>
                      {PARAMS.map(([k]) => {
                        const t = thresholds.find((x) => x.param === k);
                        return <td key={k} className="text-right">{t ? range(t.min, t.max) : "—"}</td>;
                      })}
                      <td className="text-right">{fmtNum(locale, st.lossLimitPct)}%</td>
                    </tr>
                  ))}
                </Table>
              ) : <Empty title="Chưa có giai đoạn" />}
            </section>
          )) : <Empty title="Chưa có loài" />}
        </CardBody>
      </Card>
    </>
  );
}
