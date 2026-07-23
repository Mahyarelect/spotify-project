import { LoginForm } from "@/components/auth/LoginForm";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function LoginPage() {
  const { t } = useTranslation();
  return (
    <>
      <h1 className="text-2xl font-bold text-center mb-6">{t.login.title}</h1>
      <LoginForm />
    </>
  );
}
