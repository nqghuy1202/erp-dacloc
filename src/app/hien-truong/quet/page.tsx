import { requireActor } from "@/lib/session";
import { FieldTop } from "@/components/field/top";
import { Scanner } from "./scanner";

export default async function ScanPage() {
  await requireActor(["worker", "farm_lead"]);
  return (<><FieldTop title="Quét" sub="QR bể hoặc QR lô" /><Scanner resolveUrl="/api/resolve" /></>);
}
