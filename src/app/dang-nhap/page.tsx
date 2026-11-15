import { redirect } from "next/navigation";
import { BrandLogo, BrandWave } from "@/components/brand";
import { getActor, getT, homeFor } from "@/lib/session";
import { LoginForm } from "./form";

export const metadata = { title: "Đăng nhập" };

export default async function LoginPage() {
  const actor = await getActor();
  if (actor) redirect(homeFor(actor));
  const { t } = await getT();
  return (
    <main className="flex min-h-dvh flex-col items-center pb-12">
      <div className="relative flex h-56 w-full justify-center pt-8">
        <BrandWave className="pointer-events-none absolute inset-0 h-full w-full" />
        <BrandLogo className="relative h-24 w-auto" />
      </div>
      <div className="w-full max-w-sm px-4">
        <div className="mb-6 text-center">
          <div className="text-lg font-semibold">{t("appName")}</div><div className="text-[13px] text-fg-2">Khu sản xuất giống thủy sản công nghệ cao</div>
        </div>
        <LoginForm labels={{ title: t("login.title"), empCode: t("login.empCode"), password: t("login.password"), submit: t("login.submit") }} />
      </div>
    </main>
  );
}
