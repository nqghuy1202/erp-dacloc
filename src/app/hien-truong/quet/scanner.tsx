"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Camera, Flashlight } from "lucide-react";

type Detector = { detect: (s: CanvasImageSource) => Promise<{ rawValue: string }[]> };

/** Quét QR bể (→ M2) hoặc QR lô (→ S14). Không có camera/BarcodeDetector → nhập mã tay (ma trận M5). */
export function Scanner({ resolveUrl }: { resolveUrl: string }) {
  const router = useRouter();
  const video = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<"idle" | "starting" | "on" | "denied" | "unsupported">("idle");
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [torch, setTorch] = useState(false);
  const stream = useRef<MediaStream | null>(null);

  async function go(raw: string) {
    const v = raw.trim();
    if (!v) return;
    const m = v.match(/\/truy-xuat\/([\w-]+)/);
    if (m) return router.push(`/truy-xuat/${m[1]}`);
    const r = await fetch(`${resolveUrl}?code=${encodeURIComponent(v)}`);
    const j = (await r.json()) as { href?: string };
    if (j.href) router.push(j.href); else setErr("Mã không thuộc hệ thống");
  }

  async function start() {
    const BD = (window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => Detector }).BarcodeDetector;
    if (!BD || !navigator.mediaDevices?.getUserMedia) { setState("unsupported"); return; }
    setState("starting");
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (video.current) { video.current.srcObject = stream.current; await video.current.play(); }
      setState("on");
      const det = new BD({ formats: ["qr_code"] });
      const tick = async () => {
        if (!video.current || !stream.current) return;
        try { const r = await det.detect(video.current); if (r[0]) { stop(); return go(r[0].rawValue); } } catch { /* khung lỗi, thử tiếp */ }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    } catch { setState("denied"); }
  }
  function stop() { stream.current?.getTracks().forEach((t) => t.stop()); stream.current = null; }
  useEffect(() => stop, []);
  async function toggleTorch() {
    const track = stream.current?.getVideoTracks()[0];
    try { await track?.applyConstraints({ advanced: [{ torch: !torch } as MediaTrackConstraintSet] }); setTorch(!torch); } catch { /* máy không hỗ trợ */ }
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="relative grid aspect-square w-full place-items-center overflow-hidden rounded-[14px] bg-surface-2">
        <video ref={video} playsInline muted className={state === "on" ? "h-full w-full object-cover" : "hidden"} />
        {state !== "on" ? (
          <button type="button" onClick={start} className="flex min-h-14 items-center gap-2 rounded-[14px] bg-accent px-6 text-base font-bold text-accent-fg">
            <Camera />{state === "starting" ? "Đang mở camera" : "Quét"}
          </button>
        ) : (
          <button type="button" onClick={toggleTorch} aria-pressed={torch} aria-label="Bật đèn" className="absolute bottom-3 right-3 grid h-12 w-12 place-items-center rounded-full bg-surface"><Flashlight /></button>
        )}
      </div>
      {state === "denied" ? <p role="alert" className="rounded-xl bg-warn-soft p-3 text-sm text-warn-ink">Không có quyền camera · nhập mã bên dưới</p> : null}
      {state === "unsupported" ? <p className="rounded-xl bg-surface-2 p-3 text-sm text-fg-2">Máy chưa hỗ trợ quét · nhập mã bên dưới</p> : null}
      <form onSubmit={(e) => { e.preventDefault(); setErr(""); void go(code); }} className="flex flex-col gap-2">
        <label htmlFor="code" className="text-sm font-semibold text-fg-2">Mã bể hoặc mã lô</label>
        <input id="code" value={code} onChange={(e) => setCode(e.target.value)} autoCapitalize="characters" className="min-h-14 rounded-xl border border-line bg-surface px-3 font-mono text-lg uppercase" />
        {err ? <p role="alert" className="text-sm font-semibold text-bad">{err}</p> : null}
        <button type="submit" className="min-h-12 rounded-xl border border-line bg-surface font-semibold">Mở</button>
      </form>
    </div>
  );
}
