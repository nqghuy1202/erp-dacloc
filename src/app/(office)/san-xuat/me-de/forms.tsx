"use client";
import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ActionForm, Sheet, Submit } from "@/components/ui/client";
import { Field, Input, Select, Textarea } from "@/components/ui";
import { cancelBatchAction, openLotAction } from "./actions";

type TankOpt = { id: number; code: string; farmId: number; farmName: string };
type WorkerOpt = { id: number; name: string; empCode: string; farmId: number };

const nf = new Intl.NumberFormat("vi-VN");

function OpenLotForm({ batchId, batchCode, remaining, tanks, workers, defaultTankId }: {
  batchId: number; batchCode: string; remaining: number; tanks: TankOpt[]; workers: WorkerOpt[]; defaultTankId?: number;
}) {
  const router = useRouter();
  const [tankId, setTankId] = useState<number | null>(tanks.some((t) => t.id === defaultTankId) ? defaultTankId! : null);
  const tank = tanks.find((t) => t.id === tankId) ?? null;
  const tankRef = useRef(tank);
  tankRef.current = tank;
  // Action → expectation: về S2, thẻ bể vừa mở được làm nổi
  const done = useCallback(() => {
    const t = tankRef.current;
    if (t) router.push(`/san-xuat/trai/${t.farmId}?moi=${t.id}`);
  }, [router]);
  const farmWorkers = tank ? workers.filter((w) => w.farmId === tank.farmId) : [];
  const farms = [...new Map(tanks.map((t) => [t.farmId, t.farmName])).entries()];

  return (
    <ActionForm action={openLotAction} onDone={done} resetOnSuccess={false} className="flex flex-col gap-4">
      <input type="hidden" name="batchId" value={batchId} />
      <p className="num text-[13px] text-fg-2">{batchCode} · còn {nf.format(remaining)} Nauplius</p>
      <Field label="Bể trống">
        <Select name="tankId" required value={tankId ?? ""} onChange={(e) => setTankId(Number(e.target.value) || null)}>
          <option value="" disabled>Chọn bể</option>
          {farms.map(([fid, fname]) => (
            <optgroup key={fid} label={fname}>
              {tanks.filter((t) => t.farmId === fid).map((t) => <option key={t.id} value={t.id}>{t.code}</option>)}
            </optgroup>
          ))}
        </Select>
      </Field>
      <Field label="Số thả (con)" hint={`Tối đa ${nf.format(remaining)}`}>
        <Input type="number" name="qty" inputMode="numeric" min={1} max={remaining} step={1} required className="num text-right" />
      </Field>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-[13px] font-medium text-fg-2">Công nhân phụ trách</legend>
        {!tank ? <span className="text-[13px] text-fg-2">Chọn bể trước</span>
          : farmWorkers.length ? farmWorkers.map((w) => (
            <label key={w.id} className="flex min-h-10 items-center gap-3 rounded-ctl border border-line px-3">
              <input type="checkbox" name="workerIds" value={w.id} className="h-4 w-4 accent-accent" />
              <span className="text-[14px]">{w.name}</span>
              <span className="ml-auto font-mono text-xs text-fg-2">{w.empCode}</span>
            </label>
          )) : <span className="text-[13px] font-medium text-bad">Trại {tank.farmName} chưa có công nhân</span>}
      </fieldset>
      <Field label="Dự kiến thu" hint="Bỏ trống = theo ngày chuẩn">
        <Input type="date" name="expectedHarvestAt" />
      </Field>
      <Submit className="w-full" disabled={!tank || !farmWorkers.length}>Mở lô ương</Submit>
    </ActionForm>
  );
}

export function OpenLotSheet(p: { batchId: number; batchCode: string; remaining: number; tanks: TankOpt[]; workers: WorkerOpt[]; defaultTankId?: number }) {
  return (
    <Sheet title="Mở lô ương" variant="secondary" trigger="Mở lô ương">
      {() => <OpenLotForm {...p} />}
    </Sheet>
  );
}

function CancelForm({ batchId, close }: { batchId: number; close: () => void }) {
  const ref = useRef(close);
  ref.current = close;
  const done = useCallback(() => ref.current(), []);
  return (
    <ActionForm action={cancelBatchAction} onDone={done} className="flex flex-col gap-4">
      <input type="hidden" name="batchId" value={batchId} />
      <Field label="Lý do huỷ"><Textarea name="reason" required maxLength={300} rows={3} /></Field>
      <Submit variant="danger" className="w-full">Huỷ mẻ</Submit>
    </ActionForm>
  );
}

export function CancelBatchSheet({ batchId, batchCode, remaining }: { batchId: number; batchCode: string; remaining: number }) {
  return (
    <Sheet title={`Huỷ mẻ ${batchCode} — còn ${nf.format(remaining)} Nauplius`} variant="secondary" trigger="Huỷ" triggerClass="border-transparent text-bad">
      {(close) => <CancelForm batchId={batchId} close={close} />}
    </Sheet>
  );
}
