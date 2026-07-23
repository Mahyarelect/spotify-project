import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createAuthSchemas, MIN_AGE_YEARS, MAX_AGE_YEARS, dateInputValueYearsAgo } from "@/lib/validation/authSchemas";
import { useAuth } from "@/lib/hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Button } from "@/components/ui/Button";
import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { ROUTES } from "@/lib/constants/routes";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { z } from "zod";
import { ApiError } from "@/lib/api/apiError";

type RegisterFormValues = z.input<ReturnType<typeof createAuthSchemas>["register"]>;

export function RegisterForm() {
  const { t, language } = useTranslation();
  const { registerListener } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");
  const [policyOpen, setPolicyOpen] = useState(false);
  const [invalidSubmit, setInvalidSubmit] = useState(false);
  const schema = useMemo(() => createAuthSchemas(t.validation).register, [t]);

  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    trigger,
    watch,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    reValidateMode: "onChange",
  });
  const password = watch("password");

  useEffect(() => {
    if (dirtyFields.confirmPassword) void trigger("confirmPassword");
  }, [dirtyFields.confirmPassword, password, trigger]);

  const onSubmit = async (data: RegisterFormValues) => {
    setServerError("");
    setInvalidSubmit(false);
    try {
      await registerListener({
        displayName: data.displayName,
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
        birthDate: data.birthDate,
        gender: data.gender,
        acceptPolicy: data.acceptPolicy,
      });
      navigate(ROUTES.HOME);
    } catch (error) {
      if (error instanceof ApiError) {
        const fieldMap: Record<string, keyof RegisterFormValues> = {
          display_name: "displayName",
          email: "email",
          password: "password",
          password_confirm: "confirmPassword",
          birth_date: "birthDate",
          gender: "gender",
          accept_policy: "acceptPolicy",
        };
        for (const [field, messages] of Object.entries(error.fields ?? {})) {
          const formField = fieldMap[field];
          if (formField && messages[0]) {
            setError(formField, { message: language === "fa" ? t.validation.invalidField : messages[0] });
          }
        }
      }
      if (error instanceof ApiError && error.code === "email_exists") {
        setError("email", { message: t.register.emailExists }, { shouldFocus: true });
        return;
      }
      setServerError(error instanceof ApiError ? error.message : t.register.failed);
    }
  };

  return (
    <>
      <form
        noValidate
        onSubmit={handleSubmit(onSubmit, (formErrors) => {
          setInvalidSubmit(true);
          const first = ([
            "displayName",
            "email",
            "password",
            "confirmPassword",
            "birthDate",
            "gender",
            "acceptPolicy",
          ] as const).find((field) => formErrors[field]);
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
          <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
            {serverError}
          </div>
        )}
        <Input label={t.register.displayNameLabel} placeholder={t.register.displayNamePlaceholder} error={errors.displayName?.message} {...register("displayName")} />
        <Input label={t.register.emailLabel} type="email" placeholder={t.register.emailPlaceholder} error={errors.email?.message} {...register("email")} />
        <PasswordInput label={t.register.passwordLabel} placeholder={t.register.passwordPlaceholder} error={errors.password?.message} autoComplete="new-password" {...register("password")} />
        <PasswordInput label={t.register.confirmPasswordLabel} placeholder={t.register.confirmPasswordPlaceholder} error={errors.confirmPassword?.message} autoComplete="new-password" {...register("confirmPassword")} />
        <Input
          label={t.register.birthDateLabel}
          type="date"
          min={dateInputValueYearsAgo(MAX_AGE_YEARS)}
          max={dateInputValueYearsAgo(MIN_AGE_YEARS)}
          error={errors.birthDate?.message}
          {...register("birthDate")}
        />
        <div className="space-y-1">
          <label htmlFor="gender" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t.register.genderLabel}</label>
          <select
            id="gender"
            aria-invalid={Boolean(errors.gender)}
            aria-describedby={errors.gender ? "gender-error" : undefined}
            className={`w-full rounded-lg border bg-white px-3 py-2 focus:outline-none focus:ring-2 dark:bg-zinc-800 dark:text-zinc-100 ${
              errors.gender ? "border-red-500 bg-red-50/60 focus:ring-red-500" : "border-zinc-300 focus:ring-green-500 dark:border-zinc-600"
            }`}
            {...register("gender")}
          >
            <option value="">{t.register.genderSelect}</option>
            <option value="male">{t.register.genderMale}</option>
            <option value="female">{t.register.genderFemale}</option>
            <option value="other">{t.register.genderOther}</option>
            <option value="unspecified">{t.register.genderUnspecified}</option>
          </select>
          <p id="gender-error" className={`min-h-5 text-sm text-red-500 ${errors.gender ? "" : "invisible"}`}>
            {errors.gender?.message ?? "\u00a0"}
          </p>
        </div>
        <div className={`rounded-lg border p-2 ${errors.acceptPolicy ? "border-red-500 bg-red-950/20" : "border-transparent"}`}>
          <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="acceptPolicy"
            aria-invalid={Boolean(errors.acceptPolicy)}
            aria-describedby={errors.acceptPolicy ? "accept-policy-error" : undefined}
            className="min-h-5 min-w-5 rounded border-zinc-300"
            {...register("acceptPolicy")}
          />
          <label htmlFor="acceptPolicy" className="text-sm text-zinc-600 dark:text-zinc-400">
            {t.register.acceptPolicy}{" "}
            <button type="button" onClick={() => setPolicyOpen(true)} className="text-green-600 hover:underline">
              {t.register.privacyPolicy}
            </button>
          </label>
          </div>
          <p id="accept-policy-error" className={`min-h-5 text-sm text-red-500 ${errors.acceptPolicy ? "" : "invisible"}`}>
            {errors.acceptPolicy?.message ?? "\u00a0"}
          </p>
        </div>
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? t.register.submitting : t.register.submit}
        </Button>
        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          {t.register.hasAccount}{" "}
          <Link to="/login" className="text-green-600 hover:underline">{t.register.signIn}</Link>
        </p>
      </form>

      <Modal open={policyOpen} onClose={() => setPolicyOpen(false)} title={t.register.policyTitle}>
        <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-3">
          <p><strong>{t.register.policyMockTitle}</strong></p>
          <p>{t.register.policyMockText}</p>
          <p>{t.register.policyProductionText}</p>
          <p>{t.register.policyAgreement}</p>
        </div>
      </Modal>
    </>
  );
}
