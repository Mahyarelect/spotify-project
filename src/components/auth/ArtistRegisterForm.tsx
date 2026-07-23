import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createAuthSchemas } from "@/lib/validation/authSchemas";
import * as authService from "@/lib/services/authService";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Button } from "@/components/ui/Button";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { ApiError } from "@/lib/api/apiError";
import type { z } from "zod";

type ArtistRegisterFormValues = z.input<ReturnType<typeof createAuthSchemas>["artistRegister"]>;

export function ArtistRegisterForm() {
  const { t, language } = useTranslation();
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState("");
  const [invalidSubmit, setInvalidSubmit] = useState(false);
  const schema = useMemo(() => createAuthSchemas(t.validation).artistRegister, [t]);

  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    trigger,
    watch,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm<ArtistRegisterFormValues>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    reValidateMode: "onChange",
  });
  const password = watch("password");

  useEffect(() => {
    if (dirtyFields.confirmPassword) void trigger("confirmPassword");
  }, [dirtyFields.confirmPassword, password, trigger]);

  const onSubmit = async (data: ArtistRegisterFormValues) => {
    setServerError("");
    setInvalidSubmit(false);
    try {
      await authService.registerArtist(data);
      setSubmitted(true);
    } catch (error) {
      if (error instanceof ApiError) {
        const fieldMap = {
          email: "email",
          password: "password",
          password_confirm: "confirmPassword",
          artist_name: "artistName",
          portfolio_url: "portfolioUrl",
        } as const;
        for (const [field, messages] of Object.entries(error.fields ?? {})) {
          const formField = fieldMap[field as keyof typeof fieldMap];
          if (formField && messages[0]) {
            setError(formField, { message: language === "fa" ? t.validation.invalidField : messages[0] });
          }
        }
      }
      if (error instanceof ApiError && error.code === "email_exists") {
        setError("email", { message: t.registerArtist.emailExists }, { shouldFocus: true });
        return;
      }
      if (error instanceof ApiError && error.code === "artist_application_exists") {
        setServerError(t.registerArtist.alreadyPending);
        return;
      }
      setServerError(error instanceof ApiError ? error.message : t.registerArtist.failed);
    }
  };

  if (submitted) {
    return (
      <div className="text-center space-y-4 py-8">
        <div className="text-4xl">🎵</div>
        <h2 className="text-xl font-semibold dark:text-white">{t.registerArtist.submittedTitle}</h2>
        <p className="text-zinc-500 dark:text-zinc-400">{t.registerArtist.submittedMessage}</p>
        <Link to="/login" className="inline-block text-green-600 hover:underline">{t.registerArtist.backToLogin}</Link>
      </div>
    );
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit, (formErrors) => {
        setInvalidSubmit(true);
        const first = (["email", "password", "confirmPassword", "artistName", "portfolioUrl"] as const)
          .find((field) => formErrors[field]);
        if (first) setFocus(first);
      })}
      className="space-y-4"
    >
      {invalidSubmit && Object.keys(errors).length > 0 && (
        <p role="alert" className="rounded-lg bg-red-950/30 p-3 text-sm text-red-400">
          {t.validation.formSummary}
        </p>
      )}
      {serverError && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">{serverError}</div>
      )}
      <Input label={t.registerArtist.emailLabel} type="email" placeholder={t.registerArtist.emailPlaceholder} error={errors.email?.message} {...register("email")} />
      <PasswordInput label={t.registerArtist.passwordLabel} placeholder={t.registerArtist.passwordPlaceholder} error={errors.password?.message} autoComplete="new-password" {...register("password")} />
      <PasswordInput label={t.register.confirmPasswordLabel} placeholder={t.register.confirmPasswordPlaceholder} error={errors.confirmPassword?.message} autoComplete="new-password" {...register("confirmPassword")} />
      <Input label={t.registerArtist.artistNameLabel} placeholder={t.registerArtist.artistNamePlaceholder} error={errors.artistName?.message} {...register("artistName")} />
      <Input label={t.registerArtist.portfolioUrlLabel} placeholder={t.registerArtist.portfolioUrlPlaceholder} error={errors.portfolioUrl?.message} {...register("portfolioUrl")} />
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? t.registerArtist.submitting : t.registerArtist.submit}
      </Button>
      <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
        {t.registerArtist.hasAccount}{" "}
        <Link to="/login" className="text-green-600 hover:underline">{t.registerArtist.signIn}</Link>
      </p>
    </form>
  );
}
