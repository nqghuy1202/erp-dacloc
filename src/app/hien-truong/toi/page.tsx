import Link from "next/link";
import { LogOut, Monitor } from "lucide-react";
import { getT, requireActor } from "@/lib/session";
import { ROLE_LABEL } from "@/components/status";
import { ThemeToggle } from "@/components/ui/client";
import { FieldTop } from "@/components/field/top";
import { logout, setLocale } from "../../actions";

export default async function MePage() {
  const actor = await requireActor(["worker", "farm_lead"]);
  const { t, locale } = await getT();
  return (
    <>
      <FieldTop title={actor.name} sub={`${ROLE_LABEL[actor.role]} · ${actor.empCode}`} />
      <div className="flex flex-col gap-4 p-4">
        {actor.role === "farm_lead" ? (
          <div className="flex flex-col gap-2 rounded-[14px] border border-line bg-surface p-4">
            <div className="text-sm font-semibold text-fg-2">Trại của tôi</div>
            <Link href="/san-xuat/trai" className="flex min-h-12 items-center gap-2 font-medium"><Monitor size={18} />Lưới bể & lô</Link>
            <Link href="/kho/yeu-cau" className="flex min-h-12 items-center gap-2 font-medium"><Monitor size={18} />Yêu cầu vật tư</Link>
          </div>
        ) : null}
        <div className="flex flex-col gap-3 rounded-[14px] border border-line bg-surface p-4">
          <div className="text-sm font-semibold text-fg-2">{t("common.language")}</div>
          <form action={setLocale} className="grid grid-cols-2 gap-2">
            {(["vi", "en"] as const).map((l) => (
              <button key={l} name="locale" value={l} aria-pressed={locale === l} className={`min-h-12 rounded-xl border font-semibold ${locale === l ? "border-2 border-accent bg-accent-soft text-accent-ink" : "border-line"}`}>{l === "vi" ? "Tiếng Việt" : "English"}</button>
            ))}
          </form>
          <ThemeToggle labels={[t("common.light"), t("common.dark")]} />
        </div>
        <form action={logout}><button className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-line bg-surface font-semibold"><LogOut size={18} />{t("common.logout")}</button></form>
      </div>
    </>
  );
}
