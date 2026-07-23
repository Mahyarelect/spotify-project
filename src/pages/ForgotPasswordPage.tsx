import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  return (
    <>
      <h1 className="text-2xl font-bold text-center mb-6">{t.forgotPassword.title}</h1>
      <ForgotPasswordForm />
    </>
  );
}
