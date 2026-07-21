import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema } from "@/lib/validation/authSchemas";
import * as authService from "@/lib/services/authService";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/lib/i18n/useTranslation";

export function ForgotPasswordForm() {
  const { t } = useTranslation();
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState("");
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async (data: { email: string }) => {
    setServerError("");
    try {
      const res = await authService.forgotPassword(data.email);
      setMessage(res.message);
      setSubmitted(true);
    } catch {
      setServerError("Unable to request a reset link. Please try again.");
    }
  };

  if (submitted) {
    return (
      <div className="text-center space-y-4 py-8">
        <div className="text-4xl">📧</div>
        <h2 className="text-xl font-semibold dark:text-white">{t.forgotPassword.checkEmailTitle}</h2>
        <p className="text-zinc-500 dark:text-zinc-400">{message}</p>
        <Link to="/login" className="inline-block text-green-600 hover:underline">{t.forgotPassword.signIn}</Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {serverError && <p className="text-sm text-red-500">{serverError}</p>}
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{t.forgotPassword.instruction}</p>
      <Input label={t.forgotPassword.emailLabel} type="email" placeholder={t.forgotPassword.emailPlaceholder} error={errors.email?.message} {...register("email")} />
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? t.forgotPassword.sending : t.forgotPassword.submit}
      </Button>
      <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
        {t.forgotPassword.rememberPassword}{" "}
        <Link to="/login" className="text-green-600 hover:underline">{t.forgotPassword.signIn}</Link>
      </p>
    </form>
  );
}
