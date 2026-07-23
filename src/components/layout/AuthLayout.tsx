import { Outlet, Link } from "react-router-dom";
import { ROUTES } from "@/lib/constants/routes";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { LanguageSwitcher } from "@/components/language/LanguageSwitcher";

export function AuthLayout() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="fixed end-4 top-4 z-10">
        <LanguageSwitcher compact />
      </div>
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-10">
        <Link to={ROUTES.HOME} className="mb-8 text-center text-2xl font-bold text-green-400">
          {t.layout.appName}
        </Link>
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-xl">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
