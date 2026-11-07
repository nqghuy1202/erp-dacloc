import { redirect } from "next/navigation";
import { Fish } from "lucide-react";
import { getActor, getT, homeFor } from "@/lib/session";
import { LoginForm } from "./form";

export const metadata = { title: "Đăng nhập" };

export default async function LoginPage() {
  const actor = await getActor();
  if (actor) redirect(homeFor(actor));
  const { t } = await getT();
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-ctl bg-brand text-white"><Fish size={22} /></span>
          <div><div className="text-lg font-semibold">{t("appName")}</div><div className="text-[13px] text-fg-2">Khu sản xuất giống thủy sản công nghệ cao</div></div>
        </div>
        <LoginForm labels={{ title: t("login.title"), empCode: t("login.empCode"), password: t("login.password"), submit: t("login.submit") }} />
      </div>
    </main>
  );
}
