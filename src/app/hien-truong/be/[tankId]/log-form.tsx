"use client";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { enqueue, flush } from "@/lib/outbox";
import { toast } from "@/components/ui/client";
import { cn } from "@/components/ui/cn";

type Kind = "feed" | "water" | "loss";
type Mat = { id: number; name: string; unit: string; group: string };
const PARAMS = [["ph", "pH", ""], ["temp", "Nhiệt độ", "°C"], ["salinity", "Độ mặn", "‰"], ["do", "DO", "mg/L"]] as const;
const LIMITS: Record<string, [number, number]> = { ph: [0, 14], temp: [0, 45], salinity: [0, 60], do: [0, 30] };
const parse = (s: string) => { const v = Number(s.replace(",", ".")); return s.trim() === "" || !Number.isFinite(v) ? null : v; };
const show = (n: number) => String(Math.round(n * 100) / 100).replace(".", ",");

export function LogForm({ tankId, taskId, initialKind, materials, thresholds, lastFeed, next, estimated }: {
  tankId: number; taskId?: number; initialKind: Kind; materials: Mat[]; thresholds: Record<string, [number, number]>;
  lastFeed: { materialId: number | null; qty: number | null; at: string; by: string } | null; next: { id: number; code: string } | null; estimated: number;
}) {
  const router = useRouter();
  const [kind, setKind] = useState<Kind>(initialKind);
  const feeds = materials.filter((m) => m.group === "feed");
  const [mat, setMat] = useState<number | undefined>(lastFeed?.materialId ?? feeds[0]?.id);
  const [qty, setQty] = useState(lastFeed?.qty ? show(lastFeed.qty) : "0,5");
  const [water, setWater] = useState<Record<string, string>>({});
  const [loss, setLoss] = useState("1");
  const [busy, setBusy] = useState(false);
  const unit = materials.find((m) => m.id === mat)?.unit ?? "kg";

  const waterState = useMemo(() => Object.fromEntries(PARAMS.map(([k]) => {
    const v = parse(water[k] ?? ""); const [lo, hi] = thresholds[k] ?? [-Infinity, Infinity]; const [pl, ph] = LIMITS[k];
    return [k, v == null ? "empty" : v < pl || v > ph ? "invalid" : v < lo || v > hi ? "out" : "ok"];
  })), [water, thresholds]);

  const step = (d: number) => setQty((q) => show(Math.max(0, Math.round(((parse(q) ?? 0) + d) * 100) / 100)));

  async function save() {
    const base = { id: crypto.randomUUID(), tankId, recordedAt: new Date().toISOString(), taskId };
    let item: Record<string, unknown>;
    if (kind === "feed") {
      const q = parse(qty);
      if (!mat || !q || q <= 0) return toast("Nhập lượng thức ăn > 0", "bad");
      item = { ...base, kind, materialId: mat, qty: q };
    } else if (kind === "water") {
      if (Object.values(waterState).includes("invalid")) return toast("Có giá trị ngoài giới hạn đo", "bad");
      const w = Object.fromEntries(PARAMS.map(([k]) => [k, parse(water[k] ?? "")]).filter(([, v]) => v != null));
      if (!Object.keys(w).length) return toast("Nhập ít nhất 1 chỉ số", "bad");
      item = { ...base, kind, water: w };
    } else {
      const l = parse(loss);
      if (l == null || l < 0 || l > 100) return toast("Hao hụt từ 0 đến 100%", "bad");
      item = { ...base, kind, lossPct: l };
    }
    setBusy(true);
    try {
      await enqueue(item as never);
      const r = await flush();
      const rej = r.rejected.find((x) => x.id === item.id);
      if (rej) { toast(rej.error === "forbidden" ? "Bể này không được giao cho bạn" : rej.error === "banned_material" ? "Vật tư cấm dùng" : "Không lưu được dòng này", "bad"); return; }
      toast(`Đã lưu · ${navigator.onLine ? "đã đồng bộ" : "chờ mạng"}`);
      if (next) router.push(`/hien-truong/be/${next.id}?loai=${kind === "water" ? "nuoc" : kind === "loss" ? "hh" : "an"}`);
      else router.push("/hien-truong");
      router.refresh();
    } finally { setBusy(false); }
  }

  const seg = (k: Kind, label: string) => (
    <button key={k} type="button" aria-pressed={kind === k} onClick={() => setKind(k)}
      className={cn("min-h-12 rounded-[10px] text-[15px] font-semibold", kind === k ? "bg-surface text-fg shadow-sm" : "text-fg-2")}>{label}</button>
  );
  const big = "min-h-14 w-full rounded-xl border border-line bg-surface px-3 text-xl font-bold text-fg num";

  return (
    <div className="flex min-h-[calc(100dvh-180px)] flex-col">
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div role="group" aria-label="Loại ghi" className="grid grid-cols-3 gap-1 rounded-xl bg-surface-2 p-1">
          {seg("feed", "Cho ăn")}{seg("water", "Nước")}{seg("loss", "Hao hụt")}
        </div>

        {kind === "feed" ? (
          <>
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-sm font-semibold text-fg-2">Thức ăn</legend>
              <div className="flex flex-wrap gap-2">
                {feeds.map((m) => (
                  <button key={m.id} type="button" aria-pressed={mat === m.id} onClick={() => setMat(m.id)}
                    className={cn("min-h-12 rounded-xl border px-4 text-[15px]", mat === m.id ? "border-2 border-accent bg-accent-soft font-semibold text-accent-ink" : "border-line bg-surface")}>{m.name}</button>
                ))}
              </div>
            </fieldset>
            <div className="flex flex-col gap-2">
              <label htmlFor="qty" className="text-sm font-semibold text-fg-2">Lượng ({unit})</label>
              <div className="grid grid-cols-[56px_1fr_56px] gap-2">
                <button type="button" onClick={() => step(-0.1)} aria-label="Giảm 0,1" className="min-h-14 rounded-xl border border-line bg-surface text-2xl">−</button>
                <input id="qty" inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} className={cn(big, "text-center")} />
                <button type="button" onClick={() => step(0.1)} aria-label="Tăng 0,1" className="min-h-14 rounded-xl border border-line bg-surface text-2xl">+</button>
              </div>
            </div>
            {lastFeed ? <p className="rounded-xl bg-surface-2 p-3 text-[13px] text-fg-2">Lần trước {new Date(lastFeed.at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} · {materials.find((m) => m.id === lastFeed.materialId)?.name} {lastFeed.qty != null ? show(lastFeed.qty) : ""} · {lastFeed.by}</p> : null}
          </>
        ) : null}

        {kind === "water" ? (
          <div className="grid grid-cols-2 gap-3">
            {PARAMS.map(([k, label, u]) => {
              const st = waterState[k]; const thr = thresholds[k];
              return (
                <div key={k} className="flex flex-col gap-1">
                  <label htmlFor={`w-${k}`} className="text-sm font-semibold text-fg-2">{label}{u ? ` ${u}` : ""}</label>
                  <input id={`w-${k}`} inputMode="decimal" value={water[k] ?? ""} onChange={(e) => setWater((w) => ({ ...w, [k]: e.target.value }))}
                    aria-invalid={st === "out" || st === "invalid"} className={cn(big, (st === "out" || st === "invalid") && "border-2 border-bad")} />
                  <span className={cn("text-xs", st === "out" || st === "invalid" ? "font-semibold text-bad" : "text-fg-2")}>
                    {st === "invalid" ? "Giá trị phi lý" : thr ? `${st === "out" ? "Ngoài ngưỡng " : ""}${show(thr[0])}–${show(thr[1])}` : ""}
                  </span>
                </div>
              );
            })}
          </div>
        ) : null}

        {kind === "loss" ? (
          <div className="flex flex-col gap-2">
            <label htmlFor="loss" className="text-sm font-semibold text-fg-2">Hao hụt ước lượng (%)</label>
            <input id="loss" inputMode="decimal" value={loss} onChange={(e) => setLoss(e.target.value)} className={cn(big, "text-center")} />
            <p className="num text-center text-sm text-fg-2">≈ {Math.round(estimated * (parse(loss) ?? 0) / 100).toLocaleString("vi-VN")} con</p>
          </div>
        ) : null}
      </div>
      <div className="sticky bottom-[calc(56px+env(safe-area-inset-bottom))] border-t border-line bg-surface p-3">
        <button type="button" onClick={save} disabled={busy} className="min-h-14 w-full rounded-[14px] bg-accent text-[17px] font-bold text-accent-fg disabled:opacity-60">
          {busy ? "Đang lưu…" : next ? `Lưu · sang ${next.code}` : "Lưu"}
        </button>
      </div>
    </div>
  );
}
