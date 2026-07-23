import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Link } from "react-router-dom";
import { ApiError } from "@/lib/api/apiError";
import { ROUTES } from "@/lib/constants/routes";
import { createAuthSchemas } from "@/lib/validation/authSchemas";
import { confirmPasswordReset } from "@/lib/services/authService";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Button } from "@/components/ui/Button";

type ResetValues = z.input<ReturnType<typeof createAuthSchemas>["resetPassword"]>;

export function ResetPasswordForm({ uid, token }: { uid: string; token: string }) {
  const { t, language } = useTranslation();
  const schema = useMemo(() => createAuthSchemas(t.validation).resetPassword, [t]);
  const [complete, setComplete] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    trigger,
    watch,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm<ResetValues>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    reValidateMode: "onChange",
  });
  const password = watch("password");

  useEffect(() => {
    if (dirtyFields.confirmPassword) void trigger("confirmPassword");
  }, [dirtyFields.confirmPassword, password, trigger]);

  async function onSubmit(values: ResetValues) {
    setServerError(null);
    try {
      await confirmPasswordReset({
        uid,
        token,
        password: values.password,
        confirmPassword: values.confirmPassword,
      });
      setComplete(true);
    } catch (caught) {
      if (caught instanceof ApiError && caught.code === "invalid_reset_token") {
        setServerError(t.resetPassword.invalidExpired);
        return;
      }
      if (caught instanceof ApiError) {
        const passwordError = caught.fields?.password?.[0];
        const confirmationError = caught.fields?.password_confirm?.[0];
        if (passwordError) {
          setError("password", {
            message: language === "fa" ? t.resetPassword.weakPassword : passwordError,
          }, { shouldFocus: true });
        }
        if (confirmationError) {
          setError("confirmPassword", {
            message: language === "fa" ? t.validation.passwordMismatch : confirmationError,
          });
        }
        if (passwordError || confirmationError) return;
      }
      setServerError(t.resetPassword.requestFailed);
    }
  }

  if (complete) {
    return (
      <div className="space-y-5 text-center" role="status">
        <h2 className="text-xl font-semibold">{t.resetPassword.successTitle}</h2>
        <p className="text-sm text-zinc-400">{t.resetPassword.successMessage}</p>
        <Link
          to={ROUTES.LOGIN}
          className="inline-flex min-h-11 items-center rounded-lg bg-green-600 px-5 py-2 font-medium text-white hover:bg-green-700"
        >
          {t.resetPassword.toLogin}
        </Link>
      </div>
    );
  }

  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={handleSubmit(onSubmit, (formErrors) => {
        setFocus(formErrors.password ? "password" : "confirmPassword");
      })}
    >
      {serverError && (
        <p role="alert" className="rounded-lg bg-red-950/30 p-3 text-sm text-red-400">
          {serverError}
        </p>
      )}
      <PasswordInput
        label={t.resetPassword.passwordLabel}
        autoComplete="new-password"
        error={errors.password?.message}
        {...register("password")}
      />
      <PasswordInput
        label={t.resetPassword.confirmPasswordLabel}
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? t.resetPassword.submitting : t.resetPassword.submit}
      </Button>
    </form>
  );
}
