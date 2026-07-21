import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, MIN_AGE_YEARS, MAX_AGE_YEARS, dateInputValueYearsAgo } from "@/lib/validation/authSchemas";
import { useAuth } from "@/lib/hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { ROUTES } from "@/lib/constants/routes";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { z } from "zod";
import { ApiError } from "@/lib/api/apiError";

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const { t } = useTranslation();
  const { registerListener } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");
  const [policyOpen, setPolicyOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isValid },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema), mode: "onChange" });

  const onSubmit = async (data: RegisterFormValues) => {
    setServerError("");
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
          if (formField && messages[0]) setError(formField, { message: messages[0] });
        }
      }
      if (error instanceof ApiError && error.code === "email_exists") {
        setServerError(t.register.emailExists);
        return;
      }
      setServerError(error instanceof ApiError ? error.message : t.register.failed);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
            {serverError}
          </div>
        )}
        <Input label={t.register.displayNameLabel} placeholder={t.register.displayNamePlaceholder} error={errors.displayName?.message} {...register("displayName")} />
        <Input label={t.register.emailLabel} type="email" placeholder={t.register.emailPlaceholder} error={errors.email?.message} {...register("email")} />
        <Input label={t.register.passwordLabel} type="password" placeholder={t.register.passwordPlaceholder} error={errors.password?.message} {...register("password")} />
        <Input label={t.register.confirmPasswordLabel} type="password" placeholder={t.register.confirmPasswordPlaceholder} error={errors.confirmPassword?.message} {...register("confirmPassword")} />
        <Input
          label={t.register.birthDateLabel}
          type="date"
          min={dateInputValueYearsAgo(MAX_AGE_YEARS)}
          max={dateInputValueYearsAgo(MIN_AGE_YEARS)}
          error={errors.birthDate?.message}
          {...register("birthDate")}
        />
        <div className="space-y-1">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t.register.genderLabel}</label>
          <select
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-zinc-800 dark:border-zinc-600 dark:text-zinc-100 border-zinc-300"
            {...register("gender")}
          >
            <option value="">{t.register.genderSelect}</option>
            <option value="male">{t.register.genderMale}</option>
            <option value="female">{t.register.genderFemale}</option>
            <option value="other">{t.register.genderOther}</option>
            <option value="unspecified">{t.register.genderUnspecified}</option>
          </select>
          {errors.gender && <p className="text-sm text-red-500">{errors.gender.message}</p>}
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="acceptPolicy" className="rounded border-zinc-300" {...register("acceptPolicy")} />
          <label htmlFor="acceptPolicy" className="text-sm text-zinc-600 dark:text-zinc-400">
            {t.register.acceptPolicy}{" "}
            <button type="button" onClick={() => setPolicyOpen(true)} className="text-green-600 hover:underline">
              {t.register.privacyPolicy}
            </button>
          </label>
        </div>
        {errors.acceptPolicy && <p className="text-sm text-red-500">{errors.acceptPolicy.message}</p>}
        <Button type="submit" disabled={!isValid || isSubmitting} className="w-full">
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
