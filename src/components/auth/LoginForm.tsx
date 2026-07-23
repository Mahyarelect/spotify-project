import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createAuthSchemas } from "@/lib/validation/authSchemas";
import { useAuth } from "@/lib/hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Button } from "@/components/ui/Button";
import { useMemo, useState } from "react";
import { ROLE_HOME_ROUTE } from "@/lib/constants/routes";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { ApiError } from "@/lib/api/apiError";

export function LoginForm() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");
  const [invalidSubmit, setInvalidSubmit] = useState(false);
  const schema = useMemo(() => createAuthSchemas(t.validation).login, [t]);

  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<{ email: string; password: string }>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: { email: string; password: string }) => {
    setServerError("");
    setInvalidSubmit(false);
    try {
      const { role } = await login(data.email, data.password);
      navigate(ROLE_HOME_ROUTE[role as keyof typeof ROLE_HOME_ROUTE] ?? "/", { replace: true });
    } catch (error) {
      if (error instanceof ApiError && error.code !== "invalid_credentials") {
        setServerError(error.message);
      } else {
        setServerError(t.login.invalidCredentials);
      }
    }
  };

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit, (formErrors) => {
        setInvalidSubmit(true);
        setFocus(formErrors.email ? "email" : "password");
      })}
      className="space-y-4"
    >
      {invalidSubmit && Object.keys(errors).length > 0 && (
        <p role="alert" className="rounded-lg bg-red-950/30 p-3 text-sm text-red-400">
          {t.validation.formSummary}
        </p>
      )}
      {serverError && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
          {serverError}
        </div>
      )}
      <Input label={t.login.emailLabel} type="email" placeholder={t.login.emailPlaceholder} error={errors.email?.message} {...register("email")} />
      <PasswordInput label={t.login.passwordLabel} placeholder={t.login.passwordPlaceholder} error={errors.password?.message} autoComplete="current-password" {...register("password")} />
      <div className="text-right">
        <Link to="/forgot-password" className="text-sm text-green-600 hover:underline">
          {t.login.forgotPassword}
        </Link>
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? t.login.submitting : t.login.submit}
      </Button>
      <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
        {t.login.noAccount}{" "}
        <Link to="/register" className="text-green-600 hover:underline">{t.login.register}</Link>
      </p>
      <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
        {t.login.artistRegisterPrompt}{" "}
        <Link to="/register-artist" className="text-green-600 hover:underline">{t.login.registerAsArtist}</Link>?
      </p>
    </form>
  );
}
