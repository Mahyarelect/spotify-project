import { Link, useSearchParams } from "react-router-dom";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { ROUTES } from "@/lib/constants/routes";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const uid = params.get("uid")?.trim() ?? "";
  const token = params.get("token")?.trim() ?? "";

  return (
    <>
      <h1 className="mb-6 text-center text-2xl font-bold">{t.resetPassword.title}</h1>
      {uid && token ? (
        <ResetPasswordForm uid={uid} token={token} />
      ) : (
        <div className="space-y-5 text-center">
          <p role="alert" className="text-sm text-red-400">{t.resetPassword.missingLink}</p>
          <Link to={ROUTES.FORGOT_PASSWORD} className="inline-flex min-h-11 items-center text-green-500 hover:underline">
            {t.resetPassword.requestAnother}
          </Link>
        </div>
      )}
    </>
  );
}
