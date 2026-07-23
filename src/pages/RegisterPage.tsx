import { RegisterForm } from "@/components/auth/RegisterForm";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function RegisterPage() {
  const { t } = useTranslation();
  return (
    <>
      <h1 className="text-2xl font-bold text-center mb-6">{t.register.title}</h1>
      <RegisterForm />
    </>
  );
}
